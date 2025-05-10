import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { comments } from "~/server/db/schema";
import { users } from "~/server/db/schema/users";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { MAX_COMMENT_CHAR_LENGTH } from "../validators/posts.validator";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(MAX_COMMENT_CHAR_LENGTH),
        postId: z.string(),
      }),
    )
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
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { postId, limit, cursor } = input;

      const postComments = await ctx.db
        .select()
        .from(comments)
        .where(
          cursor
            ? and(
                eq(comments.postId, postId),
                or(
                  gt(comments.createdAt, cursor.createdAt),
                  and(
                    eq(comments.createdAt, cursor.createdAt),
                    gt(comments.id, cursor.id),
                  ),
                ),
              )
            : undefined,
        )
        .orderBy(desc(comments.createdAt), desc(comments.id))
        .limit(limit);

      const userIds = [
        ...new Set(postComments.map((comment) => comment.userId)),
      ];

      const authors = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          imageUrl: users.imageUrl,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, userIds));

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
        postComments: commentsWithUser,
        nextCursor,
      };
    }),
});
