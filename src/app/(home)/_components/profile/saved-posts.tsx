"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Book2Small } from "~/components/ui/icons/nucleo";
import { api } from "~/trpc/react";
import { Post } from "../post";

export function SavedPosts() {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = api.posts.getUserBookmarks.useInfiniteQuery(
    {
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex w-full items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex w-full flex-col items-center justify-center py-16">
        <Book2Small className="size-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">
          Error loading saved posts
        </h3>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          {error?.message ?? "Something went wrong"}
        </p>
      </div>
    );
  }

  const allBookmarks = data?.pages.flatMap((page) => page.items) ?? [];

  if (allBookmarks.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-16">
        <Book2Small className="size-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No saved posts</h3>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          When you save posts, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {allBookmarks.map((bookmark) => {
          if (!bookmark.post || !bookmark.user) return null;

          return (
            <Post
              key={bookmark.bookmark.id}
              post={bookmark.post}
              author={bookmark.user}
            />
          );
        })}
      </div>

      {hasNextPage && (
        <div ref={ref} className="flex w-full items-center justify-center py-8">
          {isFetchingNextPage && (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {isFetching && !isFetchingNextPage && (
        <div className="flex w-full items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
