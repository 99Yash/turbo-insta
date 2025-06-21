import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { db } from "~/server/db";
import {
  conversations,
  messageReactions,
  messages,
  users,
  type Conversation,
  type Message,
  type MessageReaction,
  type NewConversation,
  type NewMessage,
  type NewMessageReaction,
} from "~/server/db/schema";
import type { StoredFile } from "~/types";

export type ConversationWithParticipants = Conversation & {
  readonly participant1: {
    readonly id: string;
    readonly username: string;
    readonly name: string;
    readonly imageUrl: string | null;
  };
  readonly participant2: {
    readonly id: string;
    readonly username: string;
    readonly name: string;
    readonly imageUrl: string | null;
  };
  readonly lastMessage?: Message | null;
  readonly unreadCount: number;
};

export type MessageWithSender = Message & {
  readonly sender: {
    readonly id: string;
    readonly username: string;
    readonly name: string;
    readonly imageUrl: string | null;
  };
  readonly reactions: Array<{
    readonly id: string;
    readonly emoji: string;
    readonly userId: string;
    readonly user: {
      readonly id: string;
      readonly name: string;
      readonly username: string;
    };
  }>;
};

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<ConversationWithParticipants> {
  try {
    // Always store participants in consistent order (lexicographically)
    const sortedIds = [userId, otherUserId].sort();
    const participant1Id = sortedIds[0]!;
    const participant2Id = sortedIds[1]!;

    // First try to find existing conversation
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, participant1Id),
          eq(conversations.participant2Id, participant2Id),
        ),
      )
      .limit(1);

    let conversation: Conversation;
    if (existingConversation.length > 0) {
      conversation = existingConversation[0]!;
    } else {
      // Create new conversation if it doesn't exist
      const newConversationData: NewConversation = {
        participant1Id,
        participant2Id,
      };

      const [newConversation] = await db
        .insert(conversations)
        .values(newConversationData)
        .returning();

      if (!newConversation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }

      conversation = newConversation;
    }

    // Get participant details
    const [participant1, participant2] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          imageUrl: users.imageUrl,
        })
        .from(users)
        .where(eq(users.id, conversation.participant1Id))
        .limit(1),
      db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          imageUrl: users.imageUrl,
        })
        .from(users)
        .where(eq(users.id, conversation.participant2Id))
        .limit(1),
    ]);

    // Get last message
    const lastMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const isParticipant1 = conversation.participant1Id === userId;
    const userDeletedAt = isParticipant1
      ? conversation.participant1DeletedAt
      : conversation.participant2DeletedAt;

    // If user deleted conversation and last message is before deletion, hide last message
    let filteredLastMessage = lastMessage[0] ?? null;
    if (
      userDeletedAt &&
      filteredLastMessage &&
      filteredLastMessage.createdAt <= userDeletedAt
    ) {
      filteredLastMessage = null;
    }

    // Calculate unread count - count messages from other participant after user's last seen time
    const userLastSeenAt = isParticipant1
      ? conversation.participant1LastSeenAt
      : conversation.participant2LastSeenAt;

    const otherParticipantId = isParticipant1
      ? conversation.participant2Id
      : conversation.participant1Id;

    let unreadCount = 0;
    if (userLastSeenAt) {
      const whereConditions = [
        eq(messages.conversationId, conversation.id),
        eq(messages.senderId, otherParticipantId),
        gt(messages.createdAt, userLastSeenAt),
      ];

      if (userDeletedAt) {
        whereConditions.push(gt(messages.createdAt, userDeletedAt));
      }

      const unreadMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(...whereConditions));
      unreadCount = unreadMessages.length;
    } else {
      // If user has never seen messages, count all messages from other participant
      const whereConditions = [
        eq(messages.conversationId, conversation.id),
        eq(messages.senderId, otherParticipantId),
      ];

      if (userDeletedAt) {
        whereConditions.push(gt(messages.createdAt, userDeletedAt));
      }

      const unreadMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(...whereConditions));
      unreadCount = unreadMessages.length;
    }

    // Ensure participants exist in database
    if (participant1.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Participant 1 with ID ${conversation.participant1Id} not found`,
      });
    }

    if (participant2.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Participant 2 with ID ${conversation.participant2Id} not found`,
      });
    }

    return {
      ...conversation,
      participant1: participant1[0]!,
      participant2: participant2[0]!,
      lastMessage: filteredLastMessage,
      unreadCount,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(
  userId: string,
  limit = 10,
): Promise<ConversationWithParticipants[]> {
  try {
    // Get conversations where user is a participant
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId),
        ),
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);

    if (userConversations.length === 0) {
      return [];
    }

    // ===== BATCH QUERIES TO ELIMINATE N+1 PROBLEMS =====

    // 1. Batch fetch all unique participant IDs
    const uniqueParticipantIds = Array.from(
      new Set([
        ...userConversations.map((conv) => conv.participant1Id),
        ...userConversations.map((conv) => conv.participant2Id),
      ]),
    );

    const allParticipants = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(inArray(users.id, uniqueParticipantIds));

    const participantsMap = new Map(
      allParticipants.map((participant) => [participant.id, participant]),
    );

    // 2. Batch fetch last messages for all conversations
    const conversationIds = userConversations.map((conv) => conv.id);
    const allLastMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(desc(messages.createdAt));

    // Group messages by conversation ID to get the latest message for each
    const lastMessagesByConversationId = new Map<string, Message>();
    allLastMessages.forEach((message) => {
      const existingMessage = lastMessagesByConversationId.get(
        message.conversationId,
      );
      if (!existingMessage || message.createdAt > existingMessage.createdAt) {
        lastMessagesByConversationId.set(message.conversationId, message);
      }
    });

    // 3. Batch fetch all messages for unread count calculation
    const allMessagesForUnread = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(desc(messages.createdAt));

    // Calculate unread counts for each conversation
    const unreadCountsMap = new Map<string, number>();
    userConversations.forEach((conversation) => {
      const isParticipant1 = conversation.participant1Id === userId;
      const userLastSeenAt = isParticipant1
        ? conversation.participant1LastSeenAt
        : conversation.participant2LastSeenAt;
      const userDeletedAt = isParticipant1
        ? conversation.participant1DeletedAt
        : conversation.participant2DeletedAt;
      const otherParticipantId = isParticipant1
        ? conversation.participant2Id
        : conversation.participant1Id;

      const conversationMessages = allMessagesForUnread.filter(
        (msg) => msg.conversationId === conversation.id,
      );

      let unreadCount = 0;
      if (userLastSeenAt) {
        unreadCount = conversationMessages.filter((msg) => {
          const isFromOtherParticipant = msg.senderId === otherParticipantId;
          const isAfterLastSeen = msg.createdAt > userLastSeenAt;
          const isAfterDeletion = userDeletedAt
            ? msg.createdAt > userDeletedAt
            : true;

          return isFromOtherParticipant && isAfterLastSeen && isAfterDeletion;
        }).length;
      } else {
        // If user has never seen messages, count all messages from other participant
        unreadCount = conversationMessages.filter((msg) => {
          const isFromOtherParticipant = msg.senderId === otherParticipantId;
          const isAfterDeletion = userDeletedAt
            ? msg.createdAt > userDeletedAt
            : true;

          return isFromOtherParticipant && isAfterDeletion;
        }).length;
      }

      unreadCountsMap.set(conversation.id, unreadCount);
    });

    // 4. Combine all data
    const conversationsWithDetails = userConversations.map((conversation) => {
      const participant1 = participantsMap.get(conversation.participant1Id);
      const participant2 = participantsMap.get(conversation.participant2Id);

      // Ensure participants exist in database
      if (!participant1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Participant 1 with ID ${conversation.participant1Id} not found`,
        });
      }

      if (!participant2) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Participant 2 with ID ${conversation.participant2Id} not found`,
        });
      }

      const lastMessage =
        lastMessagesByConversationId.get(conversation.id) ?? null;
      const isParticipant1 = conversation.participant1Id === userId;
      const userDeletedAt = isParticipant1
        ? conversation.participant1DeletedAt
        : conversation.participant2DeletedAt;

      // If user deleted conversation and last message is before deletion, hide last message
      let filteredLastMessage = lastMessage;
      if (
        userDeletedAt &&
        filteredLastMessage &&
        filteredLastMessage.createdAt <= userDeletedAt
      ) {
        filteredLastMessage = null;
      }

      const unreadCount = unreadCountsMap.get(conversation.id) ?? 0;

      return {
        ...conversation,
        participant1,
        participant2,
        lastMessage: filteredLastMessage,
        unreadCount,
      };
    });

    return conversationsWithDetails;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get messages in a conversation for a specific user
 */
