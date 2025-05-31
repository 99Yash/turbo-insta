import { auth } from "@clerk/nextjs/server";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "~/config/site";
import { getUserByUsername } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileView } from "../../_components/profile/profile-view";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await getUserByUsername(params.username);

  if (!user) {
    return {
      title: "User not found | " + siteConfig.name,
      description: "This user could not be found",
    };
  }

  return {
    title: `${user.name} (@${user.username}) - Tagged Posts | ${siteConfig.name}`,
    description: `View posts where ${user.name} is tagged on ${siteConfig.name}`,
    openGraph: {
      title: `${user.name} (@${user.username}) - Tagged Posts | ${siteConfig.name}`,
      description: `View posts where ${user.name} is tagged on ${siteConfig.name}`,
      images: [user.imageUrl ?? "/images/og.png"],
    },
  };
}

interface TaggedPostsPageProps {
  params: {
    username: string;
  };
}

export default async function TaggedPostsPage({
  params,
}: TaggedPostsPageProps) {
  const { userId } = await auth();
  const user = await getUserByUsername(params.username);

  if (!user) return notFound();

  // Fetch the actual post count for consistent display
  const { items: userPosts } = await api.posts.getByUserId({
    userId: user.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <HydrateClient>
        <ProfileView
          user={user}
          posts={[]}
          isCurrentUser={userId === user.id}
          defaultTab="tagged"
          postCount={userPosts.length}
        />
      </HydrateClient>
    </div>
  );
}
