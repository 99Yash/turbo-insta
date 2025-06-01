"use client";

import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface NotificationBadgeProps {
  readonly className?: string;
  readonly iconClassName?: string;
  readonly badgeClassName?: string;
  readonly showZero?: boolean;
}

export function NotificationBadge({
  className,
  iconClassName,
  badgeClassName,
  showZero = false,
}: NotificationBadgeProps) {
  const { data: count } = api.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Button variant="ghost" size="sm" className={cn("relative", className)}>
      <Bell className={cn("h-5 w-5", iconClassName)} />
      {((count ?? 0) > 0 || showZero) && (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white",
            count === 0 && "bg-muted-foreground",
            badgeClassName,
          )}
        >
          {count && count > 99 ? "99+" : (count ?? 0)}
        </span>
      )}
    </Button>
  );
}
