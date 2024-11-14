import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const unknownError = "Something went wrong. Please try again later.";
export function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues.map((issue) => issue.message ?? unknownError).join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}
