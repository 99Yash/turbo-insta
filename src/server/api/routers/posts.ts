import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

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
});
