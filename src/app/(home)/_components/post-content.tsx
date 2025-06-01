"use client";

import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import type { Post, User } from "~/server/db/schema";
import { ActionButtons } from "./action-buttons";
import { CommentsList } from "./comments/comments-list";
import { AddComment } from "./forms/add-comment";
import { PostActions } from "./forms/post-actions";
import { UserHoverCard } from "./profile/profile-mini";

interface PostContentProps {
  readonly post: Post;
  readonly author: User;
}

interface ReplyState {
  readonly username: string;
  readonly commentId: string;
}

export function PostContent({ post, author }: PostContentProps) {
  const [replyState, setReplyState] = React.useState<ReplyState | null>(null);

  const handleReply = React.useCallback(
    (username: string, commentId: string) => {
      setReplyState({ username, commentId });
    },
    [],
  );

  const clearReply = React.useCallback(() => {
    setReplyState(null);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between border-b px-3.5 py-4">
        <UserHoverCard user={author}>
          <div className="flex items-center gap-2">
            <Link href={`/${author.username}`} role="button">
              <Avatar className="size-7">
                <AvatarImage
                  src={author.imageUrl ?? ""}
                  alt={author.name ?? "VH"}
                />
                <AvatarFallback>
                  {getInitials(author.name ?? "VH")}
                </AvatarFallback>
              </Avatar>
            </Link>
            <span
              role="button"
              className="text-sm font-semibold transition-colors duration-200 hover:text-muted-foreground"
            >
              {author.username}
            </span>
          </div>
        </UserHoverCard>

        <PostActions postId={post.id} authorId={author.id} post={post} />
      </div>

      <div className="h-[calc(100%-8rem)] overflow-y-auto scrollbar-hide">
        {post.title && (
          <div className="px-3.5 py-4">
            <div className="flex items-start gap-2">
              <UserHoverCard user={author}>
                <Link href={`/${author.username}`} role="button">
                  <Avatar className="size-7">
                    <AvatarImage
                      src={author.imageUrl ?? ""}
                      alt={author.name ?? "VH"}
                    />
                    <AvatarFallback>
                      {getInitials(author.name ?? "VH")}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </UserHoverCard>
              <div className="flex flex-col gap-1">
                <div>
                  <UserHoverCard user={author}>
                    <span
                      className="text-sm font-semibold transition-colors duration-200 hover:text-muted-foreground"
                      role="button"
                    >
                      {author.username}
                    </span>
                  </UserHoverCard>{" "}
                  <span className="text-sm">{post.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeToNow(post.createdAt, {
                    showDateAfterDays: 10,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <CommentsList postId={post.id} onReply={handleReply} />
      </div>

      <div className="border-t py-4">
        <div className="px-3.5">
          <ActionButtons postId={post.id} />
          <p className="pb-3.5 text-xs font-medium text-muted-foreground">
            {formatTimeToNow(
              post.createdAt,
              {
                showDateAfterDays: 10,
              },
              {
                addSuffix: true,
                locale: undefined,
              },
            )}
          </p>
        </div>
        <div className="border-b"></div>
        <div className="px-3.5">
          <AddComment
            postId={post.id}
            replyState={replyState}
            onClearReply={clearReply}
          />
        </div>
      </div>
    </>
  );
}
