import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { FullWidthLayout } from "../_components/sidebar/components";

export default async function ProfileLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <FullWidthLayout>
      <div className="mx-auto w-full max-w-[800px]">{children}</div>
    </FullWidthLayout>
  );
}
