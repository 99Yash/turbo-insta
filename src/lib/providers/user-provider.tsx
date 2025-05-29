import type { ReactNode } from "react";
import { UserProvider as UserProviderComponent } from "~/contexts/user-context";
import { getCachedUser } from "~/lib/queries/user";

interface UserProviderProps {
  readonly children: ReactNode;
}

/**
 * Server component wrapper that fetches user data and provides it to the UserProvider
 */
export async function UserProvider({ children }: UserProviderProps) {
  const user = await getCachedUser();

  return (
    <UserProviderComponent initialUser={user}>{children}</UserProviderComponent>
  );
}
