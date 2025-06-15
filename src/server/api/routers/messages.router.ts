import {
  createOrGetConversationSchema,
  getConversationSchema,
  getConversationsSchema,
  getMessagesSchema,
  markAsReadSchema,
  sendMessageSchema,
} from "../schema/messages.schema";
import {
  createOrGetConversation,
  getConversation,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  markMessagesAsRead,
  sendMessage,
} from "../services/messages.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const messagesRouter = createTRPCRouter({
  /**
   * Create or get existing conversation between two users
   */
  createOrGetConversation: protectedProcedure
    .input(createOrGetConversationSchema)
    .mutation(async ({ input, ctx }) => {
      return createOrGetConversation({
        participant1Id: ctx.userId,
        participant2Id: input.participant2Id,
      });
    }),

  /**
   * Send a message in a conversation
   */
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      return sendMessage({
        conversationId: input.conversationId,
        senderId: ctx.userId,
        content: input.content,
        type: input.type,
        attachments: input.attachments,
      });
    }),

  /**
   * Get paginated conversations for the current user
   */
  getConversations: protectedProcedure
    .input(getConversationsSchema)
    .query(async ({ input, ctx }) => {
      return getConversations({
        userId: ctx.userId,
        cursor: input.cursor,
        limit: input.limit,
      });
    }),

  /**
   * Get a single conversation by ID
   */
  getConversation: protectedProcedure
    .input(getConversationSchema)
    .query(async ({ input, ctx }) => {
      return getConversation({
        conversationId: input.conversationId,
        userId: ctx.userId,
      });
    }),

  /**
   * Get paginated messages in a conversation
   */
  getMessages: protectedProcedure
    .input(getMessagesSchema)
    .query(async ({ input, ctx }) => {
      return getMessages({
        conversationId: input.conversationId,
        userId: ctx.userId,
        cursor: input.cursor,
        limit: input.limit,
      });
    }),

  /**
   * Mark messages as read in a conversation
   */
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ input, ctx }) => {
      return markMessagesAsRead(input.conversationId, ctx.userId);
    }),

  /**
   * Get total unread message count for the current user
   */
  getUnreadMessageCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadMessageCount(ctx.userId);
  }),
});
