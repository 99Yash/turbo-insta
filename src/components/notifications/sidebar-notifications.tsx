"use client";

import { Bell, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { SidebarNotificationItem } from "./sidebar-notification-item";

interface SidebarNotificationsProps {
  readonly unreadCount: number;
}

export function SidebarNotifications({
  unreadCount,
}: SidebarNotificationsProps) {
  const utils = api.useUtils();

  // Fetch notifications immediately since this is in a collapsible
  const {
    data: notificationsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.notifications.getAll.useInfiniteQuery(
    { limit: 8 }, // Smaller limit for sidebar
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Mutations
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate both notifications list and unread count
      void utils.notifications.getAll.invalidate();
      void utils.notifications.getUnreadCount.invalidate();
    },
  });

  const notifications =
    notificationsData?.pages.flatMap((page) => page.notifications) ?? [];

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationIds: [notificationId] });
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
    <div className="w-full space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">
            Recent Activity
          </h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAsReadMutation.isPending}
            className="h-8 px-3 text-xs"
            title="Mark all as read"
          >
            {markAsReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Clear all"
            )}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[500px] w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted/50 p-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;ll see notifications here when people interact with your
              content
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <SidebarNotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}

            {/* Load More */}
            {hasNextPage && (
              <div className="pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="h-10 w-full text-xs"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load more notifications"
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
