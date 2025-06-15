import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { createPrivateChannelName } from "~/lib/utils";
import { db } from "~/server/db";
import {
  conversations,
  messages,
  users,
  type Conversation,
  type Message,
  type NewConversation,
  type NewMessage,
} from "~/server/db/schema";

export interface CreateConversationInput {
  readonly participant1Id: string;
  readonly participant2Id: string;
}

export interface SendMessageInput {
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly type?: "text" | "image" | "file" | "system";
  readonly attachments?: string;
}

export interface GetConversationsInput {
  readonly userId: string;
  readonly cursor?: {
    readonly id: string;
    readonly lastMessageAt: string;
  };
  readonly limit?: number;
}

export interface GetMessagesInput {
  readonly conversationId: string;
  readonly userId: string; // For authorization
  readonly cursor?: {
    readonly id: string;
    readonly createdAt: Date;
  };
  readonly limit?: number;
}

export interface ConversationWithDetails extends Conversation {
  readonly participant1: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl: string | null;
  };
  readonly participant2: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl: string | null;
  };
  readonly lastMessage?: {
    readonly id: string;
    readonly content: string | null;
    readonly type: string;
    readonly createdAt: Date;
  } | null;
  readonly unreadCount: number;
}

export interface MessageWithDetails extends Message {
  readonly sender: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl: string | null;
  };
}

/**
 * Create or get existing conversation between two users
 */
export async function createOrGetConversation(
  input: CreateConversationInput,
): Promise<Conversation> {
  try {
    const { participant1Id, participant2Id } = input;

    // Don't create conversation with self
    if (participant1Id === participant2Id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot create conversation with yourself",
      });
    }

    // Create channel name using the utility function
    const channelName = createPrivateChannelName(
      participant1Id,
      participant2Id,
    );

    // Check if conversation already exists
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.channelName, channelName))
      .limit(1);

    if (existingConversation[0]) {
      return existingConversation[0];
    }

    // Sort participant IDs to ensure consistent ordering
    const [sortedParticipant1, sortedParticipant2] = [
      participant1Id,
      participant2Id,
    ].sort() as [string, string];

    const conversationData: NewConversation = {
      channelName,
      participant1Id: sortedParticipant1,
      participant2Id: sortedParticipant2,
      lastMessageAt: new Date().toISOString(),
    };

    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();

    if (!conversation) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create conversation",
      });
    }

    return conversation;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Send a message and emit real-time event
 */
export async function sendMessage(input: SendMessageInput): Promise<Message> {
  try {
    const {
      conversationId,
      senderId,
      content,
      type = "text",
      attachments,
    } = input;

    // Verify conversation exists and user is a participant
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    const conv = conversation[0];
    if (conv.participant1Id !== senderId && conv.participant2Id !== senderId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a participant in this conversation",
      });
    }

    const messageData: NewMessage = {
      conversationId,
      senderId,
      content,
      type,
      attachments,
      status: "sent",
    };

    const [message] = await db.insert(messages).values(messageData).returning();

    if (!message) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send message",
      });
    }

    // Update conversation's last message info and unread counts
    const recipientId =
      conv.participant1Id === senderId
        ? conv.participant2Id
        : conv.participant1Id;
    const isParticipant1Sender = conv.participant1Id === senderId;

    const newUnreadCount1 = isParticipant1Sender
      ? "0"
      : String(Number(conv.unreadCountParticipant1) + 1);
    const newUnreadCount2 = !isParticipant1Sender
      ? "0"
      : String(Number(conv.unreadCountParticipant2) + 1);

    await db
      .update(conversations)
      .set({
        lastMessageId: message.id,
        lastMessageAt: message.createdAt.toISOString(),
        unreadCountParticipant1: newUnreadCount1,
        unreadCountParticipant2: newUnreadCount2,
      })
      .where(eq(conversations.id, conversationId));

    // Get sender info for real-time event
    const [sender] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    if (!sender) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sender not found",
      });
    }

    try {
      // Emit to conversation channel
      await ably.channels.get(conv.channelName).publish("message", {
        type: "new_message",
        message: {
          ...message,
          sender,
        },
        timestamp: message.createdAt,
      });

      // Notify recipient of new message (for sidebar badge, etc.)
      const recipientUnreadCount = isParticipant1Sender
        ? Number(newUnreadCount2)
        : Number(newUnreadCount1);
      await ably.channels.get(`messages:${recipientId}`).publish("message", {
        type: "new_message",
        conversationId,
        unreadCount: recipientUnreadCount,
        lastMessage: {
          id: message.id,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
        },
        sender,
        timestamp: message.createdAt,
      });

      console.log(
        `✅ Published message to channels: ${conv.channelName} and messages:${recipientId}`,
        {
          messageId: message.id,
          senderId,
          recipientId,
          conversationId,
        },
      );
    } catch (ablyError) {
      console.error("❌ Failed to publish message to Ably:", ablyError);
      // Don't throw error, just log it - message was still created in DB
    }

    return message;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get conversations for a user with pagination
 */
