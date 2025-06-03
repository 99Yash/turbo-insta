"use client";

import { Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn, formatTimeToNow } from "~/lib/utils";
import type { NotificationWithDetails } from "~/server/api/services/notifications.service";
import type { StoredFile } from "~/types";

interface NotificationItemProps {
  readonly notification: NotificationWithDetails;
  readonly onMarkAsRead?: (notificationId: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="size-3.5 text-rose-500" fill="currentColor" />;
      case "comment":
        return <MessageCircle className="size-3.5 text-blue-500" />;
      case "reply":
        return <Reply className="size-3.5 text-green-500" />;
      case "follow":
        return <UserPlus className="size-3.5 text-purple-500" />;
      case "comment_like":
        return <Heart className="size-3.5 text-pink-500" fill="currentColor" />;
      default:
        return <Heart className="size-3.5 text-muted-foreground" />;
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actor.name;
    switch (notification.type) {
      case "like":
        return (
          <>
            {actorName}{" "}
            <span className="font-normal text-muted-foreground">
              liked your post
            </span>
          </>
        );
      case "comment":
        return (
          <>
            {actorName}{" "}
            <span className="font-normal text-muted-foreground">commented</span>
          </>
        );
      case "reply":
        return (
          <>
            {actorName}{" "}
            <span className="font-normal text-muted-foreground">replied</span>
          </>
        );
      case "follow":
        return (
          <>
            {actorName}{" "}
            <span className="font-normal text-muted-foreground">
              followed you
            </span>
          </>
        );
      case "comment_like":
        return (
          <>
            {actorName}{" "}
            <span className="font-normal text-muted-foreground">
              liked comment
            </span>
          </>
        );
      default:
        return <>{actorName}</>;
    }
  };

  const getNotificationLink = () => {
    if (notification.postId) return `/posts/${notification.postId}`;
    if (notification.type === "follow")
      return `/profile/${notification.actor.username}`;
    return "";
  };

  const handleMarkAsRead = () => {
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

  // Helper function to get the appropriate text content based on notification type
  const getContentText = () => {
    switch (notification.type) {
      case "reply":
        return notification.reply?.text ?? "";
      case "comment":
      case "comment_like":
        return notification.comment?.text ?? "";
      case "like":
        return notification.post?.title ?? "";
      default:
        return "";
    }
  };

  const firstImage = getPostImage();
  const showContent =
    notification.reply ??
    notification.comment ??
    (["like", "comment", "reply"].includes(notification.type) &&
      notification.post);

  return (
    <Link
      href={getNotificationLink()}
      onClick={handleMarkAsRead}
      className={cn(
        "group flex items-start gap-2 rounded-lg p-2 transition-all hover:bg-muted/50",
        !notification.isRead ? "bg-primary/5" : "",
      )}
    >
      {/* Avatar with icon */}
      <div className="relative flex-shrink-0">
        <Avatar className="size-8 border border-background">
          <AvatarImage
            src={notification.actor.imageUrl ?? undefined}
            alt={notification.actor.name}
          />
          <AvatarFallback className="text-xs">
            {notification.actor.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
          <div className="flex size-3.5 items-center justify-center rounded-full bg-white dark:bg-gray-900">
            {getNotificationIcon()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs font-medium">
            {getNotificationText()}
          </p>
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
            {formatTimeToNow(notification.createdAt, {
              showDateAfterDays: 7,
            })}
          </span>
        </div>

        {/* Content preview */}
        {showContent && (
          <div className="mt-1 flex items-center gap-1.5">
            {firstImage && (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                <Image
                  src={firstImage.url || "/placeholder.svg"}
                  alt="Post image"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <p className="line-clamp-1 text-[11px] text-muted-foreground">
              {getContentText()}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
