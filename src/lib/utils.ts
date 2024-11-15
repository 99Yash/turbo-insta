import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { User } from "@clerk/nextjs/server";
import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const unknownError = "Something went wrong. Please try again later.";
export function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.errors[0]?.message ?? unknownError;
  } else if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage ?? unknownError;
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}

export function generateId(
  prefix?: string,
  { length = 12, separator = "_" } = {},
) {
  const id = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    length,
  )();
  return prefix ? `${prefix}${separator}${id}` : id;
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function getUserEmail(user: User | null) {
  const email =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? "";

  return email;
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);
  console.log({ errorMessage });

  return toast.error(errorMessage);
}
