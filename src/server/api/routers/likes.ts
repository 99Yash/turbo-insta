import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { likes } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const likesRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const [existingLike] = await db
          .select()
          .from(likes)
          .where(
            and(eq(likes.userId, ctx.userId), eq(likes.postId, input.postId)),
          );

        if (existingLike) {
          await db
            .delete(likes)
            .where(
              and(eq(likes.userId, ctx.userId), eq(likes.postId, input.postId)),
            );
        } else {
          await db.insert(likes).values({
            userId: ctx.userId,
            postId: input.postId,
          });
        }
      } catch (e) {
        throw new TRPCError({
          code: getTRPCErrorFromUnknown(e).code,
          message: getTRPCErrorFromUnknown(e).message,
        });
      }
    }),
});
