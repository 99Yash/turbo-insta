import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsList } from "~/app/(home)/components/comments/comments-list";
import { AddComment } from "~/app/(home)/components/forms/add-comment";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { PostCarousel } from "~/components/utils/post-carousel";
import { siteConfig } from "~/config/site";
import { users } from "~/lib/queries/user";
import { formatTimeToNow, getInitials } from "~/lib/utils";
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
      <div className="flex h-[calc(100vh-4rem)] w-full gap-2">
        <div className="relative flex-1 basis-0">
          <PostCarousel
            files={post.images}
            className="h-full border-r shadow-none"
            modal
          />
        </div>
        <div className="flex w-full basis-[450px] flex-col">
          <div className="flex items-center gap-1.5 border-b px-4 py-3">
            <Link href={`/${author.id}`}>
              <Avatar className="size-7">
                <AvatarImage
                  src={author.imageUrl}
                  alt={author.fullName ?? "VH"}
                />
                <AvatarFallback>
                  {getInitials(author.fullName ?? "VH")}
                </AvatarFallback>
              </Avatar>
            </Link>
            <span className="text-sm font-semibold">{author.fullName}</span>
          </div>

          {post.title && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-2">
                <Link href={`/${author.id}`}>
                  <Avatar className="size-7">
                    <AvatarImage
                      src={author.imageUrl}
                      alt={author.fullName ?? "VH"}
                    />
                    <AvatarFallback>
                      {getInitials(author.fullName ?? "VH")}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-sm font-semibold">
                      {author.fullName}
                    </span>{" "}
                    <span className="text-sm">{post.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeToNow(post.createdAt, {
                      showDateAfterDays: 10,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="h-[calc(100%-8rem)] overflow-y-auto scrollbar-hide">
            <CommentsList postId={post.id} />
          </div>

          <div className="border-t bg-background px-2 py-3">
            <ActionButtons postId={post.id} />
            <AddComment postId={post.id} />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
