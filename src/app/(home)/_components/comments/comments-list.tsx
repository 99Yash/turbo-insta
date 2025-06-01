"use client";

import { Heart, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Icons, LucideIcons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/icons";
import { MentionText } from "~/components/ui/mention-parser";
import { Modal } from "~/components/ui/modal";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/hooks/use-auth";
import { cn, formatTimeToNow, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";
import { UserHoverCard } from "../profile/profile-mini";
import { RepliesList } from "./replies-list";

interface CommentsListProps {
  readonly postId: string;
  readonly onReply?: (username: string, commentId: string) => void;
}

export function CommentsList({ postId, onReply }: CommentsListProps) {
  const { userId } = useAuth();
  const [commentToDelete, setCommentToDelete] = React.useState<string | null>(
    null,
  );
  const [expandedReplies, setExpandedReplies] = React.useState<Set<string>>(
    new Set(),
  );
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = api.comments.getByPostId.useInfiniteQuery(
    {
      postId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Get all comment IDs from the data to fetch reply counts
  const commentIds = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) =>
      page.comments.map((comment) => comment.id),
    );
  }, [data]);

  // Fetch reply counts separately
  const { data: replyCountsData } =
    api.comments.getReplyCountsForComments.useQuery(
      { commentIds },
      { enabled: commentIds.length > 0 },
    );

  // Create a map for quick reply count lookup
  const replyCountsMap = React.useMemo(() => {
    if (!replyCountsData) return new Map<string, number>();
    return new Map(replyCountsData.map((item) => [item.commentId, item.count]));
  }, [replyCountsData]);

  const trpcUtils = api.useUtils();

  const deleteCommentMutation = api.comments.delete.useMutation({
    onSuccess: () => {
      setCommentToDelete(null);
      void trpcUtils.comments.getByPostId.invalidate({ postId });
      void trpcUtils.comments.getReplyCountsForComments.invalidate({
        commentIds,
      });
    },
  });

  const toggleLikeMutation = api.likes.toggle.useMutation({
    onSuccess: () => {
      void trpcUtils.comments.getByPostId.invalidate({ postId });
    },
  });

  const toggleReplies = (commentId: string): void => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-4 px-3.5 py-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-start text-sm">
            <Skeleton className="mr-2 size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-56" />
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
      <div className="flex h-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center text-sm text-destructive">
          <div className="flex items-center gap-2">
            <Icons.activity className="h-4 w-4" />
            <span>Error loading comments</span>
          </div>
          <Button
            disabled={deleteCommentMutation.isPending}
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {data.pages.map((page) =>
        page.comments.map((comment) => {
          if (!comment.user) return null;
          const isCurrentUser = comment.userId === userId;
          const replyCount = replyCountsMap.get(comment.id) ?? 0;

          return (
            <div key={comment.id} className="flex flex-col">
              <div className="group flex items-start px-3.5 py-4 text-sm">
                <div className="flex items-start">
                  <UserHoverCard user={comment.user}>
                    <Avatar className="mr-2 size-7 cursor-pointer">
                      <AvatarImage
                        src={comment.user.imageUrl ?? ""}
                        alt={comment.user.name ?? ""}
                      />
                      <AvatarFallback>
                        {getInitials(comment.user.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                  </UserHoverCard>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <p className="inline">
                      <UserHoverCard user={comment.user}>
                        <Link
                          role="button"
                          href={`/${comment.user.username}`}
                          className="mr-1 font-semibold transition-colors duration-200 hover:text-muted-foreground"
                        >
                          {comment.user.username}
                        </Link>
                      </UserHoverCard>
                      <MentionText
                        text={comment.text ?? ""}
                        className="whitespace-pre-wrap break-words"
                      />
                    </p>
                    <button
                      className="flex items-center gap-1 self-end"
                      onClick={async () => {
                        await toggleLikeMutation.mutateAsync({
                          type: "comment",
                          commentId: comment.id,
                        });
                      }}
                      disabled={toggleLikeMutation.isPending}
                    >
                      <Heart
                        className={cn(
                          "size-3 transition-all duration-200",
                          comment.hasLiked
                            ? "fill-rose-500 text-rose-500"
                            : "hover:fill-rose-500 hover:text-rose-500",
                        )}
                      />
                      {comment.likeCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {comment.likeCount}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between space-x-3 text-xs text-muted-foreground">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{formatTimeToNow(comment.createdAt)}</span>
                        <button
                          className="font-semibold"
                          onClick={() => {
                            if (onReply && comment.user?.username) {
                              onReply(comment.user.username, comment.id);
                            }
                          }}
                        >
                          Reply
                        </button>
                        {isCurrentUser && (
                          <button
                            className="font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            onClick={() => setCommentToDelete(comment.id)}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {replyCount > 0 && (
                        <button
                          className="font-semibold text-muted-foreground"
                          onClick={() => toggleReplies(comment.id)}
                        >
                          {expandedReplies.has(comment.id) ? (
                            <div className="flex items-center gap-2">
                              <LucideIcons.FoldVertical className="size-3.5" />
                              Hide replies
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <LucideIcons.Minus className="size-3.5" />
                              View replies ({replyCount})
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {expandedReplies.has(comment.id) && (
                <RepliesList commentId={comment.id} />
              )}
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

      {/* Delete Comment Modal */}
      <Modal
        showModal={!!commentToDelete}
        setShowModal={(show) => {
          if (!show) setCommentToDelete(null);
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-semibold">Delete Comment</h3>
          <p className="text-center text-muted-foreground">
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </p>
          <div className="mt-2 flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCommentToDelete(null);
              }}
              disabled={deleteCommentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                if (!commentToDelete) return;
                await deleteCommentMutation.mutateAsync({
                  commentId: commentToDelete,
                });
              }}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? (
                <Loading className="h-4 w-4" />
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
