import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsList } from "~/components/comments/comments-list";
import { AddComment } from "~/components/forms/add-comment";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { PostCarousel } from "~/components/utils/post-carousel";
import { siteConfig } from "~/config/site";
import { users } from "~/lib/queries/user";
import { getInitials } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";
import { ActionButtons } from "../../components/action-buttons";

interface PostModalPageProps {
  params: {
    postId: string;
  };
}

export const generateMetadata = async ({
  params,
}: PostModalPageProps): Promise<Metadata> => {
  const post = await api.posts.getById({ postId: params.postId });
  if (!post) return { title: "Post not found" };

  const author = users.find((user) => user.id === post?.userId);

  if (!author) return { title: "Post not found" };
  return {
    title: `${post.title} - ${author?.fullName} on ${siteConfig.name}`,
    description: post.title,
    openGraph: {
      type: "website",
      locale: "en_US",
      title: `${author?.fullName} on ${siteConfig.name}`,
      description: post.title ?? "",
      url: `${siteConfig.url}/posts/${post.id}`,
      images: post.images.map((image) => ({
        url: image.url,
        width: 1200,
        height: 630,
        alt: post.title ?? "",
      })),
    },
  };
};

export default async function PostModalPage({ params }: PostModalPageProps) {
  const post = await api.posts.getById({ postId: params.postId });

  if (!post) notFound();
  const author = users.find((user) => user.id === post.userId);
  if (!author) return notFound();

  return (
    <HydrateClient>
      <div className="flex w-full gap-2 px-0 sm:justify-end sm:gap-2">
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

          <div className="mb-20 mt-12 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <CommentsList postId={post.id} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex h-fit w-full flex-col gap-2 border-t bg-background px-2 pt-3">
            <ActionButtons post={post} />
            <AddComment postId={post.id} />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
