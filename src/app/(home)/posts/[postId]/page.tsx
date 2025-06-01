import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCarousel } from "~/components/utils/post-carousel";
import { siteConfig } from "~/config/site";
import { formatDate } from "~/lib/utils";
import { getUserById } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { PostContent } from "../../_components/post-content";

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
          <PostContent post={post} author={author} />
        </div>
      </div>
    </HydrateClient>
  );
}
