import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { SidebarLayout } from "../_components/sidebar/sidebar-layout";

export default async function LobbyLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <SidebarLayout user={user} variant="centered" maxWidth="max-w-[470px]">
      {children}
    </SidebarLayout>
  );
}
