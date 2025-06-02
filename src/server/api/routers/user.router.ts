import {
  getUsersByUsernameSchema,
  searchUsersSchema,
  toggleFollowSchema,
  updateUserProfileSchema,
  userSchema,
} from "../schema/user.schema";
import {
  getFollowers,
  getFollowing,
  getUserById,
  getUsersByUsername,
  isFollowing,
  searchUsers,
  toggleFollow,
  updateUserProfile,
} from "../services/user.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure.input(userSchema).query(async ({ input }) => {
    const user = await getUserById(input.userId);

    return user;
  }),

  updateProfile: protectedProcedure
    .input(updateUserProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await updateUserProfile(ctx.userId, input);
      return user;
    }),

  getFollowers: publicProcedure.input(userSchema).query(async ({ input }) => {
    const followers = await getFollowers(input.userId);
    return followers;
  }),

  getFollowing: publicProcedure.input(userSchema).query(async ({ input }) => {
    const following = await getFollowing(input.userId);
    return following;
  }),

  isFollowing: protectedProcedure
    .input(toggleFollowSchema)
    .query(async ({ ctx, input }) => {
      const following = await isFollowing(ctx.userId, input.targetUserId);
      return following;
    }),

  toggleFollow: protectedProcedure
    .input(toggleFollowSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await toggleFollow(ctx.userId, input.targetUserId);
      return result;
    }),

  getUsersByUsername: publicProcedure
    .input(getUsersByUsernameSchema)
    .query(async ({ input }) => {
      const users = await getUsersByUsername(input.query, input.limit);
      return users;
    }),

  searchUsers: publicProcedure
    .input(searchUsersSchema)
    .query(async ({ input }) => {
      const users = await searchUsers(input.query, input.offset, input.size);
      return users;
    }),
});
