"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { PostCarousel } from "~/components/utils/post-carousel";
import { useAuth } from "~/hooks/use-auth";
import { formatTimeToNow, getInitials, showErrorToast } from "~/lib/utils";
import { type Post, type User } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { ActionButtons } from "./action-buttons";
import { AddComment } from "./forms/add-comment";

interface PostProps {
  post: Post;
  author: User;
}

export function Post({ post, author }: PostProps) {
  const { userId } = useAuth();
  const isAuthor = userId === author.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const deletePost = api.posts.delete.useMutation({
    onSuccess: async () => {
      await utils.posts.getAll.invalidate();
      await utils.posts.getByUserId.invalidate({ userId: author.id });
      router.refresh();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleDelete = async () => {
    await deletePost.mutateAsync({ postId: post.id });
    setShowDeleteDialog(false);
  };

  return (
    <article
      key={post.id}
      className="mb-6 w-full border-b border-border pb-6 last:mb-0 last:border-b-0"
    >
      <div className="w-full">
        <div className="border-0 shadow-none">
          <div className="flex flex-row items-center gap-1.5 px-1 py-3.5">
            <Link href={`/${author.username}`}>
              <Avatar className="size-8">
                <AvatarImage
                  src={author.imageUrl ?? ""}
                  alt={author.name ?? "VH"}
                />
                <AvatarFallback>
                  {getInitials(author.name ?? "VH")}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex flex-1 items-center gap-2">
              <Link
                href={`/${author.username}`}
                className="transition-all duration-200 hover:text-muted-foreground"
              >
                <p className="text-sm font-semibold">{author.name ?? ""}</p>
              </Link>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                • {formatTimeToNow(post.createdAt)}
              </p>
            </div>

            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <DotsHorizontalIcon aria-hidden className="size-4" />
                <span className="sr-only">More options</span>
              </Button>
            )}
          </div>

          <PostCarousel files={post.images} />

          <div className="flex flex-col gap-3 pt-3">
            <ActionButtons postId={post.id} />
            <div className="text-sm">
              <span className="font-semibold">{author.name}</span> {post.title}
            </div>
          </div>

          <AddComment postId={post.id} />
        </div>
      </div>

      <Modal showModal={showDeleteDialog} setShowModal={setShowDeleteDialog}>
        <div className="flex flex-col space-y-4 p-6">
          <h2 className="text-lg font-semibold">Delete post</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </article>
  );
}
