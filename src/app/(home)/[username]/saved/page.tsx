import { auth } from "@clerk/nextjs/server";
import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
    title: `${user.name} (@${user.username}) - Saved Posts | ${siteConfig.name}`,
    description: `View ${user.name}'s saved posts on ${siteConfig.name}`,
    openGraph: {
      title: `${user.name} (@${user.username}) - Saved Posts | ${siteConfig.name}`,
      description: `View ${user.name}'s saved posts on ${siteConfig.name}`,
      images: [user.imageUrl ?? "/images/og.png"],
    },
  };
}

interface SavedPostsPageProps {
  params: {
    username: string;
  };
}

export default async function SavedPostsPage({ params }: SavedPostsPageProps) {
  const { userId } = await auth();
  const user = await getUserByUsername(params.username);

  if (!user) return notFound();

  // Only allow users to view their own saved posts
  if (userId !== user.id) {
    redirect(`/${params.username}`);
  }

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
          defaultTab="saved"
          postCount={userPosts.length}
        />
      </HydrateClient>
    </div>
  );
}
