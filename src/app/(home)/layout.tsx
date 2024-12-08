import { getCachedUser } from "~/lib/queries/user";
import { AppSidebar } from "./components/app-sidebar";

interface LobbyLayoutProps extends React.PropsWithChildren {}

export default async function LobbyLayout({ children }: LobbyLayoutProps) {
  const user = await getCachedUser();

  return (
    <div className="relative flex min-h-screen flex-col">
      {user && <AppSidebar user={user} />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
