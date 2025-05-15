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
  const { items: posts } = await api.posts.getAll({
    limit: 30,
  });

  // Filter posts by this user
  const userPosts = posts.filter((post) => post.users?.id === user.id);

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
