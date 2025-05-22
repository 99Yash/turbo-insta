"use client";

import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/hooks/use-auth";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";
import { UserHoverCard } from "../profile/profile-mini";

interface CommentsListProps {
  postId: string;
}

export function CommentsList({ postId }: CommentsListProps) {
  const { userId } = useAuth();
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    api.comments.getByPostId.useInfiniteQuery(
      {
        postId,
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const deleteCommentMutation = api.comments.delete.useMutation({
    onSuccess: () => {
      setCommentToDelete(null);
      // Refetch comments after deletion
      void refetch();
    },
  });

  const { refetch, isRefetching } = api.comments.getByPostId.useInfiniteQuery(
    {
      postId,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: false, // Don't run this query automatically
    },
  );

  const handleDeleteComment = () => {
    if (!commentToDelete) return;

    deleteCommentMutation.mutate({
      commentId: commentToDelete,
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
            disabled={isRefetching}
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

          return (
            <div
              key={comment.id}
              className="group flex items-start px-3.5 py-4 text-sm"
            >
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
                  <span className="whitespace-pre-wrap break-words">
                    {comment.text}
                  </span>
                </p>
                <div className="mt-1 flex space-x-3 text-xs text-muted-foreground">
                  <span>{formatTimeToNow(comment.createdAt)}</span>
                  <button className="font-semibold">Reply</button>
                  {isCurrentUser && (
                    <button
                      className="font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      onClick={() => setCommentToDelete(comment.id)}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
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
      <div>
        <Modal
          showModal={!!commentToDelete}
          setShowModal={(show) => {
            if (!show) setCommentToDelete(null);
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold">Delete Comment</h3>
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this comment? This action cannot
              be undone.
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
                onClick={handleDeleteComment}
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
    </div>
  );
}
