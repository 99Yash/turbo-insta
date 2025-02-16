"use client";

import Link from "next/link";
import * as React from "react";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";

interface CommentsListProps {
  postId: string;
}

export function CommentsList({ postId }: CommentsListProps) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    api.comments.getByPostId.useInfiniteQuery(
      {
        postId,
        limit: 13,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void (async () => {
        await fetchNextPage();
      })();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex flex-col space-y-4 py-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-start px-4 text-sm">
            <Skeleton className="mr-2 size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
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
    <div className="flex flex-col space-y-4 py-2">
      {data.pages.map((page) =>
        page.postComments.map((comment) => {
          if (!comment.user) return null;

          return (
            <div key={comment.id} className="flex items-start px-4 text-sm">
              <Link href={`/${comment.user.id}`}>
                <Avatar className="mr-2 size-7">
                  <AvatarImage
                    src={comment.user.imageUrl}
                    alt={comment.user.fullName ?? ""}
                  />
                  <AvatarFallback>
                    {getInitials(comment.user.fullName ?? "")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <span className="space-x-1">
                  <Link
                    href={`/${comment.user.id}`}
                    className="font-semibold hover:underline"
                  >
                    {comment.user.fullName}
                  </Link>
                  <span>{comment.text}</span>
                </span>
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
        <div ref={ref} className="h-8 border-t px-4">
          {isFetchingNextPage && (
            <div className="text-center text-sm text-muted-foreground">
              Loading more comments...
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
