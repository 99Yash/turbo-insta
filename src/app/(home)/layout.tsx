import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { AppSidebar } from "./components/app-sidebar";

interface LobbyLayoutProps extends React.PropsWithChildren {}

export default async function LobbyLayout({ children }: LobbyLayoutProps) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="relative flex min-h-screen w-screen flex-col">
      <AppSidebar user={user} />
      <main>{children}</main>
    </div>
  );
}
