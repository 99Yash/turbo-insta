import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(input.name);
        }, 300);
      });
      await promise;

      return await ctx.db.insert(posts).values({
        name: input.name,
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.query.posts.findFirst({
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
    } catch (e) {
      throw new TRPCError({
        code: getTRPCErrorFromUnknown(e).code,
        message: getTRPCErrorFromUnknown(e).message,
      });
    }
  }),
});
