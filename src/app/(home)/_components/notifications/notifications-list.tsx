"use client";

import type * as Ably from "ably";
import { Bell } from "lucide-react";
import React from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
import { useAblyContext } from "~/lib/providers/ably-provider";
import { api } from "~/trpc/react";
import { NotificationItem } from "./notification-item";

interface NotificationsListProps {
  readonly unreadCount: number;
  readonly isOpen: boolean;
  readonly onUnreadCountChange?: (newCount: number) => void;
  readonly onCloseSidebar?: () => void;
}

export function NotificationsList({
  unreadCount,
  isOpen,
  onUnreadCountChange,
  onCloseSidebar,
}: NotificationsListProps) {
  const utils = api.useUtils();
  const { user } = useUser();
  const client = useAblyContext();

  // Subscribe to websocket notifications for count updates
  React.useEffect(() => {
    if (!user || !client) return;

    const channelName = `notifications:${user.id}`;
    const channel = client.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      console.log(
        "🔔 [NotificationsList] Received websocket notification:",
        message.data,
      );

      // Only invalidate the notifications list if sidebar is open
      // The unread count is handled by the sidebar component
      if (isOpen) {
        console.log(
          "🔄 [NotificationsList] Invalidating notifications list...",
        );
        void utils.notifications.getAll.invalidate();
      }
    };

    void channel.subscribe("notification", handler);
    console.log(
      "✅ [NotificationsList] Subscribed to notifications channel:",
      channelName,
    );

    return () => {
      console.log(
        "🔇 [NotificationsList] Unsubscribing from notifications channel",
      );
      void channel.unsubscribe("notification", handler);
    };
  }, [user, client, isOpen, utils]);

  // Fetch notifications only when sidebar is open
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
      enabled: isOpen, // Only fetch when sidebar is open
    },
  );

  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      onUnreadCountChange?.(0);
      void utils.notifications.getUnreadCount.invalidate();
    },
  });

  const notifications =
    notificationsData?.pages.flatMap((page) => page.notifications) ?? [];

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationIds: [notificationId] });
  };

  // Automatically mark all notifications as read when sidebar is opened
  React.useEffect(() => {
    if (
      unreadCount > 0 &&
      !isLoading &&
      !markAsReadMutation.isPending &&
      isOpen
    ) {
      void markAsReadMutation.mutateAsync({});
    }
  }, [
    unreadCount,
    isLoading,
    markAsReadMutation.isPending,
    isOpen,
    markAsReadMutation,
  ]);

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
            onClick={() => void markAsReadMutation.mutateAsync({})}
            disabled={markAsReadMutation.isPending}
            className="h-8 px-3 text-xs"
            title="Mark all as read"
          >
            {markAsReadMutation.isPending ? (
              <Icons.spinner className="h-3 w-3" />
            ) : (
              "Clear all"
            )}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-full w-full overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.spinner className="h-6 w-6 text-muted-foreground" />
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
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onCloseSidebar={onCloseSidebar}
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
                      <Icons.spinner className="mr-2 h-4 w-4" />
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