export async function getConversations(input: GetConversationsInput): Promise<{
  conversations: ConversationWithDetails[];
  nextCursor?: { id: string; lastMessageAt: string };
}> {
  try {
    const { userId, cursor, limit = 20 } = input;

    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId),
          ),
          cursor
            ? or(
                lt(conversations.lastMessageAt, cursor.lastMessageAt),
                and(
                  eq(conversations.lastMessageAt, cursor.lastMessageAt),
                  lt(conversations.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.id))
      .limit(limit + 1);

    // Get participant details
    const participantIds = [
      ...new Set(
        userConversations.flatMap((c) => [c.participant1Id, c.participant2Id]),
      ),
    ];

    const participants =
      participantIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              imageUrl: users.imageUrl,
            })
            .from(users)
            .where(inArray(users.id, participantIds))
        : [];

    // Get last messages
    const lastMessageIds = userConversations
      .map((c) => c.lastMessageId)
      .filter(Boolean) as string[];

    const lastMessages =
      lastMessageIds.length > 0
        ? await db
            .select({
              id: messages.id,
              content: messages.content,
              type: messages.type,
              createdAt: messages.createdAt,
            })
            .from(messages)
            .where(inArray(messages.id, lastMessageIds))
        : [];

    // Combine conversations with details
    const conversationsWithDetails: ConversationWithDetails[] =
      userConversations.map((conversation) => {
        const participant1 = participants.find(
          (p) => p.id === conversation.participant1Id,
        );
        const participant2 = participants.find(
          (p) => p.id === conversation.participant2Id,
        );
        const lastMessage = lastMessages.find(
          (m) => m.id === conversation.lastMessageId,
        );

        // Calculate unread count for current user
        const isUserParticipant1 = conversation.participant1Id === userId;
        const unreadCount = isUserParticipant1
          ? Number(conversation.unreadCountParticipant1)
          : Number(conversation.unreadCountParticipant2);

        return {
          ...conversation,
          participant1: participant1 ?? {
            id: conversation.participant1Id,
            name: "Unknown User",
            username: "unknown",
            imageUrl: null,
          },
          participant2: participant2 ?? {
            id: conversation.participant2Id,
            name: "Unknown User",
            username: "unknown",
            imageUrl: null,
          },
          lastMessage: lastMessage ?? null,
          unreadCount,
        };
      });

    let nextCursor: { id: string; lastMessageAt: string } | undefined =
      undefined;
    if (userConversations.length > limit) {
      const nextItem = userConversations.pop()!;
      nextCursor = {
        id: nextItem.id,
        lastMessageAt: nextItem.lastMessageAt ?? "",
      };
    }

    return {
      conversations: conversationsWithDetails,
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
 * Get messages in a conversation with pagination
 */
export async function getMessages(input: GetMessagesInput): Promise<{
  messages: MessageWithDetails[];
  nextCursor?: { id: string; createdAt: Date };
}> {
  try {
    const { conversationId, userId, cursor, limit = 50 } = input;

    // Verify user is a participant in the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    const conv = conversation[0];
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a participant in this conversation",
      });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          cursor
            ? or(
                lt(messages.createdAt, cursor.createdAt),
                and(
                  eq(messages.createdAt, cursor.createdAt),
                  lt(messages.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    // Get sender details
    const senderIds = [...new Set(conversationMessages.map((m) => m.senderId))];

    const senders =
      senderIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              imageUrl: users.imageUrl,
            })
            .from(users)
            .where(inArray(users.id, senderIds))
        : [];

    // Combine messages with sender details
    const messagesWithDetails: MessageWithDetails[] = conversationMessages.map(
      (message) => {
        const sender = senders.find((s) => s.id === message.senderId);

        return {
          ...message,
          sender: sender ?? {
            id: message.senderId,
            name: "Unknown User",
            username: "unknown",
            imageUrl: null,
          },
        };
      },
    );

    let nextCursor: { id: string; createdAt: Date } | undefined = undefined;
    if (conversationMessages.length > limit) {
      const nextItem = conversationMessages.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      messages: messagesWithDetails,
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
 * Mark messages as read in a conversation
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<{ count: number }> {
  try {
    // Verify user is a participant
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    const conv = conversation[0];
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a participant in this conversation",
      });
    }

    // Reset unread count for the user
    const isUserParticipant1 = conv.participant1Id === userId;
    const updateData = isUserParticipant1
      ? { unreadCountParticipant1: "0" }
      : { unreadCountParticipant2: "0" };

    const result = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId));

    return { count: Number(result.count) };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get total unread message count for a user across all conversations
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const userConversations = await db
      .select({
        unreadCountParticipant1: conversations.unreadCountParticipant1,
        unreadCountParticipant2: conversations.unreadCountParticipant2,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId),
        ),
      );

    let totalUnread = 0;
    for (const conv of userConversations) {
      const isUserParticipant1 = conv.participant1Id === userId;
      const unreadCount = isUserParticipant1
        ? Number(conv.unreadCountParticipant1)
        : Number(conv.unreadCountParticipant2);
      totalUnread += unreadCount;
    }

    return totalUnread;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
