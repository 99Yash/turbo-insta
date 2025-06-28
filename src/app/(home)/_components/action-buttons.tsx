"use client";

import {
  BookmarkIcon,
  Heart,
  Link as LinkIcon,
  MessageCircleIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { cn, showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";

export function ActionButtons({ postId }: { postId: string }) {
  const utils = api.useUtils();
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const [hasShownTip, setHasShownTip] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const {
    data: likesData,
    isLoading,
    isError,
    error,
  } = api.posts.getLikes.useQuery(
    {
      postId,
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  const {
    data: bookmarkData,
    isLoading: isBookmarkLoading,
    isError: isBookmarkError,
    error: bookmarkError,
  } = api.posts.getBookmarkStatus.useQuery(
    {
      postId,
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  React.useEffect(() => {
    if (isLoading) return;
    if (isError) {
      showErrorToast(error);
    } else if (likesData) {
      setIsLiked(likesData.hasLiked);
    }
  }, [isError, error, isLoading, likesData]);

  React.useEffect(() => {
    if (isBookmarkLoading) return;

    if (isBookmarkError) {
      showErrorToast(bookmarkError);
    } else if (bookmarkData) {
      setIsBookmarked(bookmarkData.isBookmarked);
    }
  }, [isBookmarkError, bookmarkError, isBookmarkLoading, bookmarkData]);

  const toggleLike = api.likes.toggle.useMutation({
    async onSuccess() {
      await utils.posts.getLikes.invalidate({
        postId,
      });
    },
    onError(error) {
      showErrorToast(error);
    },
  });

  const toggleBookmark = api.posts.toggleBookmark.useMutation({
    async onSuccess() {
      setIsBookmarked((prev) => !prev);
      await utils.posts.getBookmarkStatus.invalidate({
        postId,
      });
      await utils.posts.getUserBookmarks.invalidate();
    },
    onError(error) {
      showErrorToast(error);
    },
  });

  const handleHeartClick = async () => {
    await toggleLike.mutateAsync({
      postId,
      type: "post",
    });

    if (!hasShownTip) {
      toast.info("Tip: You can double click on posts to like them");
      setHasShownTip(true);
    }
  };

  const handleCommentClick = () => {
    if (pathname.includes("/posts")) {
      document.getElementById("add-comment")?.focus();
    } else {
      router.push(`/posts/${postId}`);
    }
  };

  return (
    <div>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Heart
            role="button"
            onClick={handleHeartClick}
            className={cn(
              "size-6 transition-colors duration-200",
              isLiked
                ? "fill-rose-500 text-rose-500"
                : "hover:text-muted-foreground",
            )}
            aria-hidden="true"
            aria-label="Like"
          />
          <span className="sr-only">Like</span>
          <MessageCircleIcon
            role="button"
            onClick={handleCommentClick}
            className="size-6 -rotate-90 transition-colors duration-200 hover:text-muted-foreground"
            aria-hidden="true"
            aria-label="Comment"
          />
          <span className="sr-only">Comment</span>

          <LinkIcon
            role="button"
            onClick={() => {
              void navigator.clipboard.writeText(
                `${window.location.origin}/posts/${postId}`,
              );
              toast.success("Link copied to clipboard.");
            }}
            className="size-6 transition-colors duration-200 hover:text-muted-foreground"
            aria-hidden="true"
            aria-label="Share"
          />
          <span className="sr-only">Share</span>
        </div>

        <BookmarkIcon
          role="button"
          onClick={async () => {
            await toggleBookmark.mutateAsync({
              postId,
            });
          }}
          className={cn(
            "size-6 transition-colors duration-200",
            isBookmarked
              ? "fill-foreground text-foreground"
              : "hover:text-muted-foreground",
          )}
          aria-hidden="true"
          aria-label="Bookmark"
        />
        <span className="sr-only">Bookmark</span>
      </div>

      <p className="mt-3.5 text-sm font-bold">
        {likesData
          ? `${likesData.count} ${likesData.count === 1 ? "like" : "likes"}`
          : "\u00A0"}
      </p>
    </div>
  );
}
