import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { AppSidebar } from "./components/app-sidebar";

interface LayoutProps
  extends React.PropsWithChildren<{
    modal: React.ReactNode;
  }> {}

export default async function LobbyLayout({ children, modal }: LayoutProps) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="flex h-full">
      <div className="fixed left-0 top-0 z-20 h-full border-r border-border">
        <AppSidebar />
      </div>
      <div className="flex-1">
        <div className="mx-auto max-w-[470px]">{children}</div>
      </div>
      {modal}
    </div>
  );
}
