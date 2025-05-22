import {
  createCommentSchema,
  deleteCommentSchema,
  getCommentsSchema,
} from "../schema/comments.schema";
import {
  createComment,
  deleteComment,
  getComments,
} from "../services/comments.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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

  getByPostId: publicProcedure
    .input(getCommentsSchema)
    .query(async ({ input }) => {
      const comments = await getComments(input);
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
});
