import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { images, posts } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        files: z
          .array(
            z.object({
              url: z.string(),
              name: z.string(),
              fileKey: z.string(),
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
          })
          .returning();

        if (!post)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create post",
          });

        await Promise.all(
          input.files.map(async (file) => {
            await ctx.db.insert(images).values({
              url: file.url,
              alt: file.name,
              name: file.name,
              fileKey: file.fileKey,
              postId: post.id,
            });
          }),
        );
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
      with: {
        images: true,
      },
    });

    return allPosts;
  }),
});
