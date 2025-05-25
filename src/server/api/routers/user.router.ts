import { z } from "zod";
import { updateUserProfileSchema } from "../schema/user.schema";
import { getUserById, updateUserProfile } from "../services/user.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);

      return user;
    }),

  updateProfile: protectedProcedure
    .input(updateUserProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await updateUserProfile(ctx.userId, input);
      return user;
    }),
});
