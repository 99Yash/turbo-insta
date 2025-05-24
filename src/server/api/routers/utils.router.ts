import { z } from "zod";
import { getSocketAuthToken } from "../services/utils.service";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const utilsRouter = createTRPCRouter({
  getSocketAuthToken: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return getSocketAuthToken(input);
    }),
});
