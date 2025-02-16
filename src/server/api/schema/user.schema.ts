import { z } from "zod";

export const userSchema = z.object({
  userId: z.string(),
});

export function withUser<T extends z.AnyZodObject>(schema: T) {
  return z.object({
    ...schema.shape,
    ...userSchema.shape,
  }) as z.ZodObject<
    {
      userId: z.ZodString;
    } & T["shape"]
  >;
}
