"use client";

import Image from "next/image";
import Link from "next/link";
import { Icons } from "~/components/icons";
import { GridLayoutRows } from "~/components/ui/icons/nucleo";
import { type Post } from "~/server/db/schema";

interface ProfilePostsProps {
  posts: Post[];
}

export function ProfilePosts({ posts }: ProfilePostsProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Icons.reel className="size-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Posts Yet</h3>
        <p className="mt-2 text-center text-muted-foreground">
          When you share photos and videos, they will appear on your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-6 lg:gap-8">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="relative aspect-square overflow-hidden bg-muted"
        >
          <Image
            src={post.images[0]?.url ?? ""}
            alt={post.images[0]?.alt ?? post.title ?? "Post image"}
            fill
            className="object-cover transition-all duration-200 hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 300px, 400px"
          />

          {post.images.length > 1 && (
            <div className="absolute right-2 top-2">
              <GridLayoutRows className="size-4 text-white" />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
