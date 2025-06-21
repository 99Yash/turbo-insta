"use client";

import { Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn, formatTimeToNow } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import type { StoredFile } from "~/types";

interface NotificationItemProps {
  readonly notification: RouterOutputs["notifications"]["getAll"]["notifications"][number];
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
      case "reply_like":
        return (
          <Heart className="size-3.5 text-orange-500" fill="currentColor" />
        );
      case "mention":
        return <MessageCircle className="size-3.5 text-yellow-500" />;
      default:
        return <Heart className="size-3.5 text-muted-foreground" />;
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actor.username;
    const timeText = formatTimeToNow(notification.createdAt, {
      showDateAfterDays: 7,
    });

    const getActionVerb = () => {
      switch (notification.type) {
        case "like":
          return "liked your post";
        case "comment":
          return "commented";
        case "reply":
          return "replied";
        case "follow":
          return "followed you";
        case "comment_like":
          return "liked your comment";
        case "reply_like":
          return "liked your reply";
        case "mention":
          return "mentioned you";
        default:
          return "";
      }
    };

    return (
      <>
        <span className="text-sm font-medium text-foreground">{actorName}</span>{" "}
        <span className="text-sm text-muted-foreground">{getActionVerb()}</span>
        <span aria-hidden className="mx-1 text-xs text-muted-foreground">
          •
        </span>
        <time
          className="text-xs text-muted-foreground"
          dateTime={notification.createdAt.toISOString()}
        >
          {timeText}
        </time>
      </>
    );
  };

  const getNotificationLink = () => {
    if (notification.postId) return `/posts/${notification.postId}`;
    if (notification.type === "follow")
      return `/profile/${notification.actor.username}`;
    if (notification.type === "mention") {
      // For mentions, check if they have context
      if (notification.postId) return `/posts/${notification.postId}`;
      if (notification.commentId && notification.postId)
        return `/posts/${notification.postId}`;
      if (notification.replyId && notification.postId)
        return `/posts/${notification.postId}`;
      return `/profile/${notification.actor.username}`;
    }
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
      case "reply_like":
        return notification.reply?.text ?? "";
      case "like":
        return notification.post?.title ?? "";
      case "mention":
        return notification.message ?? "";
      default:
        return "";
    }
  };

  const firstImage = getPostImage();

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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-muted-foreground">
              {getNotificationText()}
            </div>
            {/* Content text for comments, replies, etc. */}
            {getContentText() && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                {getContentText()}
              </p>
            )}
          </div>
          {/* Bigger image on the right */}
          {firstImage && (
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={firstImage.url || "/placeholder.svg"}
                alt="Post image"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
