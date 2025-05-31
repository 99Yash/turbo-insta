import * as z from "zod";

export const userSchema = z.object({
  userId: z.string(),
});

export type GetUserInput = z.infer<typeof userSchema>;

export const optionalUserSchema = z.object({
  userId: z.string().optional().nullable(),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(60),
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9_\.]+$/),
  bio: z.string().max(160).nullable(),
  imageUrl: z.string().url().nullable(),
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

export function withOptionalUser<T extends z.AnyZodObject>(schema: T) {
  return z.object({
    ...schema.shape,
    ...optionalUserSchema.shape,
  }) as z.ZodObject<
    {
      userId: z.ZodOptional<z.ZodString>;
    } & T["shape"]
  >;
}

export type WithUser<T extends z.AnyZodObject> = z.infer<
  ReturnType<typeof withUser<T>>
>;

export type WithOptionalUser<T extends z.AnyZodObject> = z.infer<
  ReturnType<typeof withOptionalUser<T>>
>;

// Helper type for adding userId to any TypeScript type (not just Zod schemas)
export type WithUserId<T> = T & { userId: string };
export type WithOptionalUserId<T> = T & { userId?: string };

export const toggleFollowSchema = z.object({
  targetUserId: z.string(),
});

export type ToggleFollowInput = z.infer<typeof toggleFollowSchema>;

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.number().min(1).max(20).default(5),
});

export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
