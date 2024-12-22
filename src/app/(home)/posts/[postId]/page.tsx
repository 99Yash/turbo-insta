import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertDialogAction } from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { DialogShell } from "~/components/utils/dialog-shell";
import { PlaceholderImage } from "~/components/utils/placeholder-image";
import { cn, formatTimeToNow } from "~/lib/utils";
import { api } from "~/trpc/server";

interface PostModalPageProps {
  params: {
    postId: string;
  };
}

export default async function PostModalPage({ params }: PostModalPageProps) {
  const post = await api.posts.getById({ postId: params.postId });

  if (!post) notFound();

  return (
    <DialogShell className="flex flex-col gap-2 overflow-visible sm:flex-row">
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
      <AspectRatio ratio={16 / 9} className="w-full">
        {post.images?.length > 0 ? (
          <Image
            src={post.images[0]?.url ?? "/images/post-placeholder.webp"}
            alt={post.images[0]?.name ?? post.title ?? "Post"}
            className="object-cover"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
            fill
            loading="lazy"
          />
        ) : (
          <PlaceholderImage className="rounded-none" asChild />
        )}
      </AspectRatio>
      <div className="w-full space-y-6 p-6 sm:p-10">
        <div className="space-y-2">
          <h1 className="line-clamp-2 text-2xl font-bold">{post.title}</h1>

          <p className="line-clamp-4 text-base text-muted-foreground">
            {formatTimeToNow(post.createdAt)}
          </p>
        </div>
      </div>
    </DialogShell>
  );
}
