"use client";

import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Reply, UserPlus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { NotificationWithDetails } from "~/server/api/services/notifications.service";
import type { StoredFile } from "~/types";

interface SidebarNotificationItemProps {
  readonly notification: NotificationWithDetails;
  readonly onMarkAsRead?: (notificationId: string) => void;
}

export function SidebarNotificationItem({
  notification,
  onMarkAsRead,
}: SidebarNotificationItemProps) {
  const getNotificationIcon = () => {
    const iconClass = "h-4 w-4";
    switch (notification.type) {
      case "like":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Heart
              className={cn(iconClass, "text-red-600 dark:text-red-400")}
              fill="currentColor"
            />
          </div>
        );
      case "comment":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MessageCircle
              className={cn(iconClass, "text-blue-600 dark:text-blue-400")}
            />
          </div>
        );
      case "reply":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Reply
              className={cn(iconClass, "text-green-600 dark:text-green-400")}
            />
          </div>
        );
      case "follow":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <UserPlus
              className={cn(iconClass, "text-purple-600 dark:text-purple-400")}
            />
          </div>
        );
      case "comment_like":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
            <Heart
              className={cn(iconClass, "text-pink-600 dark:text-pink-400")}
              fill="currentColor"
            />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Heart className={cn(iconClass, "text-muted-foreground")} />
          </div>
        );
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actor.name;
    switch (notification.type) {
      case "like":
        return (
          <>
            <span className="font-semibold">{actorName}</span> liked your post
          </>
        );
      case "comment":
        return (
          <>
            <span className="font-semibold">{actorName}</span> commented on your
            post
          </>
        );
      case "reply":
        return (
          <>
            <span className="font-semibold">{actorName}</span> replied to your
            comment
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-semibold">{actorName}</span> started following
            you
          </>
        );
      case "comment_like":
        return (
          <>
            <span className="font-semibold">{actorName}</span> liked your
            comment
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{actorName}</span> sent you a
            notification
          </>
        );
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

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  // Helper function to get the first image from post
  const getPostImage = () => {
    if (!notification.post?.images) return null;

    try {
      const images = notification.post.images as StoredFile[];
      return images.length > 0 ? images[0] : null;
    } catch {
      return null;
    }
  };

  const firstImage = getPostImage();

  // Helper function to determine if we should show post content for this notification type
  const shouldShowPostContent = () => {
    return (
      ["like", "comment", "reply"].includes(notification.type) &&
      notification.post
    );
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-200 hover:bg-accent/30",
        !notification.isRead &&
          "border-primary/20 bg-primary/5 shadow-sm dark:border-primary/30 dark:bg-primary/10",
        notification.isRead && "border-border/50 bg-background/50",
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
      )}

      <div className="flex items-start gap-3">
        {/* Actor Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0 shadow-sm ring-2 ring-background">
          <AvatarImage
            src={notification.actor.imageUrl ?? undefined}
            alt={notification.actor.name}
          />
          <AvatarFallback className="text-sm font-medium">
            {notification.actor.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            {getNotificationIcon()}
            <div className="flex-1">
              <Link
                href={getNotificationLink()}
                onClick={handleMarkAsRead}
                className="block text-sm leading-relaxed text-foreground transition-colors hover:text-primary"
              >
                {getNotificationText()}
              </Link>

              {/* Timestamp */}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {/* Additional Context */}
          {notification.comment && (
            <div className="rounded-lg border-l-2 border-muted-foreground/20 bg-muted/50 p-2">
              <p className="line-clamp-2 text-xs text-muted-foreground">
                &ldquo;{notification.comment.text}&rdquo;
              </p>
            </div>
          )}

          {/* Post Content - Show image if available, fallback to title */}
          {shouldShowPostContent() && (
            <div className="rounded-lg border-l-2 border-primary/30 bg-muted/50 p-2">
              {firstImage ? (
                <div className="flex items-center gap-2">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={firstImage.url}
                      alt={firstImage.alt ?? firstImage.name ?? "Post image"}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  {"post" in notification && notification.post?.title && (
                    <p className="line-clamp-2 text-xs font-medium text-foreground">
                      {notification.post.title}
                    </p>
                  )}
                </div>
              ) : notification.post?.title ? (
                <p className="line-clamp-1 text-xs font-medium text-foreground">
                  {notification.post.title}
                </p>
              ) : (
                <p className="line-clamp-1 text-xs font-medium text-muted-foreground">
                  Post
                </p>
              )}
            </div>
          )}
        </div>

        {/* Archive Action */}
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="h-8 w-8 p-0 opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            title="Mark as read"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
