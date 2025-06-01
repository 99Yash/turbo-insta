"use client";

import { formatDistanceToNow } from "date-fns";
import { Dot, Heart, MessageCircle, Reply, UserPlus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
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
    const iconClass = "size-3";
    switch (notification.type) {
      case "like":
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-red-100 ring-1 ring-red-200/50 dark:from-red-950/50 dark:to-red-900/50 dark:ring-red-800/50">
            <Heart
              className={cn(iconClass, "text-red-600 dark:text-red-400")}
              fill="currentColor"
            />
          </div>
        );
      case "comment":
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-200/50 dark:from-blue-950/50 dark:to-blue-900/50 dark:ring-blue-800/50">
            <MessageCircle
              className={cn(iconClass, "text-blue-600 dark:text-blue-400")}
            />
          </div>
        );
      case "reply":
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-green-100 ring-1 ring-green-200/50 dark:from-green-950/50 dark:to-green-900/50 dark:ring-green-800/50">
            <Reply
              className={cn(iconClass, "text-green-600 dark:text-green-400")}
            />
          </div>
        );
      case "follow":
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-50 to-purple-100 ring-1 ring-purple-200/50 dark:from-purple-950/50 dark:to-purple-900/50 dark:ring-purple-800/50">
            <UserPlus
              className={cn(iconClass, "text-purple-600 dark:text-purple-400")}
            />
          </div>
        );
      case "comment_like":
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-50 to-pink-100 ring-1 ring-pink-200/50 dark:from-pink-950/50 dark:to-pink-900/50 dark:ring-pink-800/50">
            <Heart
              className={cn(iconClass, "text-pink-600 dark:text-pink-400")}
              fill="currentColor"
            />
          </div>
        );
      default:
        return (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200/50 dark:from-gray-950/50 dark:to-gray-900/50 dark:ring-gray-800/50">
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
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">liked your post</span>
          </>
        );
      case "comment":
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">
              commented on your post
            </span>
          </>
        );
      case "reply":
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">
              replied to your comment
            </span>
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">started following you</span>
          </>
        );
      case "comment_like":
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">liked your comment</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>{" "}
            <span className="text-muted-foreground">
              sent you a notification
            </span>
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
        "group relative rounded-2xl border transition-all duration-300 hover:shadow-md hover:shadow-black/5",
        !notification.isRead
          ? "via-primary/3 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm dark:border-primary/30 dark:from-primary/10 dark:via-primary/5"
          : "border-border/40 bg-card/50 hover:bg-card/80",
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute right-4 top-4">
          <Dot
            className="h-6 w-6 animate-pulse text-primary"
            fill="currentColor"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Actor Avatar with notification icon overlay */}
          <div className="relative flex-shrink-0">
            <Avatar className="size-8 shadow-lg ring-2 ring-background dark:ring-gray-800">
              <AvatarImage
                src={notification.actor.imageUrl ?? undefined}
                alt={notification.actor.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                {notification.actor.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Notification type icon overlay */}
            <div className="absolute -bottom-1 -right-1 shadow-lg">
              {getNotificationIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Main notification text */}
            <div>
              <Link
                href={getNotificationLink()}
                onClick={handleMarkAsRead}
                className="block text-sm leading-relaxed transition-colors hover:text-primary"
              >
                {getNotificationText()}
              </Link>

              {/* Timestamp with better styling */}
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs font-normal"
                >
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </Badge>
              </div>
            </div>

            {/* Comment content with improved styling */}
            {notification.comment && (
              <div className="rounded-xl border-l-4 border-primary/30 bg-muted/30 p-3 backdrop-blur-sm">
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  &ldquo;{notification.comment.text}&rdquo;
                </p>
              </div>
            )}

            {/* Post content with enhanced design */}
            {shouldShowPostContent() && (
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm">
                {firstImage ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-border/50">
                      <Image
                        src={firstImage.url || "/placeholder.svg"}
                        alt={firstImage.alt ?? firstImage.name ?? "Post image"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="56px"
                      />
                    </div>
                    {"post" in notification && notification.post?.title && (
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
                          {notification.post.title}
                        </p>
                      </div>
                    )}
                  </div>
                ) : notification.post?.title ? (
                  <p className="line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
                    {notification.post.title}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    Post content
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Archive Action with improved styling */}
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              className="h-8 w-8 rounded-full p-0 opacity-0 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              title="Mark as read"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
