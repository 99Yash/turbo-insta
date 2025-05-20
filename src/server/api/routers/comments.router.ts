import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { comments } from "~/server/db/schema";
import { users } from "~/server/db/schema/users";
import {
  createCommentSchema,
  getCommentsSchema,
} from "../schema/comments.schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const [comment] = await ctx.db
          .insert(comments)
          .values({
            text: input.text,
            userId: ctx.userId,
            postId: input.postId,
          })
          .returning();

        return comment;
      } catch (e) {
        throw new TRPCError({
          code: getTRPCErrorFromUnknown(e).code,
          message: getTRPCErrorFromUnknown(e).message,
        });
      }
    }),

  getByPostId: publicProcedure
    .input(getCommentsSchema)
    .query(async ({ input, ctx }) => {
      const { postId, limit, cursor } = input;

      const postComments = await ctx.db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.postId, postId),
            cursor
              ? or(
                  // Get comments created before the cursor date
                  lt(comments.createdAt, cursor.createdAt),
                  // Or get comments created at the same time but with smaller ID
                  and(
                    eq(comments.createdAt, cursor.createdAt),
                    lt(comments.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(comments.createdAt), desc(comments.id))
        .limit(limit + 1);

      const userIds = [
        ...new Set(postComments.map((comment) => comment.userId)),
      ];

      const authors =
        userIds.length > 0
          ? await ctx.db
              .select({
                id: users.id,
                name: users.name,
                imageUrl: users.imageUrl,
                username: users.username,
              })
              .from(users)
              .where(inArray(users.id, userIds))
          : [];

      const commentsWithUser = postComments.map((comment) => {
        const user = authors.find((u) => u.id === comment.userId);
        return {
          ...comment,
          user: user
            ? {
                id: user.id,
                name: user.name,
                username: user.username,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (postComments.length > limit) {
        const nextItem = postComments.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return {
        comments: commentsWithUser,
        nextCursor,
      };
    }),
});
