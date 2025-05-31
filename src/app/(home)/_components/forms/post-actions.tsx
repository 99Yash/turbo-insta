"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Create } from "~/app/(home)/_components/forms/create";
import { DeletePostModal } from "~/app/(home)/_components/forms/delete-post";
import { LucideIcons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/hooks/use-auth";
import type { Post } from "~/server/db/schema";

interface PostActionsProps {
  postId: string;
  authorId: string;
  post?: Post;
}

export function PostActions({ postId, authorId, post }: PostActionsProps) {
  const { userId } = useAuth();
  const isAuthor = userId === authorId;
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);

  if (!isAuthor) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <DotsHorizontalIcon aria-hidden className="size-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-2"
          >
            <LucideIcons.Edit2 className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <LucideIcons.Trash className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostModal
        isOpen={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        postId={postId}
      />

      {post && (
        <Create post={post} open={showEditDialog} setOpen={setShowEditDialog} />
      )}
    </>
  );
}
