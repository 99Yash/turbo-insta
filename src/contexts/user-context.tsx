"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "~/server/db/schema/users";

interface UserContextValue {
  readonly user: User | null;
  readonly isLoading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  readonly children: ReactNode;
  readonly initialUser: User | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const value: UserContextValue = {
    user: initialUser,
    isLoading: false,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access the current user from context
 * @returns The user context value containing user data and loading state
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

/**
 * Hook to get the current user, throwing an error if no user is authenticated
 * @returns The authenticated user object
 */
export function useAuthenticatedUser(): User {
  const { user } = useUser();
  if (!user) {
    throw new Error("No authenticated user found");
  }
  return user;
}
