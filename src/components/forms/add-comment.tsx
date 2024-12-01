"use client";

import { PaperPlaneIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { toast } from "sonner";
import { showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Loading } from "../ui/icons";
import { Input } from "../ui/input";

export function AddComment({ postId }: { postId: string }) {
  const [text, setText] = React.useState("");

  const addComment = api.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      setText("");
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  return (
    <div className="relative flex w-full items-center space-x-3 space-y-0">
      <Input
        className="flex-1 border-none bg-transparent text-sm placeholder:text-xs"
        placeholder="Add a comment..."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addComment.mutate({
              text,
              postId,
            });
            setText("");
          }
        }}
      />
      <Button
        disabled={!text || addComment.isPending}
        variant="ghost"
        size="icon"
        className="absolute right-[3px] top-[4px] z-20 size-7 text-sm font-semibold text-blue-500"
      >
        {addComment.isPending ? (
          <Loading className="mr-2 size-3.5" aria-hidden="true" />
        ) : (
          <PaperPlaneIcon className="mr-2 size-3.5" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