export async function getConversationMessages(
  userId: string,
  conversationId: string,
  limit = 50,
  cursor?: string,
): Promise<{
  readonly messages: MessageWithSender[];
  readonly nextCursor?: string;
}> {
  try {
    // First verify user is part of this conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId),
          ),
        ),
      )
      .limit(1);

    if (conversation.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to view this conversation",
      });
    }

    const conv = conversation[0]!;
    const isParticipant1 = conv.participant1Id === userId;
    const userDeletedAt = isParticipant1
      ? conv.participant1DeletedAt
      : conv.participant2DeletedAt;

    // Build messages query conditions
    const whereConditions = [eq(messages.conversationId, conversationId)];

    if (userDeletedAt) {
      whereConditions.push(gt(messages.createdAt, userDeletedAt));
    }

    if (cursor) {
      whereConditions.push(lt(messages.createdAt, new Date(cursor)));
    }

    // Get messages
    const messagesData = await db
      .select()
      .from(messages)
      .where(and(...whereConditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);

    // Check if we have more items
    const hasNextPage = messagesData.length > limit;
    const messagesSlice = hasNextPage
      ? messagesData.slice(0, -1)
      : messagesData;

    if (messagesSlice.length === 0) {
      return {
        messages: [],
        nextCursor: undefined,
      };
    }

    // ===== BATCH QUERIES TO ELIMINATE N+1 PROBLEMS =====

    // 1. Batch fetch all unique senders
    const uniqueSenderIds = Array.from(
      new Set(messagesSlice.map((msg) => msg.senderId)),
    );

    const senders = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(inArray(users.id, uniqueSenderIds));

    const sendersMap = new Map(senders.map((sender) => [sender.id, sender]));

    // 2. Batch fetch all reactions for all messages
    const messageIds = messagesSlice.map((msg) => msg.id);
    const allReactions = await db
      .select()
      .from(messageReactions)
      .where(inArray(messageReactions.messageId, messageIds))
      .orderBy(desc(messageReactions.createdAt));

    // 3. Batch fetch all users who reacted
    const uniqueReactionUserIds = Array.from(
      new Set(allReactions.map((reaction) => reaction.userId)),
    );

    const reactionUsers =
      uniqueReactionUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
            })
            .from(users)
            .where(inArray(users.id, uniqueReactionUserIds))
        : [];

    const reactionUsersMap = new Map(
      reactionUsers.map((user) => [user.id, user]),
    );

    // 4. Group reactions by message ID
    const reactionsByMessageId = new Map<
      string,
      Array<{
        readonly id: string;
        readonly emoji: string;
        readonly userId: string;
        readonly user: {
          readonly id: string;
          readonly name: string;
          readonly username: string;
        };
      }>
    >();

    allReactions.forEach((reaction) => {
      const user = reactionUsersMap.get(reaction.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User with ID ${reaction.userId} not found for reaction`,
        });
      }

      const messageReactions =
        reactionsByMessageId.get(reaction.messageId) ?? [];
      messageReactions.push({
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        user,
      });
      reactionsByMessageId.set(reaction.messageId, messageReactions);
    });

    // 5. Combine all data
    const messagesWithSender = messagesSlice.map((message) => {
      const sender = sendersMap.get(message.senderId);
      if (!sender) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Sender with ID ${message.senderId} not found`,
        });
      }

      const reactions = reactionsByMessageId.get(message.id) ?? [];

      return {
        ...message,
        sender,
        reactions,
      };
    });

    const nextCursor = hasNextPage
      ? messagesSlice[messagesSlice.length - 1]?.createdAt.toISOString()
      : undefined;

    return {
      messages: messagesWithSender,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  text: string,
  files?: StoredFile[],
): Promise<MessageWithSender> {
  try {
    // Get or create conversation
    const conversation = await getOrCreateConversation(senderId, receiverId);

    // Create message
    const newMessageData: NewMessage = {
      conversationId: conversation.id,
      senderId,
      receiverId,
      text,
      files,
    };

    const [newMessage] = await db
      .insert(messages)
      .values(newMessageData)
      .returning();

    if (!newMessage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send message",
      });
    }

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversation.id));

    // Get sender info
    const sender = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    if (sender.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sender not found",
      });
    }

    const messageWithSender = {
      ...newMessage,
      sender: sender[0]!,
      reactions: [], // New messages have no reactions initially
    };

    // Publish message to Ably channels for real-time updates
    try {
      // Publish to conversation channel for real-time message updates
      const conversationChannelName = `conversation:${conversation.id}`;
      await ably.channels.get(conversationChannelName).publish("message", {
        type: "new_message",
        message: messageWithSender,
        conversationId: conversation.id,
        timestamp: newMessage.createdAt,
      });

      // Publish to both users' personal channels for conversation list updates
      const updatedConversation = {
        ...conversation,
        lastMessage: newMessage,
      };

      await Promise.all([
        ably.channels
          .get(`messages:${senderId}`)
          .publish("conversation_update", {
            type: "conversation_updated",
            conversation: updatedConversation,
            timestamp: newMessage.createdAt,
          }),
        ably.channels
          .get(`messages:${receiverId}`)
          .publish("conversation_update", {
            type: "conversation_updated",
            conversation: updatedConversation,
            timestamp: newMessage.createdAt,
          }),
      ]);

      console.log(`✅ Published message to Ably channels:`, {
        conversationChannel: conversationChannelName,
        senderId,
        receiverId,
        messageId: newMessage.id,
      });
    } catch (ablyError) {
      console.error("❌ Failed to publish message to Ably:", ablyError);
      // Don't throw error, message was still created in DB
    }

    return messageWithSender;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Delete conversation for a specific user
 */
