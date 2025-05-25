import { z } from "zod";

export const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  postId: z.string(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const getCommentsSchema = z.object({
  postId: z.string(),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetCommentsInput = z.infer<typeof getCommentsSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.string(),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
