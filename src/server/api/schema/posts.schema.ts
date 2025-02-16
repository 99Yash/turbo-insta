import { z } from "zod";
import { withUser } from "./user.schema";

export const createPostSchema = withUser(
  z.object({
    title: z.string().min(1).max(256),
    files: z
      .array(
        z.object({
          url: z.string(),
          name: z.string(),
          id: z.string(),
        }),
      )
      .min(1)
      .max(3),
  }),
);

export type CreatePostInput = z.infer<typeof createPostSchema>;
