import { currentUser } from "@clerk/nextjs/server";
import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "~/config/site";
import { getUserById } from "~/server/api/services/user.service";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileView } from "../_components/profile/profile-view";

export const metadata: Metadata = {
  title: "Profile | " + siteConfig.name,
  description: "View and manage your profile",
};

export default async function ProfilePage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/signin");
  }

  const user = await getUserById(clerkUser.id);

  // Get a limited set of user's posts
  const posts = await api.posts.getAll({
    limit: 12,
  });

  // Filter posts by current user
  const userPosts = posts.items.filter((post) => post.userId === user.id);

  return (
    <HydrateClient>
      <ProfileView user={user} posts={userPosts} />
    </HydrateClient>
  );
}
