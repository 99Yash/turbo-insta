import { SiteHeader } from "~/components/layouts/header";
import { getCachedUser } from "~/lib/queries/user";

interface LobyLayoutProps extends React.PropsWithChildren {}

export default async function LobyLayout({ children }: LobyLayoutProps) {
  const user = await getCachedUser();

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">{children}</main>
      {/* <SiteFooter /> */}
    </div>
  );
}
