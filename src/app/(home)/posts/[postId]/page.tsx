import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddComment } from "~/components/forms/add-comment";
import { AlertDialogAction } from "~/components/ui/alert-dialog";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { buttonVariants } from "~/components/ui/button";
import { DialogShell } from "~/components/utils/dialog-shell";
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
    <DialogShell className="flex gap-2 overflow-visible">
      <AlertDialogAction
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
      </AlertDialogAction>
      <AspectRatio ratio={6.13 / 3} className="border-r shadow-none">
        <PostCarousel files={post.images} />
      </AspectRatio>
      <div className="relative w-full space-y-6 p-6">
        <div className="flex flex-row items-center gap-1.5 border-b px-1 py-3">
          <Link href={`/${author.id}`}>
            <Avatar className="size-8">
              <AvatarImage
                src={author.imageUrl}
                alt={author.fullName ?? "VH"}
              />
              <AvatarFallback>
                {getInitials(author.fullName ?? "VH")}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="text-sm">
            <span className="font-semibold">{author?.firstName}</span>{" "}
            {post.title}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 flex w-full flex-col gap-2 p-6 pt-0">
          <ActionButtons post={post} />
          <AddComment postId={post.id} />
        </div>
      </div>
    </DialogShell>
  );
}
