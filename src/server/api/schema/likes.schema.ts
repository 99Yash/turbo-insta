import { z } from "zod";

export const toggleLikeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("post"),
    postId: z.string(),
  }),
  z.object({
    type: z.literal("comment"),
    commentId: z.string(),
  }),
  z.object({
    type: z.literal("reply"),
    commentReplyId: z.string(),
  }),
]);

export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
