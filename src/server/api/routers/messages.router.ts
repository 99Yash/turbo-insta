import { TRPCError } from "@trpc/server";
import {
  addMessageReactionSchema,
  getConversationMessagesSchema,
  getOrCreateConversationSchema,
  getUserConversationsSchema,
  removeMessageReactionSchema,
  sendMessageSchema,
} from "../schema/messages.schema";
import {
  addMessageReaction,
  getConversationMessages,
  getOrCreateConversation,
  getUserConversations,
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
      try {
        const reaction = await addMessageReaction({
          messageId: input.messageId,
          userId: ctx.userId,
          emoji: input.emoji,
        });

        return reaction;
      } catch (error) {
        console.error("❌ [messages.addReaction] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add reaction",
        });
      }
    }),

  removeReaction: protectedProcedure
    .input(removeMessageReactionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await removeMessageReaction({
          messageId: input.messageId,
          userId: ctx.userId,
        });

        return { success: true };
      } catch (error) {
        console.error("❌ [messages.removeReaction] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove reaction",
        });
      }
    }),
});