export async function deleteConversationForUser(
  userId: string,
  conversationId: string,
): Promise<{ success: boolean }> {
  try {
    // Verify user is part of conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId),
          ),
        ),
      )
      .limit(1);

    if (conversation.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this conversation",
      });
    }

    const conv = conversation[0]!;
    const isParticipant1 = conv.participant1Id === userId;
    const now = new Date();

    // Update the appropriate deleted timestamp
    await db
      .update(conversations)
      .set({
        participant1DeletedAt: isParticipant1
          ? now
          : conv.participant1DeletedAt,
        participant2DeletedAt: !isParticipant1
          ? now
          : conv.participant2DeletedAt,
      })
      .where(eq(conversations.id, conversationId));

    return { success: true };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Add a reaction to a message
 */
export async function addMessageReaction({
  messageId,
  userId,
  emoji,
}: {
  readonly messageId: string;
  readonly userId: string;
  readonly emoji: string;
}): Promise<MessageReaction> {
  try {
    // Check if user already has a reaction on this message
    const existingReaction = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
        ),
      )
      .limit(1);

    let reaction: MessageReaction;
    let isUpdate = false;

    if (existingReaction.length > 0) {
      // Update existing reaction
      const [updatedReaction] = await db
        .update(messageReactions)
        .set({ emoji })
        .where(eq(messageReactions.id, existingReaction[0]!.id))
        .returning();

      if (!updatedReaction) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update reaction",
        });
      }

      reaction = updatedReaction;
      isUpdate = true;
      console.log(`🔄 [addMessageReaction] Updated existing reaction:`, {
        messageId,
        userId,
        emoji,
        reactionId: reaction.id,
      });
    } else {
      // Create new reaction
      const newReactionData: NewMessageReaction = {
        messageId,
        userId,
        emoji,
      };

      const [newReaction] = await db
        .insert(messageReactions)
        .values(newReactionData)
        .returning();

      if (!newReaction) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add reaction",
        });
      }

      reaction = newReaction;
      console.log(`✅ [addMessageReaction] Created new reaction:`, {
        messageId,
        userId,
        emoji,
        reactionId: reaction.id,
      });
    }

    // Publish real-time update for both new reactions and updates
    try {
      const [message, user] = await Promise.all([
        db.select().from(messages).where(eq(messages.id, messageId)).limit(1),
        db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1),
      ]);

      if (message.length > 0 && user.length > 0) {
        const conversationChannelName = `conversation:${message[0]!.conversationId}`;
        const eventData = {
          type: "reaction_added" as const,
          messageId,
          reaction: {
            id: reaction.id,
            emoji: reaction.emoji,
            userId: reaction.userId,
            user: user[0]!,
          },
          timestamp: new Date(),
        };

        await ably.channels
          .get(conversationChannelName)
          .publish("reaction", eventData);

        console.log(`🚀 [addMessageReaction] Published reaction event:`, {
          channel: conversationChannelName,
          type: isUpdate ? "update" : "add",
          messageId,
          userId,
          emoji,
        });
      } else {
        console.error(
          `❌ [addMessageReaction] Could not find message or user for real-time event:`,
          {
            messageId,
            userId,
            messageFound: message.length > 0,
            userFound: user.length > 0,
          },
        );
      }
    } catch (error) {
      console.error(
        "❌ [addMessageReaction] Failed to publish reaction event:",
        error,
      );
      // Don't throw - reaction was saved successfully
    }

    return reaction;
  } catch (e) {
    console.error("❌ [addMessageReaction] Database error:", e);
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Remove a user's reaction from a message
 */
export async function removeMessageReaction({
  messageId,
  userId,
}: {
  readonly messageId: string;
  readonly userId: string;
}): Promise<void> {
  try {
    const deletedReactions = await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
        ),
      )
      .returning();

    if (deletedReactions.length > 0) {
      console.log(`✅ [removeMessageReaction] Removed reaction:`, {
        messageId,
        userId,
        reactionId: deletedReactions[0]!.id,
      });
    } else {
      console.warn(`⚠️ [removeMessageReaction] No reaction found to remove:`, {
        messageId,
        userId,
      });
    }

    // Publish real-time update for the removed reaction
    try {
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (message.length > 0) {
        const conversationChannelName = `conversation:${message[0]!.conversationId}`;
        const eventData = {
          type: "reaction_removed" as const,
          messageId,
          userId,
          timestamp: new Date(),
        };

        await ably.channels
          .get(conversationChannelName)
          .publish("reaction", eventData);

        console.log(
          `🚀 [removeMessageReaction] Published reaction removal event:`,
          {
            channel: conversationChannelName,
            messageId,
            userId,
          },
        );
      } else {
        console.error(
          `❌ [removeMessageReaction] Could not find message for real-time event:`,
          {
            messageId,
            userId,
          },
        );
      }
    } catch (error) {
      console.error(
        "❌ [removeMessageReaction] Failed to publish reaction removal event:",
        error,
      );
      // Don't throw - reaction was removed successfully
    }
  } catch (e) {
    console.error("❌ [removeMessageReaction] Database error:", e);
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Mark a conversation as read by updating the user's lastSeenAt timestamp
 */
export async function markConversationAsRead(
  userId: string,
  conversationId: string,
): Promise<{ success: boolean }> {
  try {
    // Verify user is part of conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId),
          ),
        ),
      )
      .limit(1);

    if (conversation.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this conversation",
      });
    }

    const conv = conversation[0]!;
    const isParticipant1 = conv.participant1Id === userId;
    const now = new Date();

    // Update the appropriate lastSeenAt timestamp
    await db
      .update(conversations)
      .set({
        participant1LastSeenAt: isParticipant1
          ? now
          : conv.participant1LastSeenAt,
        participant2LastSeenAt: !isParticipant1
          ? now
          : conv.participant2LastSeenAt,
      })
      .where(eq(conversations.id, conversationId));

    console.log(`✅ [markConversationAsRead] Marked conversation as read:`, {
      conversationId,
      userId,
      isParticipant1,
      timestamp: now,
    });

    return { success: true };
  } catch (e) {
    console.error("❌ [markConversationAsRead] Database error:", e);
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
