"use client";

import { BookmarkIcon } from "@radix-ui/react-icons";
import { MessageCircleIcon } from "lucide-react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { cn, showErrorToast } from "~/lib/utils";
import { type Post } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function ActionButtons({ post }: { post: Post }) {
  const utils = api.useUtils();

  const { data: likesData, isLoading } = api.posts.getLikes.useQuery(
    {
      postId: post.id,
    },
    {
      enabled: !!post,
      refetchOnWindowFocus: false,
    },
  );

  const toggleLike = api.likes.toggle.useMutation({
    async onSuccess(data, variables, context) {
      await utils.posts.getLikes.invalidate({
        postId: post.id,
      });
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const isLiked = likesData?.hasLiked;

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
            <Icons.heart
              className={cn("size-6", isLiked && "fill-pink-500 text-pink-500")}
              aria-hidden="true"
            />
            <span className="sr-only">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7 rounded-full")}
          >
            <MessageCircleIcon
              className="size-6 -rotate-90"
              aria-hidden="true"
            />
            <span className="sr-only">Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7 rounded-full")}
          >
            <Icons.share className="size-6" aria-hidden="true" />
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
      <p className="text-sm font-semibold">n likes</p>
    </div>
  );
}
