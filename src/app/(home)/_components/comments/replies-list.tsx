"use client";

import { Heart, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Loading } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/hooks/use-auth";
import { cn, formatTimeToNow, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";
import { UserHoverCard } from "../profile/profile-mini";

interface RepliesListProps {
  readonly commentId: string;
}

export function RepliesList({ commentId }: RepliesListProps) {
  const { userId } = useAuth();
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = api.comments.getReplies.useInfiniteQuery(
    {
      commentId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const trpcUtils = api.useUtils();

  const deleteReplyMutation = api.comments.deleteReply.useMutation({
    onSuccess: () => {
      setReplyToDelete(null);
      void trpcUtils.comments.getReplies.invalidate({ commentId });
      void trpcUtils.comments.getByPostId.invalidate();
    },
  });

  if (status === "pending") {
    return (
      <div className="ml-9 flex flex-col gap-3 px-3.5 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start text-sm">
            <Skeleton className="mr-2 size-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-2 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="ml-9 flex h-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center text-sm text-destructive">
          <div className="flex items-center gap-2">
            <Icons.activity className="h-4 w-4" />
            <span>Error loading replies</span>
          </div>
          <Button
            disabled={deleteReplyMutation.isPending}
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
    <div className="ml-9 flex w-full flex-col">
      {data.pages.map((page) =>
        page.replies.map((reply) => {
          if (!reply.user) return null;
          const isCurrentUser = reply.userId === userId;

          return (
            <div
              key={reply.id}
              className="group flex items-start px-3.5 py-3 text-sm"
            >
              <div className="flex items-start">
                <UserHoverCard user={reply.user}>
                  <Avatar className="mr-2 size-6 cursor-pointer">
                    <AvatarImage
                      src={reply.user.imageUrl ?? ""}
                      alt={reply.user.name ?? ""}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(reply.user.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                </UserHoverCard>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <p className="inline">
                    <UserHoverCard user={reply.user}>
                      <Link
                        role="button"
                        href={`/${reply.user.username}`}
                        className="mr-1 font-semibold transition-colors duration-200 hover:text-muted-foreground"
                      >
                        {reply.user.username}
                      </Link>
                    </UserHoverCard>
                    <span className="whitespace-pre-wrap break-words">
                      {reply.text}
                    </span>
                  </p>
                  <button className="flex items-center gap-1 self-end">
                    <Heart
                      className={cn(
                        "size-3 transition-all duration-200 hover:fill-rose-500 hover:text-rose-500",
                      )}
                    />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{formatTimeToNow(reply.createdAt)}</span>
                    <button className="font-semibold">Reply</button>
                    {isCurrentUser && (
                      <button
                        className="font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        onClick={() => setReplyToDelete(reply.id)}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    )}
                  </div>
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
            className="h-7 w-7 rounded-full p-0"
            onClick={async () => await fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loading className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            <span className="sr-only">Load more replies</span>
          </Button>
        </div>
      ) : null}

      {/* Delete Reply Modal */}
      <Modal
        showModal={!!replyToDelete}
        setShowModal={(show) => {
          if (!show) setReplyToDelete(null);
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-semibold">Delete Reply</h3>
          <p className="text-center text-muted-foreground">
            Are you sure you want to delete this reply? This action cannot be
            undone.
          </p>
          <div className="mt-2 flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setReplyToDelete(null);
              }}
              disabled={deleteReplyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                if (!replyToDelete) return;
                await deleteReplyMutation.mutateAsync({
                  replyId: replyToDelete,
                });
              }}
              disabled={deleteReplyMutation.isPending}
            >
              {deleteReplyMutation.isPending ? (
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
