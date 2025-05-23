import { and, count, desc, eq, gt, or } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { likes, posts, users } from "~/server/db/schema";
import {
  createPostSchema,
  getPostByIdSchema,
  getPostsByUserIdSchema,
} from "../schema/posts.schema";
import {
  createPost,
  deletePost,
  getPostsByUserId,
  getUserTopPosts,
} from "../services/posts.service";

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
    .input(getPostByIdSchema)
    .mutation(
      async ({ input, ctx }) =>
        await deletePost({ ...input, userId: ctx.userId }),
    ),

  getByUserId: publicProcedure.input(getPostsByUserIdSchema).query(
    async ({ input, ctx }) =>
      await getPostsByUserId({
        ...input,
        userId: input.userId ?? ctx.auth.userId,
      }),
  ),

  getUserTopPosts: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => await getUserTopPosts(input.userId)),
});
