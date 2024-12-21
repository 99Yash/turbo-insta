"use client";

import { BookmarkIcon } from "@radix-ui/react-icons";
import { Heart, MessageCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { cn, showErrorToast } from "~/lib/utils";
import { type Post } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function ActionButtons({ post }: { post: Post }) {
  const utils = api.useUtils();
  const [isLiked, setIsLiked] = React.useState(false);
  const router = useRouter();

  const {
    data: likesData,
    isLoading,
    isError,
    error,
  } = api.posts.getLikes.useQuery(
    {
      postId: post.id,
    },
    {
      enabled: !!post,
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

  const toggleLike = api.likes.toggle.useMutation({
    async onSuccess() {
      await utils.posts.getLikes.invalidate({
        postId: post.id,
      });
    },
    onError(error) {
      showErrorToast(error);
    },
  });

  return (
    <div>
      <div className="flex w-full items-center justify-between [&_button:hover]:text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () =>
              await toggleLike.mutateAsync({
                postId: post.id,
              })
            }
            disabled={toggleLike.isPending}
            variant="ghost"
            size="icon"
            className={cn("size-7 rounded-full")}
          >
            <Heart
              className={cn(
                "size-6 transition-colors duration-200",
                isLiked && "fill-pink-500 text-pink-500",
              )}
              aria-hidden="true"
              aria-label="Like"
            />
            <span className="sr-only">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/posts/${post.id}`)}
            className={cn("size-7 rounded-full")}
          >
            <MessageCircleIcon
              className="size-6 -rotate-90"
              aria-hidden="true"
              aria-label="Comment"
            />
            <span className="sr-only">Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7 rounded-full")}
          >
            <Icons.share
              className="size-6"
              aria-hidden="true"
              aria-label="Share"
            />
            <span className="sr-only">Share</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7 rounded-full"
        >
          <BookmarkIcon className="size-6" aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-2 text-sm font-semibold">
        {likesData
          ? `${likesData.count} ${likesData.count === 1 ? "like" : "likes"}`
          : "\u00A0"}
      </p>
    </div>
  );
}
