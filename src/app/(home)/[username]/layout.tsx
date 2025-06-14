import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";

export default async function ProfileLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  // Don't nest SidebarLayout - parent layout handles sidebar
  return <>{children}</>;
}
