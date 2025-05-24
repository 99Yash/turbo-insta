import { auth } from "@clerk/nextjs/server";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "~/config/site";
import { getUserByUsername } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileView } from "../_components/profile/profile-view";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  if (params.username === "messages") {
    return {
      title: "Messages | " + siteConfig.name,
      description: "Messages on " + siteConfig.name,
    };
  }

  const user = await getUserByUsername(params.username);

  if (!user) {
    return {
      title: "User not found | " + siteConfig.name,
      description: "This user could not be found",
    };
  }

  return {
    title: `${user.name} (@${user.username}) | ${siteConfig.name}`,
    description: `View ${user.name}'s profile on ${siteConfig.name}`,
    openGraph: {
      title: `${user.name} (@${user.username}) | ${siteConfig.name}`,
      description: `View ${user.name}'s profile on ${siteConfig.name}`,
      images: [user.imageUrl ?? "/images/og.png"],
    },
  };
}

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await auth();
  const user = await getUserByUsername(params.username);

  if (!user) return notFound();

  // Get all posts
  const { items: posts } = await api.posts.getByUserId({
    userId: user.id,
  });

  // Get post engagement data
  const postsWithEngagement = await Promise.all(
    posts.map(async (post) => {
      const postId = post.id;
      // Get like counts
      const likeData = await api.posts.getLikes({ postId });
      // Get comment counts (if you have an API for this)
      // Assuming you'd create a similar endpoint for comment counts

      return {
        ...post,
        likeCount: likeData?.count ?? 0,
        commentCount: 0, // Replace with actual comment count if you have it
      };
    }),
  );

  return (
    <div className="min-h-screen bg-background">
      <HydrateClient>
        <ProfileView
          user={user}
          posts={postsWithEngagement}
          isCurrentUser={userId === user.id}
        />
      </HydrateClient>
    </div>
  );
}
