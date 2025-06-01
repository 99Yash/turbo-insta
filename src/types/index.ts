import { type SQL } from "drizzle-orm";
import { z } from "zod";

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}
export const storedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  alt: z.string().optional(),
});

export type StoredFile = z.infer<typeof storedFileSchema>;

export type DrizzleWhere<T> =
  | SQL<unknown>
  | ((aliases: T) => SQL<T> | undefined)
  | undefined;

export interface ReplyState {
  readonly username: string;
  readonly commentId: string;
}
