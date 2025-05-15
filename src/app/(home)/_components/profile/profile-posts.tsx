"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "~/components/icons";
import { GridLayoutRows } from "~/components/ui/icons/nucleo";
import { type Post } from "~/server/db/schema";

interface ProfilePostsProps {
  posts: (Post & {
    likeCount?: number;
    commentCount?: number;
  })[];
}

export function ProfilePosts({ posts }: ProfilePostsProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icons.reel className="size-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Posts Yet</h3>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          When you share photos and videos, they will appear on your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="group relative aspect-square overflow-hidden rounded-md bg-muted shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          <Image
            src={post.images[0]?.url ?? ""}
            alt={post.images[0]?.alt ?? post.title ?? "Post image"}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
            sizes="(max-width: 640px) 95vw, (max-width: 768px) 45vw, 30vw"
            priority
          />

          {/* Hover overlay with engagement stats */}
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="flex items-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <Heart className="size-5 fill-white drop-shadow-md" />
                <span className="text-base font-semibold drop-shadow-md">
                  {post.likeCount ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 fill-white drop-shadow-md" />
                <span className="text-base font-semibold drop-shadow-md">
                  {post.commentCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Post title on hover */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <p className="truncate text-sm font-medium text-white drop-shadow-md">
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
      ))}
    </div>
  );
}
