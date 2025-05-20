import * as z from "zod";

export const authSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(100, {
      message: "Password must be at most 100 characters long",
    }),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .min(6, {
      message: "Verification code must be 6 characters long",
    })
    .max(6),
});

export const checkEmailSchema = z.object({
  email: authSchema.shape.email,
});

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
