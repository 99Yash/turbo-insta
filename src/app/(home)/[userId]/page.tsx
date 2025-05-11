import { auth } from "@clerk/nextjs/server";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "~/config/site";
import { getUserById } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileView } from "../_components/profile/profile-view";

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const user = await getUserById(params.userId);

  if (!user) {
    return {
      title: "User not found | " + siteConfig.name,
      description: "This user could not be found",
    };
  }

  return {
    title: `${user.name} (@${user.username ?? user.id}) | ${siteConfig.name}`,
    description: `View ${user.name}'s profile on ${siteConfig.name}`,
  };
}

interface UserProfilePageProps {
  params: {
    userId: string;
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await auth();
  const user = await getUserById(params.userId);

  if (!user) {
    return notFound();
  }

  // Get all posts
  const posts = await api.posts.getAll({
    limit: 30,
  });

  // Filter posts by this user
  const userPosts = posts.items.filter((post) => post.users?.id === user.id);

  return (
    <HydrateClient>
      <ProfileView
        user={user}
        posts={userPosts.map((post) => post.posts)}
        isCurrentUser={userId === user.id}
      />
    </HydrateClient>
  );
}
