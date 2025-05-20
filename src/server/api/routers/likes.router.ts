import { toggleLikeSchema } from "../schema/likes.schema";
import { toggleLike } from "../services/likes.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const likesRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(toggleLikeSchema)
    .mutation(async ({ input, ctx }) => {
      await toggleLike({ ...input, userId: ctx.userId });
    }),
});
