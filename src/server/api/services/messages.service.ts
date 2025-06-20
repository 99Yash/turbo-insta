import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, gt, or } from "drizzle-orm";
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
};

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<Conversation> {
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

    if (existingConversation.length > 0) {
      return existingConversation[0]!;
    }

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

    return newConversation;
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
      whereConditions.push(gt(messages.createdAt, new Date(cursor)));
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

        return {
          ...message,
          sender: sender[0]!,
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

    return {
      ...newMessage,
      sender: sender[0]!,
    };
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
