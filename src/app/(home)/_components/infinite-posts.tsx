"use client";

import { useCallback, useEffect, useRef } from "react";
import { Icons } from "~/components/icons";
import { api } from "~/trpc/react";
import { Post } from "./post";

export function InfinitePosts() {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = api.posts.getAll.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = loadingRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-3 py-8">
        <Icons.spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-red-500">Error loading posts: {error.message}</div>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div ref={scrollElementRef} className="space-y-6">
      {allPosts.map((post) => {
        if (!post.users) return null;
        return (
          <Post key={post.posts.id} post={post.posts} author={post.users} />
        );
      })}

      {/* Loading indicator and intersection observer target */}
      <div ref={loadingRef} className="flex justify-center py-4">
        {isFetchingNextPage ? (
          <div className="text-muted-foreground">Loading more posts...</div>
        ) : hasNextPage ? (
          <div className="text-sm text-muted-foreground">Scroll for more</div>
        ) : allPosts.length > 0 ? (
          <div className="text-sm text-muted-foreground">No more posts</div>
        ) : null}
      </div>
    </div>
  );
}
