"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Reply,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { NotificationWithDetails } from "~/server/api/services/notifications.service";

interface SidebarNotificationItemProps {
  readonly notification: NotificationWithDetails;
  readonly onMarkAsRead?: (notificationId: string) => void;
  readonly onDelete?: (notificationId: string) => void;
}

export function SidebarNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: SidebarNotificationItemProps) {
  const getNotificationIcon = () => {
    const iconClass = "h-3 w-3";
    switch (notification.type) {
      case "like":
        return (
          <Heart
            className={cn(iconClass, "text-red-500")}
            fill="currentColor"
          />
        );
      case "comment":
        return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
      case "reply":
        return <Reply className={cn(iconClass, "text-green-500")} />;
      case "follow":
        return <UserPlus className={cn(iconClass, "text-purple-500")} />;
      case "comment_like":
        return (
          <Heart
            className={cn(iconClass, "text-pink-500")}
            fill="currentColor"
          />
        );
      default:
        return <Heart className={cn(iconClass, "text-muted-foreground")} />;
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
        "group relative rounded-lg border p-3 transition-all hover:bg-accent/50",
        !notification.isRead &&
          "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50",
        notification.isRead && "border-transparent bg-background",
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-blue-500" />
      )}

      <div className="flex items-start gap-2">
        {/* Actor Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={notification.actor.imageUrl ?? undefined}
            alt={notification.actor.name}
          />
          <AvatarFallback className="text-xs">
            {notification.actor.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            {getNotificationIcon()}
            <Link
              href={getNotificationLink()}
              onClick={handleMarkAsRead}
              className="text-xs font-medium leading-relaxed text-foreground transition-colors hover:text-primary"
            >
              {getNotificationText()}
            </Link>
          </div>

          {/* Additional Context */}
          {notification.comment && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              &ldquo;{notification.comment.text}&rdquo;
            </p>
          )}

          {notification.post?.title && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              &ldquo;{notification.post.title}&rdquo;
            </p>
          )}

          {/* Timestamp */}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!notification.isRead && (
              <DropdownMenuItem onClick={handleMarkAsRead}>
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
