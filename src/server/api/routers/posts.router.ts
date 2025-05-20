import { and, count, desc, eq, gt, or } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { likes, posts, users } from "~/server/db/schema";
import { createPostSchema } from "../schema/posts.schema";
import { createPost, deletePost } from "../services/post.service";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      return createPost(input, ctx.userId);
    }),

  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db
        .select()
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(
          cursor
            ? or(
                gt(posts.createdAt, cursor.createdAt),
                and(
                  eq(posts.createdAt, cursor.createdAt),
                  gt(posts.id, cursor.id),
                ),
              )
            : undefined,
        )
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit + 1);

      let nextCursor: typeof cursor | undefined = undefined;

      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = {
          id: nextItem.posts.id,
          createdAt: nextItem.posts.createdAt,
        };
      }

      return {
        items,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const [post] = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);
      return post;
    }),

  getLikes: publicProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const [c] = await ctx.db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.postId, input.postId));

      if (ctx.auth.userId) {
        const [likedPost] = await ctx.db
          .select({
            id: likes.id,
          })
          .from(likes)
          .where(
            and(
              eq(likes.userId, ctx.auth.userId),
              eq(likes.postId, input.postId),
            ),
          );

        return {
          count: c?.count ?? 0,
          hasLiked: !!likedPost,
        };
      }

      return {
        count: c?.count ?? 0,
        hasLiked: false,
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => deletePost(input.postId, ctx.userId)),

  getByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(12),
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const items = await ctx.db
        .select()
        .from(posts)
        .where(
          cursor
            ? and(
                eq(posts.userId, userId),
                or(
                  gt(posts.createdAt, cursor.createdAt),
                  and(
                    eq(posts.createdAt, cursor.createdAt),
                    gt(posts.id, cursor.id),
                  ),
                ),
              )
            : eq(posts.userId, userId),
        )
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit + 1);

      let nextCursor: typeof cursor | undefined = undefined;

      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return {
        items,
        nextCursor,
      };
    }),

  getUserTopPosts: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(10).default(3),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit } = input;

      const postsWithLikes = await ctx.db
        .select({
          post: posts,
          likeCount: count(likes.id),
        })
        .from(posts)
        .leftJoin(likes, eq(posts.id, likes.postId))
        .where(eq(posts.userId, userId))
        .groupBy(posts.id)
        .orderBy(desc(count(likes.id)), desc(posts.createdAt))
        .limit(limit);

      return postsWithLikes;
    }),
});
