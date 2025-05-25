import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { ResponsiveSidebarLayout } from "../_components/responsive-sidebar-layout";

export default async function LobbyLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <ResponsiveSidebarLayout user={user} maxWidth="max-w-[670px]">
      {children}
    </ResponsiveSidebarLayout>
  );
}
