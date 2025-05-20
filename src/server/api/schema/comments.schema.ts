import { z } from "zod";

export const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  postId: z.string(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const getCommentsSchema = z.object({
  postId: z.string(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
