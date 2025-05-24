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

export type GetUserInput = z.infer<typeof userSchema>;

export const optionalUserSchema = z.object({
  userId: z.string().optional().nullable(),
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
