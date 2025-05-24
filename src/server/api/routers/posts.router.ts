import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createPostSchema,
  getPostByIdSchema,
  getPostsByUserIdSchema,
  getPostsSchema,
} from "../schema/posts.schema";
import {
  createPost,
  deletePost,
  getPostById,
  getPostComments,
  getPostLikes,
  getPosts,
  getPostsByUserId,
  getUserTopPosts,
} from "../services/posts.service";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      return createPost(input, ctx.userId);
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
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => await getUserTopPosts(input.userId)),
});
