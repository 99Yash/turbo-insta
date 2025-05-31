"use client";

import { Bell, Check, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { SidebarNotificationItem } from "./sidebar-notification-item";

interface SidebarNotificationsProps {
  readonly unreadCount: number;
}

export function SidebarNotifications({
  unreadCount,
}: SidebarNotificationsProps) {
  // Fetch notifications immediately since this is in a collapsible
  const {
    data: notificationsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = api.notifications.getAll.useInfiniteQuery(
    { limit: 10 }, // Smaller limit for sidebar
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Mutations
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const deleteMutation = api.notifications.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const notifications =
    notificationsData?.pages.flatMap((page) => page.notifications) ?? [];

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationIds: [notificationId] });
  };

  const handleDelete = (notificationId: string) => {
    deleteMutation.mutate({ notificationIds: [notificationId] });
  };

  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate({});
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <div className="w-full">
      {/* Header with actions */}
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-xs font-medium text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </span>
        {unreadCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={markAsReadMutation.isPending}
              >
                {markAsReadMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-3 w-3" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleMarkAllAsRead}
                disabled={markAsReadMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px] w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted/50 p-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No notifications
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <SidebarNotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}

            {/* Load More */}
            {hasNextPage && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="h-8 w-full text-xs"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
