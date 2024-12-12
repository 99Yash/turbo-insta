import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";

export default async function Profile() {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }
  return (
    <div>
      <h1>Hello, Profile!</h1>
    </div>
  );
}
