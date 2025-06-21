import {
  addMessageReactionSchema,
  deleteConversationSchema,
  getConversationMessagesSchema,
  getOrCreateConversationSchema,
  getUserConversationsSchema,
  markConversationAsReadSchema,
  removeMessageReactionSchema,
  sendMessageSchema,
} from "../schema/messages.schema";
import {
  addMessageReaction,
  deleteConversationForUser,
  getConversationMessages,
  getOrCreateConversation,
  getUserConversations,
  markConversationAsRead,
  removeMessageReaction,
  sendMessage,
} from "../services/messages.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const messagesRouter = createTRPCRouter({
  /**
   * Get user's conversations
   */
  getConversations: protectedProcedure
    .input(getUserConversationsSchema)
    .query(async ({ input, ctx }) => {
      return getUserConversations(ctx.userId, input.limit);
    }),

  /**
   * Get messages in a conversation
   */
  getConversationMessages: protectedProcedure
    .input(getConversationMessagesSchema)
    .query(async ({ input, ctx }) => {
      return getConversationMessages(
        ctx.userId,
        input.conversationId,
        input.limit,
        input.cursor,
      );
    }),

  /**
   * Get or create a conversation with another user
   */
  getOrCreateConversation: protectedProcedure
    .input(getOrCreateConversationSchema)
    .mutation(async ({ input, ctx }) => {
      return getOrCreateConversation(ctx.userId, input.otherUserId);
    }),

  /**
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      return sendMessage(ctx.userId, input.receiverId, input.text, input.files);
    }),

  addReaction: protectedProcedure
    .input(addMessageReactionSchema)
    .mutation(async ({ ctx, input }) => {
      const reaction = await addMessageReaction({
        messageId: input.messageId,
        userId: ctx.userId,
        emoji: input.emoji,
      });

      return reaction;
    }),

  removeReaction: protectedProcedure
    .input(removeMessageReactionSchema)
    .mutation(async ({ ctx, input }) => {
      await removeMessageReaction({
        messageId: input.messageId,
        userId: ctx.userId,
      });
    }),

  /**
   * Delete a conversation for the current user
   */
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteConversationForUser(ctx.userId, input.conversationId);
    }),

  markConversationAsRead: protectedProcedure
    .input(markConversationAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      return markConversationAsRead(ctx.userId, input.conversationId);
    }),
});
