import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { images, posts } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        files: z.array(z.string()).min(1).max(3),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
            name: file,
            url: file,
            alt: file,
            postId: post.id,
          });
        }),
      );
    }),
});
