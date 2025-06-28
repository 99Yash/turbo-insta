"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useInView } from "react-intersection-observer";
import { Book2Small, GridLayoutRows, Icons } from "~/components/icons";
import { api } from "~/trpc/react";

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

  React.useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex w-full items-center justify-center py-16">
        <Icons.spinner className="size-8 text-muted-foreground" />
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {allBookmarks.map((bookmark) => {
          if (!bookmark.post || !bookmark.user) return null;

          const post = bookmark.post;

          return (
            <Link
              key={bookmark.bookmark.id}
              href={`/posts/${post.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

              <Image
                src={post.images[0]?.url ?? ""}
                alt={post.images[0]?.alt ?? post.title ?? "Post image"}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
                sizes="(max-width: 640px) 95vw, (max-width: 768px) 45vw, 25vw"
                priority
              />

              {/* Hover overlay with engagement stats */}
              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-8 text-white">
                  <div className="flex items-center gap-2">
                    <Heart className="size-5 fill-white drop-shadow-md" />
                    <span className="text-base font-semibold drop-shadow-md">
                      {"likeCount" in post ? post.likeCount : 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-5 fill-white drop-shadow-md" />
                    <span className="text-base font-semibold drop-shadow-md">
                      {"commentCount" in post ? post.commentCount : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post title on hover */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <p className="truncate text-center text-sm font-medium text-white drop-shadow-md">
                  {post.title ?? "Post"}
                </p>
              </div>

              {/* Post type indicators */}
              {post.images.length > 1 && (
                <div className="absolute right-2 top-2 z-20">
                  <GridLayoutRows className="size-4 text-white drop-shadow-lg" />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {hasNextPage && (
        <div ref={ref} className="flex w-full items-center justify-center py-8">
          {isFetchingNextPage && (
            <Icons.spinner className="size-6 text-muted-foreground" />
          )}
        </div>
      )}

      {isFetching && !isFetchingNextPage && (
        <div className="flex w-full items-center justify-center py-4">
          <Icons.spinner className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
