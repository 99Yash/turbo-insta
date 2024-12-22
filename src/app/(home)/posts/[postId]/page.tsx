import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddComment } from "~/components/forms/add-comment";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button, buttonVariants } from "~/components/ui/button";
import { PostCarousel } from "~/components/utils/post-carousel";
import { users } from "~/lib/queries/user";
import { cn, getInitials } from "~/lib/utils";
import { api } from "~/trpc/server";
import { ActionButtons } from "../../components/action-buttons";

interface PostModalPageProps {
  params: {
    postId: string;
  };
}

export default async function PostModalPage({ params }: PostModalPageProps) {
  const post = await api.posts.getById({ postId: params.postId });

  if (!post) notFound();
  const author = users.find((user) => user.id === post.userId);
  if (!author) return notFound();

  return (
    <div className="flex w-full gap-2 px-0 sm:justify-end sm:gap-2">
      <Button
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "icon",
            className:
              "absolute right-10 top-4 h-auto w-auto shrink-0 rounded-sm bg-transparent p-0 text-foreground opacity-70 ring-offset-background transition-opacity hover:bg-transparent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
          }),
        )}
        asChild
      >
        <Link replace href={`/posts/${params.postId}`}>
          <EnterFullScreenIcon className="size-4" aria-hidden="true" />
        </Link>
      </Button>
      <AspectRatio ratio={6.13 / 3} className="border-r shadow-none">
        <PostCarousel files={post.images} />
      </AspectRatio>
      <div className="relative w-full space-y-6 py-6">
        <div className="absolute left-0 top-3 flex w-full items-center gap-1.5 border-b px-2 pb-3">
          <Link href={`/${author.id}`}>
            <Avatar className="size-6">
              <AvatarImage
                src={author.imageUrl}
                alt={author.fullName ?? "VH"}
              />
              <AvatarFallback>
                {getInitials(author.fullName ?? "VH")}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <span className="text-sm font-semibold">{author.fullName}</span>{" "}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex h-fit w-full flex-col gap-2 border-t px-2 pt-3">
          <ActionButtons post={post} />
          <AddComment postId={post.id} />
        </div>
      </div>
    </div>
  );
}
