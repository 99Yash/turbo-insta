import { z } from "zod";
import { storedFileSchema } from "~/types";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(storedFileSchema).min(1).max(3),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const MAX_COMMENT_CHAR_LENGTH = 1000;
