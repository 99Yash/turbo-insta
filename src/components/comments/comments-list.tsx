"use client";

import Link from "next/link";
import * as React from "react";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
        limit: 20,
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

  if (status === "pending")
    return <div className="p-4">Loading comments...</div>;
  if (status === "error")
    return <div className="p-4">Error loading comments</div>;

  return (
    <div className="flex flex-col space-y-4 px-4 py-2">
      {data.pages.map((page) =>
        page.postComments.map((comment) => {
          const user = comment.user;

          if (!user) return null;

          return (
            <div key={comment.id} className="flex items-start space-x-2">
              <Link href={`/${user.id}`}>
                <Avatar className="size-6">
                  <AvatarImage src={user.imageUrl} alt={user.fullName ?? ""} />
                  <AvatarFallback>
                    {getInitials(user.fullName ?? "")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <Link
                    href={`/${user.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {user.fullName}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeToNow(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            </div>
          );
        }),
      )}

      <div ref={ref} className="h-4">
        {isFetchingNextPage && (
          <div className="text-center text-sm text-muted-foreground">
            Loading more comments...
          </div>
        )}
      </div>
    </div>
  );
}
