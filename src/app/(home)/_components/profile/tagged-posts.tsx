"use client";

import { Tag } from "~/components/ui/icons/nucleo";

interface TaggedPostsProps {
  username: string;
}

export function TaggedPosts({ username }: TaggedPostsProps) {
  // TODO: Implement tagged posts functionality when the API is ready
  return (
    <div className="flex w-full flex-col items-center justify-center py-16">
      <Tag className="size-16 text-muted-foreground" />
      <h3 className="mt-4 text-xl font-semibold">No tagged posts</h3>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        When people tag {username} in posts, they will appear here.
      </p>
    </div>
  );
}
