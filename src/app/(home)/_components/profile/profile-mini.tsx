"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Skeleton } from "~/components/ui/skeleton";
import { formatNumber, getInitials } from "~/lib/utils";
import { type User } from "~/server/db/schema";
import { api } from "~/trpc/react";

interface UserHoverCardProps {
  user: Partial<User>;
  children: React.ReactNode;
}

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  const { data: userTopPosts, isLoading } = api.posts.getUserTopPosts.useQuery(
    {
      userId: user.id!,
    },
    {
      enabled: !!user.id,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-0">
        <div className="flex flex-col">
          <div className="flex items-start space-x-4 p-4">
            <Avatar className="size-14 border-2 border-background">
              <AvatarImage src={user.imageUrl ?? ""} alt={user.name ?? ""} />
              <AvatarFallback className="text-base">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{user.username}</h4>
                  <p className="text-xs text-muted-foreground">{user.name}</p>
                </div>
                <Button
                  size="sm"
                  className="h-8 bg-primary hover:bg-primary/90"
                >
                  Follow
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-around border-b border-t py-3">
            <div className="flex flex-col items-center">
              <span className="font-semibold">
                {formatNumber(userTopPosts?.length ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">3,471</span>
              <span className="text-xs text-muted-foreground">followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">3,064</span>
              <span className="text-xs text-muted-foreground">following</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1">
            {isLoading ? (
              // Loading state - show skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square bg-muted/40" />
              ))
            ) : !userTopPosts || userTopPosts.length === 0 ? (
              // No posts state
              <div className="col-span-3 flex items-center justify-center py-6 text-center">
                <p className="text-xs text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              // Show actual posts, fill remaining slots with placeholders
              <>
                {userTopPosts.map((postData) => (
                  <Link
                    href={`/p/${postData.post.id}`}
                    key={postData.post.id}
                    className="relative aspect-square overflow-hidden bg-muted"
                  >
                    {postData.post.images?.[0] && (
                      <Image
                        src={postData.post.images[0].url}
                        alt={postData.post.title ?? "Post image"}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    )}
                  </Link>
                ))}
                {/* Fill in remaining slots with empty placeholders */}
                {Array.from({
                  length: Math.max(0, 3 - (userTopPosts?.length || 0)),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square bg-muted/40"
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
