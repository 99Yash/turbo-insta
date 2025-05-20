import { z } from "zod";

export const toggleLikeSchema = z.object({
  postId: z.string(),
});

export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
