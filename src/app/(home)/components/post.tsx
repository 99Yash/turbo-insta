import { type User } from "@clerk/nextjs/server";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { AddComment } from "~/components/forms/add-comment";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { PostCarousel } from "~/components/utils/post-carousel";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { type Post } from "~/server/db/schema";
import { ActionButtons } from "./action-buttons";

interface PostProps {
  post: Post;
  author: User;
}

export function Post({ post, author }: PostProps) {
  return (
    <div key={post.id} className="flex flex-col items-center gap-2">
      <div className="border-0 shadow-none">
        <div className="flex flex-row items-center gap-1.5 px-1 py-3.5">
          <Link href={`/${author.id}`}>
            <Avatar className="size-8">
              <AvatarImage
                src={author?.imageUrl}
                alt={author?.fullName ?? "VH"}
              />
              <AvatarFallback>
                {getInitials(author?.fullName ?? "VH")}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-1 items-center gap-2">
            <Link
              href={`/${author.id}`}
              className="transition-all duration-200 hover:text-muted-foreground"
            >
              <p className="text-sm font-semibold">{author?.fullName}</p>
            </Link>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              • {formatTimeToNow(post.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <DotsHorizontalIcon aria-hidden className="size-4" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
        <div className="w-[calc(100vw-2px)] max-w-[470px] rounded">
          <PostCarousel files={post.images} />
        </div>
        <div className="flex flex-col gap-3 py-3">
          <ActionButtons post={post} />
          <div className="text-sm">
            <span className="font-semibold">{author?.firstName}</span>{" "}
            {post.title}
          </div>
        </div>

        <AddComment postId={post.id} />
      </div>
    </div>
  );
}
