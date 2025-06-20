import {
  getOrCreateConversationSchema,
  getUserConversationsSchema,
  sendMessageSchema,
} from "../schema/messages.schema";
import {
  getOrCreateConversation,
  getUserConversations,
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
});
