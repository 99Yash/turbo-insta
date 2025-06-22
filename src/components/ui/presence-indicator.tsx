"use client";

import { cn } from "~/lib/utils";

interface PresenceIndicatorProps {
  readonly isOnline: boolean;
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg";
}

/**
 * A reusable presence indicator component that shows online/offline status
 */
export function PresenceIndicator({
  isOnline,
  className,
  size = "md",
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!isOnline) {
    return null; // Don't show anything when user is offline
  }

  return (
    <div
      className={cn(
        "absolute -bottom-1 -right-1 animate-online-pulse rounded-full border-2 border-background bg-green-500 shadow-sm",
        sizeClasses[size],
        className,
      )}
      title="Online"
      aria-label="User is online"
    />
  );
}
