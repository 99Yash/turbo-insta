import { z } from "zod";
import { storedFileSchema } from "~/types";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(storedFileSchema).min(1).max(3),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const getPostsByUserIdSchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(100).default(12),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetPostsByUserIdInput = z.infer<typeof getPostsByUserIdSchema>;

export const getUserTopPostsSchema = z.object({
  userId: z.string(),
});

export type GetUserTopPostsInput = z.infer<typeof getUserTopPostsSchema>;

export const getPostByIdSchema = z.object({
  postId: z.string(),
});

export type GetPostByIdInput = z.infer<typeof getPostByIdSchema>;

export const getPostsSchema = z.object({
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetPostsInput = z.infer<typeof getPostsSchema>;

export const editPostSchema = z.object({
  postId: z.string(),
  title: z.string().min(1).max(256),
  altTexts: z.array(z.string().optional()).optional(),
});

export type EditPostInput = z.infer<typeof editPostSchema>;

export const toggleBookmarkSchema = z.object({
  postId: z.string(),
});

export type ToggleBookmarkInput = z.infer<typeof toggleBookmarkSchema>;

export const getBookmarkStatusSchema = z.object({
  postId: z.string(),
});

export type GetBookmarkStatusInput = z.infer<typeof getBookmarkStatusSchema>;

export const getUserBookmarksSchema = z.object({
  limit: z.number().min(1).max(100).default(12),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetUserBookmarksInput = z.infer<typeof getUserBookmarksSchema>;
