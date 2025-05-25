import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { ProfileSidebarLayout } from "../_components/sidebar/profile-sidebar-layout";

export default async function ProfileLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return <ProfileSidebarLayout user={user}>{children}</ProfileSidebarLayout>;
}
