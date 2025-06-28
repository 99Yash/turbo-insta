"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Loading } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";

interface DeletePostModalProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  postId: string;
}

export function DeletePostModal({
  isOpen,
  setOpen,
  postId,
}: DeletePostModalProps) {
  const router = useRouter();

  const utils = api.useUtils();
  const deletePost = api.posts.delete.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await utils.posts.getAll.invalidate();
      await utils.posts.getByUserId.invalidate();
      router.refresh();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleDelete = async () => {
    await deletePost.mutateAsync({ postId });
  };
  return (
    <Modal showModal={isOpen} setShowModal={setOpen}>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Delete post</h2>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this post? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePost.isPending}
          >
            {deletePost.isPending ? <Loading className="size-4" /> : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
