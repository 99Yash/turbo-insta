import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { likes, posts } from "~/server/db/schema";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        files: z
          .array(
            z.object({
              url: z.string(),
              name: z.string(),
              id: z.string(),
            }),
          )
          .min(1)
          .max(3),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const [post] = await ctx.db
          .insert(posts)
          .values({
            title: input.title,
            userId: ctx.userId,
            images: input.files.map((file) => ({
              url: file.url,
              name: file.name,
              id: file.id,
            })),
          })
          .returning();

        if (!post)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create post",
          });
      } catch (e) {
        throw new TRPCError({
          code: getTRPCErrorFromUnknown(e).code,
          message: getTRPCErrorFromUnknown(e).message,
        });
      }
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

      if (!post)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });

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
