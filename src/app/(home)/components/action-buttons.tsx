"use client";

import { BookmarkIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { MessageCircleIcon } from "lucide-react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { cn, showErrorToast } from "~/lib/utils";
import { type Post } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function ActionButtons({ post }: { post: Post }) {
  const toggleLike = api.likes.toggle.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex space-x-4">
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
          <Icons.heart className="size-6" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 rounded-full")}
        >
          <MessageCircleIcon className="size-6" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 rounded-full")}
        >
          <PaperPlaneIcon className="size-6" aria-hidden="true" />
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
  );
}
