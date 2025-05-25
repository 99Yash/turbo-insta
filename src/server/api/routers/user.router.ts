import { z } from "zod";
import { getUserById, updateUserProfile } from "../services/user.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: _, input }) => {
      const user = await getUserById(input.id);

      return user;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(60),
        username: z
          .string()
          .min(3)
          .max(15)
          .regex(/^[a-z0-9_\.]+$/),
        bio: z.string().max(160).nullable(),
        imageUrl: z.string().url().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await updateUserProfile(ctx.userId, input);
      return user;
    }),
});
