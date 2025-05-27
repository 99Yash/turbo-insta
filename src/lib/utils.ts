import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { type User } from "@clerk/nextjs/server";
import { type ClassValue, clsx } from "clsx";
import {
  formatDistanceToNowStrict,
  type FormatDistanceToNowStrictOptions,
} from "date-fns";
import { customAlphabet } from "nanoid";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const unknownError = "Something went wrong. Please try again later.";
export function getErrorMessage(err: unknown) {
  if (typeof err === "string") {
    return err;
  } else if (err instanceof z.ZodError) {
    return err.errors.map((e) => e.message).join(", ") ?? unknownError;
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

export function isImageUrl(url: string | null) {
  if (!url) return false;
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "avif",
  ];

  return imageExtensions.some((ext) => url.endsWith(`.${ext}`));
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function isFileWithPreview(
  file: File,
): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}

export function getMoreRecentDate(date1: Date, date2: Date) {
  return date1.getTime() > date2.getTime() ? date1 : date2;
}

export function formatBytes(
  bytes: number,
  decimals = 0,
  sizeType: "accurate" | "normal" = "normal",
) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate"
      ? (accurateSizes[i] ?? "Bytest")
      : (sizes[i] ?? "Bytes")
  }`;
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Only allow s3 safe characters and characters which require special handling for now
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 * @param fileName - The file name to sanitize
 * @returns The sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w\/!-\.\*'\(\) &\$@=;:+,\?]/g, "_");
}

export function getInitials(name: string, all?: boolean) {
  if (!name) {
    return "";
  }
  if (all) {
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("");
  }
  const words = name.trim().split(/\s+/);
  const firstNameInitial = words[0] ? words[0][0] : "";
  const lastNameInitial =
    words.length > 1 ? (words[words.length - 1] ?? "")[0] : "";

  return `${firstNameInitial?.toUpperCase()}${lastNameInitial?.toUpperCase()}`;
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-US", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

export const formatDistanceLocale = {
  lessThanXSeconds: "just now",
  xSeconds: "just now",
  halfAMinute: "just now",
  lessThanXMinutes: "{{count}}m",
  xMinutes: "{{count}}m",
  aboutXHours: "{{count}}h",
  xHours: "{{count}}h",
  xDays: "{{count}}d",
  aboutXWeeks: "{{count}}w",
  xWeeks: "{{count}}w",
  aboutXMonths: "{{count}}mo",
  xMonths: "{{count}}mo",
  aboutXYears: "{{count}}y",
  xYears: "{{count}}y",
  overXYears: "{{count}}y",
  almostXYears: "{{count}}y",
};

export function formatDistance(token: string, count: number): string {
  const result = formatDistanceLocale[
    token as keyof typeof formatDistanceLocale
  ].replace("{{count}}", count.toString());

  if (result === "just now") return result;
  return result;
}

export function formatTimeToNow(
  date: Date,
  { showDateAfterDays = Infinity }: { showDateAfterDays?: number } = {},
  options?: FormatDistanceToNowStrictOptions,
): string {
  const daysDiff = Math.floor(
    (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff > showDateAfterDays) {
    return formatDate(date, { month: "short", day: "numeric" });
  }

  return formatDistanceToNowStrict(date, {
    locale: {
      formatDistance,
    },
    addSuffix: true,
    ...options,
  });
}

export function formatNumber(num: number) {
  if (num < 1000) return num;
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

export const DISALLOWED_USERNAMES = [
  "home",
  "explore",
  "messages",
  "notifications",
  "profile",
  "settings",
  "sign-in",
  "auth",
  "sign-up",
];
