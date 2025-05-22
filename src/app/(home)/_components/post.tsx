"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { PostCarousel } from "~/components/utils/post-carousel";
import { useAuth } from "~/hooks/use-auth";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { type Post, type User } from "~/server/db/schema";
import { ActionButtons } from "./action-buttons";
import { AddComment } from "./forms/add-comment";
import { DeletePostModal } from "./forms/delete-post";

interface PostProps {
  post: Post;
  author: User;
}

export function Post({ post, author }: PostProps) {
  const { userId } = useAuth();
  const isAuthor = userId === author.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <article
      key={post.id}
      className="mb-6 w-full border-b border-border pb-6 last:mb-0 last:border-b-0"
    >
      <div className="w-full">
        <div className="border-0 shadow-none">
          <div className="flex flex-row items-center gap-1.5 px-1 py-3.5">
            <Link href={`/${author.username}`}>
              <Avatar className="size-8">
                <AvatarImage
                  src={author.imageUrl ?? ""}
                  alt={author.name ?? "VH"}
                />
                <AvatarFallback>
                  {getInitials(author.name ?? "VH")}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex flex-1 items-center gap-2">
              <Link
                href={`/${author.username}`}
                className="transition-all duration-200 hover:text-muted-foreground"
              >
                <p className="text-sm font-semibold">{author.username}</p>
              </Link>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                • {formatTimeToNow(post.createdAt)}
              </p>
            </div>

            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <DotsHorizontalIcon aria-hidden className="size-4" />
                <span className="sr-only">More options</span>
              </Button>
            )}
          </div>

          <PostCarousel
            files={post.images}
            className="rounded-sm border border-muted-foreground/20"
          />

          <div className="flex flex-col gap-3 pt-3">
            <ActionButtons postId={post.id} />
            <div className="text-sm">
              <span className="font-semibold">{author.username}</span>{" "}
              {post.title}
            </div>
          </div>

          <AddComment postId={post.id} />
        </div>
      </div>

      <DeletePostModal
        isOpen={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        postId={post.id}
      />
    </article>
  );
}
