"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { NotificationWithDetails } from "~/server/api/services/notifications.service";

interface NotificationItemProps {
  readonly notification: NotificationWithDetails;
  readonly onMarkAsRead?: (notificationId: string) => void;
  readonly onDelete?: (notificationId: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "reply":
        return <Reply className="h-4 w-4 text-green-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case "comment_like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actor.name;

    switch (notification.type) {
      case "like":
        return `${actorName} liked your post`;
      case "comment":
        return `${actorName} commented on your post`;
      case "reply":
        return `${actorName} replied to your comment`;
      case "follow":
        return `${actorName} started following you`;
      case "comment_like":
        return `${actorName} liked your comment`;
      default:
        return `${actorName} sent you a notification`;
    }
  };

  const getNotificationLink = () => {
    if (notification.postId) {
      return `/posts/${notification.postId}`;
    }
    if (notification.type === "follow") {
      return `/profile/${notification.actor.username}`;
    }
    return "#";
  };

  const handleMarkAsRead = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-gray-100 p-4 transition-colors hover:bg-gray-50",
        !notification.isRead && "border-blue-100 bg-blue-50",
      )}
    >
      {/* Actor Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage
          src={notification.actor.imageUrl ?? undefined}
          alt={notification.actor.name}
        />
        <AvatarFallback>
          {notification.actor.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Notification Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Notification Icon and Text */}
            <div className="mb-1 flex items-center gap-2">
              {getNotificationIcon()}
              <Link
                href={getNotificationLink()}
                onClick={handleMarkAsRead}
                className="text-sm text-gray-900 transition-colors hover:text-blue-600"
              >
                {getNotificationText()}
              </Link>
            </div>

            {/* Additional Context */}
            {notification.comment && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                &ldquo;{notification.comment.text}&rdquo;
              </p>
            )}

            {notification.post?.title && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-600">
                Post: &ldquo;{notification.post.title}&rdquo;
              </p>
            )}

            {/* Timestamp */}
            <p className="mt-1 text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-6 px-2 text-xs"
              >
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
