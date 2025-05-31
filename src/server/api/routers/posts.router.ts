import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createPostSchema,
  editPostSchema,
  getBookmarkStatusSchema,
  getPostByIdSchema,
  getPostsByUserIdSchema,
  getPostsSchema,
  getUserBookmarksSchema,
  toggleBookmarkSchema,
} from "../schema/posts.schema";
import { userSchema } from "../schema/user.schema";
import {
  createPost,
  deletePost,
  editPost,
  getBookmarkStatus,
  getPostById,
  getPostComments,
  getPostLikes,
  getPosts,
  getPostsByUserId,
  getUserBookmarks,
  getUserTopPosts,
  toggleBookmark,
} from "../services/posts.service";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      return createPost(input, ctx.userId);
    }),

  edit: protectedProcedure
    .input(editPostSchema)
    .mutation(async ({ input, ctx }) => {
      return editPost({ ...input, userId: ctx.userId });
    }),

  getAll: publicProcedure.input(getPostsSchema).query(async ({ input }) => {
    return getPosts(input);
  }),

  getById: publicProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return getPostById(input);
    }),

  getLikes: publicProcedure
    .input(getPostByIdSchema)
    .query(async ({ input, ctx }) => {
      return getPostLikes({ ...input, userId: ctx.auth.userId ?? undefined });
    }),

  getComments: publicProcedure
    .input(getPostByIdSchema)
    .query(async ({ input }) => {
      return getPostComments(input);
    }),

  delete: protectedProcedure
    .input(getPostByIdSchema)
    .mutation(
      async ({ input, ctx }) =>
        await deletePost({ ...input, userId: ctx.userId }),
    ),

  getByUserId: protectedProcedure.input(getPostsByUserIdSchema).query(
    async ({ input }) =>
      await getPostsByUserId({
        ...input,
        userId: input.userId,
      }),
  ),

  getUserTopPosts: publicProcedure
    .input(userSchema)
    .query(async ({ input }) => await getUserTopPosts(input.userId)),

  toggleBookmark: protectedProcedure
    .input(toggleBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      return toggleBookmark(input, ctx.userId);
    }),

  getBookmarkStatus: protectedProcedure
    .input(getBookmarkStatusSchema)
    .query(async ({ input, ctx }) => {
      return getBookmarkStatus({
        ...input,
        userId: ctx.userId,
      });
    }),

  getUserBookmarks: protectedProcedure
    .input(getUserBookmarksSchema)
    .query(async ({ input, ctx }) => {
      return getUserBookmarks(input, ctx.userId);
    }),
});
