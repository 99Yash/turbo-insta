import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { createPrivateChannelName } from "~/lib/utils";
import { db } from "~/server/db";
import {
  conversations,
  messageReads,
  messages,
  users,
  type Conversation,
  type Message,
  type NewConversation,
  type NewMessage,
  type NewMessageRead,
} from "~/server/db/schema";
import type { StoredFile } from "~/types";

export interface CreateConversationInput {
  readonly participant1Id: string;
  readonly participant2Id: string;
}

export interface SendMessageInput {
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly type?: "text" | "image" | "file" | "system";
  readonly attachments?: StoredFile[];
}

export interface GetConversationsInput {
  readonly userId: string;
  readonly cursor?: { id: string; createdAt: Date };
  readonly limit?: number;
}

export interface GetConversationInput {
  readonly conversationId: string;
  readonly userId: string;
}

export interface GetMessagesInput {
  readonly conversationId: string;
  readonly userId: string;
  readonly cursor?: { id: string; createdAt: Date };
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
  readonly channelName: string;
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

    // Sort participant IDs to ensure consistent ordering
    const [sortedParticipant1, sortedParticipant2] = [
      participant1Id,
      participant2Id,
    ].sort() as [string, string];

    // Check if conversation already exists
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, sortedParticipant1),
          eq(conversations.participant2Id, sortedParticipant2),
        ),
      )
      .limit(1);

    if (existingConversation[0]) {
      return existingConversation[0];
    }

    const conversationData: NewConversation = {
      participant1Id: sortedParticipant1,
      participant2Id: sortedParticipant2,
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
 * Get a single conversation by ID with details
 */
export async function getConversation(
  input: GetConversationInput,
): Promise<ConversationWithDetails> {
  try {
    const { conversationId, userId } = input;

    // Get the conversation and verify user is a participant
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a participant in this conversation",
      });
    }

    // Get participant details
    const participantIds = [
      conversation.participant1Id,
      conversation.participant2Id,
    ];

    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(inArray(users.id, participantIds));

    // Get last message
    const [lastMessage] = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    // Calculate unread count for current user
    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId),
        ),
      )
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId), // Don't count own messages
          isNull(messageReads.id), // Messages that haven't been read
        ),
      )
      .then((result) => result[0]?.count ?? 0);

    // Build participant details
    const participant1 = participants.find(
      (p) => p.id === conversation.participant1Id,
    );
    const participant2 = participants.find(
      (p) => p.id === conversation.participant2Id,
    );

    // Generate channel name
    const channelName = createPrivateChannelName(
      conversation.participant1Id,
      conversation.participant2Id,
    );

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
      channelName,
    };
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
    const conversation = await getConversation({
      conversationId,
      userId: senderId,
    });

    const messageData: NewMessage = {
      conversationId,
      senderId,
      content,
      type,
      attachments: attachments ?? null, // Drizzle handles JSON serialization automatically
    };

    const [message] = await db.insert(messages).values(messageData).returning();

    if (!message) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send message",
      });
    }

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

    // Get recipient ID
    const recipientId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

    try {
      // Emit to conversation channel
      await ably.channels.get(conversation.channelName).publish("message", {
        type: "new_message",
        message: {
          ...message,
          sender,
        },
        timestamp: message.createdAt,
      });

      // Calculate new unread count for recipient
      const recipientUnreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .leftJoin(
          messageReads,
          and(
            eq(messageReads.messageId, messages.id),
            eq(messageReads.userId, recipientId),
          ),
        )
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderId, recipientId), // Don't count recipient's own messages
            isNull(messageReads.id), // Messages that haven't been read
          ),
        )
        .then((result) => result[0]?.count ?? 0);

      // Notify recipient of new message (for sidebar badge, etc.)
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
        `✅ Published message to channels: ${conversation.channelName} and messages:${recipientId}`,
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
  nextCursor?: { id: string; createdAt: Date };
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
                lt(conversations.createdAt, cursor.createdAt),
                and(
                  eq(conversations.createdAt, cursor.createdAt),
                  lt(conversations.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(conversations.createdAt), desc(conversations.id))
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

    // Get last messages for each conversation
    const conversationIds = userConversations.map((c) => c.id);

    const lastMessagesSubquery = db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
        rowNumber:
          sql<number>`row_number() over (partition by ${messages.conversationId} order by ${messages.createdAt} desc)`.as(
            "row_number",
          ),
      })
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .as("ranked_messages");

    const lastMessages = await db
      .select({
        id: lastMessagesSubquery.id,
        conversationId: lastMessagesSubquery.conversationId,
        content: lastMessagesSubquery.content,
        type: lastMessagesSubquery.type,
        createdAt: lastMessagesSubquery.createdAt,
      })
      .from(lastMessagesSubquery)
      .where(eq(lastMessagesSubquery.rowNumber, 1));

    // Get unread counts for each conversation
    const unreadCounts = await db
      .select({
        conversationId: messages.conversationId,
        unreadCount: sql<number>`count(*)`,
      })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId),
        ),
      )
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, userId), // Don't count own messages
          isNull(messageReads.id), // Messages that haven't been read
        ),
      )
      .groupBy(messages.conversationId);

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
          (m) => m.conversationId === conversation.id,
        );
        const unreadData = unreadCounts.find(
          (u) => u.conversationId === conversation.id,
        );

        const channelName = createPrivateChannelName(
          conversation.participant1Id,
          conversation.participant2Id,
        );

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
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                type: lastMessage.type,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount: unreadData?.unreadCount ?? 0,
          channelName,
        };
      });

    let nextCursor: { id: string; createdAt: Date } | undefined = undefined;
    if (userConversations.length > limit) {
      const nextItem = userConversations.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
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
    await getConversation({ conversationId, userId });

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
    await getConversation({ conversationId, userId });

    // Get all unread messages in the conversation for this user
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId),
        ),
      )
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId), // Don't mark own messages as read
          isNull(messageReads.id), // Messages that haven't been read
        ),
      );

    if (unreadMessages.length === 0) {
      return { count: 0 };
    }

    // Insert read receipts for all unread messages
    const readReceipts: NewMessageRead[] = unreadMessages.map((message) => ({
      messageId: message.id,
      userId,
      readAt: new Date().toISOString(),
    }));

    await db.insert(messageReads).values(readReceipts);

    return { count: readReceipts.length };
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
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId),
        ),
      )
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId),
          ),
          ne(messages.senderId, userId), // Don't count own messages
          isNull(messageReads.id), // Messages that haven't been read
        ),
      );

    return result[0]?.count ?? 0;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
