import { z } from "zod";

export const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  postId: z.string(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const MAX_COMMENT_CHAR_LENGTH = 1000;

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

// Reply schemas
export const createReplySchema = z.object({
  text: z.string().min(1).max(1000),
  commentId: z.string(),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

export const getRepliesSchema = z.object({
  commentId: z.string(),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .nullish(),
});

export type GetRepliesInput = z.infer<typeof getRepliesSchema>;

export const deleteReplySchema = z.object({
  replyId: z.string(),
});

export type DeleteReplyInput = z.infer<typeof deleteReplySchema>;
