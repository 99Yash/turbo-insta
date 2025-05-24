import { getSocketAuthToken } from "../services/utils.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const utilsRouter = createTRPCRouter({
  getSocketAuthToken: protectedProcedure.query(async ({ ctx }) => {
    return getSocketAuthToken({ userId: ctx.userId });
  }),
});
