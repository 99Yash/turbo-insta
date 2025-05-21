import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsList } from "~/app/(home)/_components/comments/comments-list";
import { AddComment } from "~/app/(home)/_components/forms/add-comment";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { PostCarousel } from "~/components/utils/post-carousel";
import { siteConfig } from "~/config/site";
import { formatDate, formatTimeToNow, getInitials } from "~/lib/utils";
import { getUserById } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { ActionButtons } from "../../_components/action-buttons";
import { UserHoverCard } from "../../_components/profile/profile-mini";

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

  const author = await getUserById(post.userId);

  if (!author) return { title: "Post not found" };
  return {
    title: `${post.title ? `${post.title} •` : ""} ${author.name} on ${siteConfig.name}`,
    description: post.title,
    openGraph: {
      type: "website",
      locale: "en_US",
      title: `${post.title ? `${post.title} •` : ""} ${author.name} on ${siteConfig.name}`,
      description:
        post.title ??
        `Look at ${author.name}'s post from ${formatDate(post.createdAt)}`,
      url: `${siteConfig.url}/posts/${post.id}`,
      images: post.images.map((image) => ({
        url: image.url,
        width: 1200,
        height: 630,
        alt: image.alt,
      })),
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title
        ? `${post.title}`
        : `${author.name} on ${siteConfig.name}`,
      description: post.title
        ? `${post.title} • ${author.name} on ${siteConfig.name}`
        : `Look at ${author.name}'s post from ${formatDate(post.createdAt)}`,
      images: post.images.map((image) => image.url),
      site: siteConfig.url,
      creator: "@YashGouravKar1",
      creatorId: "YashGouravKar1",
    },
  };
};

export default async function PostModalPage({ params }: PostModalPageProps) {
  const post = await api.posts.getById({ postId: params.postId });

  if (!post) notFound();
  const author = await getUserById(post.userId);
  if (!author) return notFound();

  return (
    <HydrateClient>
      <div className="flex h-[calc(100vh-4rem)] w-full rounded-none">
        <div className="relative flex-1 basis-0 border-none">
          <PostCarousel
            files={post.images}
            className="h-full rounded-none border-r border-r-muted-foreground/20 shadow-none"
            modal
            optimize={false}
          />
        </div>
        <div className="flex w-[450px] flex-col">
          <div className="flex items-center gap-1.5 border-b px-3.5 py-4">
            <UserHoverCard user={author}>
              <div className="flex items-center gap-2">
                <Link href={`/${author.username}`} role="button">
                  <Avatar className="size-7">
                    <AvatarImage
                      src={author.imageUrl ?? ""}
                      alt={author.name ?? "VH"}
                    />
                    <AvatarFallback>
                      {getInitials(author.name ?? "VH")}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <span className="text-sm font-semibold" role="button">
                  {author.username}
                </span>
              </div>
            </UserHoverCard>
          </div>

          <div className="h-[calc(100%-8rem)] overflow-y-auto scrollbar-hide">
            {post.title && (
              <div className="px-3.5 py-4">
                <div className="flex items-start gap-2">
                  <UserHoverCard user={author}>
                    <Link href={`/${author.username}`} role="button">
                      <Avatar className="size-7">
                        <AvatarImage
                          src={author.imageUrl ?? ""}
                          alt={author.name ?? "VH"}
                        />
                        <AvatarFallback>
                          {getInitials(author.name ?? "VH")}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </UserHoverCard>
                  <div className="flex flex-col gap-1">
                    <div>
                      <UserHoverCard user={author}>
                        <span className="text-sm font-semibold" role="button">
                          {author.username}
                        </span>
                      </UserHoverCard>{" "}
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

            <CommentsList postId={post.id} />
          </div>

          <div className="border-t py-4">
            <div className="px-2">
              <ActionButtons postId={post.id} />
              <p className="pb-3.5 text-xs font-medium text-muted-foreground">
                {formatTimeToNow(
                  post.createdAt,
                  {
                    showDateAfterDays: 10,
                  },
                  {
                    addSuffix: true,
                    locale: undefined,
                  },
                )}
              </p>
            </div>
            <div className="border-b"></div>
            <div className="px-2">
              <AddComment postId={post.id} />
            </div>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
