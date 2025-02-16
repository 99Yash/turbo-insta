import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { likes, posts } from "~/server/db/schema";
import { createPost } from "../services/post.service";
import { createPostSchema } from "../validators/posts.schema";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      return createPost(input, ctx.userId);
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const allPosts = await ctx.db.query.posts.findMany({
      limit: 10,
    });

    return allPosts;
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
        const [hasLiked] = await ctx.db
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
          hasLiked: !!hasLiked,
        };
      }

      return {
        count: c?.count ?? 0,
        hasLiked: false,
      };
    }),
});
