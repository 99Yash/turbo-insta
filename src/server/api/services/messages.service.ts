import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, gt, lt, or } from "drizzle-orm";
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

    return {
      ...conversation,
      participant1: participant1[0]!,
      participant2: participant2[0]!,
      lastMessage: filteredLastMessage,
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

    // Get participant details and last messages for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conversation) => {
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

        return {
          ...conversation,
          participant1: participant1[0]!,
          participant2: participant2[0]!,
          lastMessage: filteredLastMessage,
        };
      }),
    );

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

    // Get sender details for each message
    const messagesWithSender = await Promise.all(
      messagesSlice.map(async (message) => {
        const sender = await db
          .select({
            id: users.id,
            username: users.username,
            name: users.name,
            imageUrl: users.imageUrl,
          })
          .from(users)
          .where(eq(users.id, message.senderId))
          .limit(1);

        const reactions = await db
          .select()
          .from(messageReactions)
          .where(eq(messageReactions.messageId, message.id))
          .orderBy(desc(messageReactions.createdAt));

        const reactionDetails = await Promise.all(
          reactions.map(async (reaction) => {
            const user = await db
              .select({
                id: users.id,
                name: users.name,
                username: users.username,
              })
              .from(users)
              .where(eq(users.id, reaction.userId))
              .limit(1);

            return {
              id: reaction.id,
              emoji: reaction.emoji,
              userId: reaction.userId,
              user: user[0]!,
            };
          }),
        );

        return {
          ...message,
          sender: sender[0]!,
          reactions: reactionDetails,
        };
      }),
    );

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

      reaction = updatedReaction!;
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
