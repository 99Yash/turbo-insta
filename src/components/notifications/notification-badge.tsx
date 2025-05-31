"use client";

import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function NotificationBadge() {
  const { data: unreadCount } = api.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  const count = unreadCount?.count ?? 0;

  return (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
