import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { z } from "zod";
import { comments } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
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
});
