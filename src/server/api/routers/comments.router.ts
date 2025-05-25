import {
  createCommentSchema,
  createReplySchema,
  deleteCommentSchema,
  deleteReplySchema,
  getCommentsSchema,
  getRepliesSchema,
} from "../schema/comments.schema";
import {
  createComment,
  createReply,
  deleteComment,
  deleteReply,
  getComments,
  getReplies,
} from "../services/comments.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const comment = await createComment({
        ...input,
        userId: ctx.userId,
      });
      return comment;
    }),

  getByPostId: protectedProcedure
    .input(getCommentsSchema)
    .query(async ({ input, ctx }) => {
      const comments = await getComments({
        ...input,
        userId: ctx.userId,
      });
      return comments;
    }),

  delete: protectedProcedure
    .input(deleteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      return await deleteComment({
        commentId: input.commentId,
        userId: ctx.userId,
      });
    }),

  // Reply routes
  createReply: protectedProcedure
    .input(createReplySchema)
    .mutation(async ({ input, ctx }) => {
      const reply = await createReply({
        ...input,
        userId: ctx.userId,
      });
      return reply;
    }),

  getReplies: protectedProcedure
    .input(getRepliesSchema)
    .query(async ({ input, ctx }) => {
      const replies = await getReplies({
        ...input,
        userId: ctx.userId,
      });
      return replies;
    }),

  deleteReply: protectedProcedure
    .input(deleteReplySchema)
    .mutation(async ({ input, ctx }) => {
      return await deleteReply({
        replyId: input.replyId,
        userId: ctx.userId,
      });
    }),
});
