"use client";

import {
  BookmarkIcon,
  ChatBubbleIcon,
  HeartIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import { showErrorToast } from "~/lib/utils";
import { type Post } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function ActionButtons({ post }: { post: Post }) {
  const toogleLike = api.likes.toggle.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex space-x-4">
        <Button
          onClick={() =>
            toogleLike.mutate({
              postId: post.id,
            })
          }
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
        >
          <HeartIcon className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <ChatBubbleIcon className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <PaperPlaneIcon className="h-6 w-6" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-9 w-9 rounded-full"
      >
        <BookmarkIcon className="h-6 w-6" />
      </Button>
    </div>
  );
}
