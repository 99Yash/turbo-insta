import {
  createCommentSchema,
  getCommentsSchema,
} from "../schema/comments.schema";
import { createComment, getComments } from "../services/comments.service";
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
});
