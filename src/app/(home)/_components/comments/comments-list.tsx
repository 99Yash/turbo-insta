"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/icons";
import { Skeleton } from "~/components/ui/skeleton";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";

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
      <div className="flex flex-col space-y-4 px-2 py-4">
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
    <div className="flex w-full flex-col gap-2">
      {data.pages.map((page) =>
        page.comments.map((comment) => {
          if (!comment.user) return null;

          return (
            <div
              key={comment.id}
              className="flex items-start px-2 py-4 text-sm"
            >
              <Link href={`/${comment.user.username}`}>
                <Avatar className="mr-2 size-7">
                  <AvatarImage
                    src={comment.user.imageUrl ?? ""}
                    alt={comment.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {getInitials(comment.user.name ?? "")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="inline">
                  <Link
                    href={`/${comment.user.username}`}
                    className="mr-1 font-semibold hover:underline"
                  >
                    {comment.user.username}
                  </Link>
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
