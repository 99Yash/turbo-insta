import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { z } from "zod";
import { likes } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const likesRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const [like] = await ctx.db
          .insert(likes)
          .values({
            userId: ctx.userId,
            postId: input.postId,
          })
          .returning();

        return like;
      } catch (e) {
        throw new TRPCError({
          code: getTRPCErrorFromUnknown(e).code,
          message: getTRPCErrorFromUnknown(e).message,
        });
      }
    }),
});
