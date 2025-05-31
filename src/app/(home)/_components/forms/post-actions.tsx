"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { DeletePostModal } from "~/app/(home)/_components/forms/delete-post";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/hooks/use-auth";

interface PostActionsProps {
  postId: string;
  authorId: string;
}

export function PostActions({ postId, authorId }: PostActionsProps) {
  const { userId } = useAuth();
  const isAuthor = userId === authorId;
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  if (!isAuthor) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        onClick={() => setShowDeleteDialog(true)}
      >
        <DotsHorizontalIcon aria-hidden className="size-4" />
        <span className="sr-only">More options</span>
      </Button>

      <DeletePostModal
        isOpen={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        postId={postId}
      />
    </>
  );
}
