"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Loading } from "~/components/ui/icons";
import { Skeleton } from "~/components/ui/skeleton";
import { formatNumber, formatTimeToNow, getInitials } from "~/lib/utils";
import { type User } from "~/server/db/schema";
import { api } from "~/trpc/react";

interface UserHoverCardProps {
  user: Partial<User>;
  children: React.ReactNode;
}

function UserHoverCard({ user, children }: UserHoverCardProps) {
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
                {getInitials(user.name ?? "")}
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

interface CommentsListProps {
  postId: string;
}

export function CommentsList({ postId }: CommentsListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    api.comments.getByPostId.useInfiniteQuery(
      {
        postId,
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-4 space-y-4 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-start text-sm">
            <Skeleton className="mr-2 size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-56" />
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-2.5 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 text-sm text-destructive">Error loading comments</div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {data.pages.map((page) =>
        page.comments.map((comment) => {
          if (!comment.user) return null;

          return (
            <div
              key={comment.id}
              className="flex items-start px-2 py-4 text-sm"
            >
              <div className="flex items-start">
                <UserHoverCard user={comment.user}>
                  <Avatar className="mr-2 size-7 cursor-pointer">
                    <AvatarImage
                      src={comment.user.imageUrl ?? ""}
                      alt={comment.user.name ?? ""}
                    />
                    <AvatarFallback>
                      {getInitials(comment.user.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                </UserHoverCard>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="inline">
                  <UserHoverCard user={comment.user}>
                    <Link
                      href={`/${comment.user.username}`}
                      className="mr-1 font-semibold hover:underline"
                    >
                      {comment.user.username}
                    </Link>
                  </UserHoverCard>
                  <span className="whitespace-pre-wrap break-words">
                    {comment.text}
                  </span>
                </p>
                <div className="mt-1 flex space-x-3 text-xs text-muted-foreground">
                  <span>{formatTimeToNow(comment.createdAt)}</span>
                  <button className="font-semibold">Reply</button>
                </div>
              </div>
            </div>
          );
        }),
      )}

      {hasNextPage ? (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={async () => await fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loading className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="sr-only">Load more comments</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
