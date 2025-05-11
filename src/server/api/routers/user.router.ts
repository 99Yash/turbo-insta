import { z } from "zod";
import { getUserById } from "../services/user.service";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: _, input }) => {
      const user = await getUserById(input.id);

      return user;
    }),
});
