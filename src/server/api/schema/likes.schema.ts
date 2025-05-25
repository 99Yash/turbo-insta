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

// Helper types to extract just the parameters without the discriminator
export type PostLikeParams = Omit<
  Extract<ToggleLikeInput, { type: "post" }>,
  "type"
>;
export type CommentLikeParams = Omit<
  Extract<ToggleLikeInput, { type: "comment" }>,
  "type"
>;
export type ReplyLikeParams = Omit<
  Extract<ToggleLikeInput, { type: "reply" }>,
  "type"
>;
