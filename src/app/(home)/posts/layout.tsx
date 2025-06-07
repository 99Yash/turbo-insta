import { SidebarLayout } from "../_components/sidebar/sidebar-layout";

export default async function LobbyLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <SidebarLayout variant="centered" width="w-[470px]">
      {children}
    </SidebarLayout>
  );
}
