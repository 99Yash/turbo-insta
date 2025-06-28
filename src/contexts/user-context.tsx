"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import * as React from "react";
import type { User } from "~/server/db/schema/users";
import { api } from "~/trpc/react";

interface UserContextValue {
  readonly user: User | null;
  readonly isLoading: boolean;
}

const UserContext = React.createContext<UserContextValue | undefined>(
  undefined,
);

interface UserProviderProps {
  readonly children: React.ReactNode;
  readonly initialUser: User | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 5;

  // TRPC query to fetch user by ID, only enabled when we need to retry
  const {
    data: fetchedUser,
    isLoading: isFetching,
    refetch: refetchUser,
  } = api.user.getUserById.useQuery(
    { userId: clerkUser?.id ?? "" },
    {
      enabled: false, // We'll manually trigger this
      retry: false, // Handle retries manually
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );

  // Effect to handle user fetching when initial user is null
  React.useEffect(() => {
    // If we have a user already, don't retry
    if (user || !clerkLoaded || !clerkUser?.id) {
      return;
    }

    // If we've exceeded max retries, stop trying
    if (retryCount >= maxRetries) {
      console.warn(
        `[UserProvider] Max retries (${maxRetries}) exceeded for user fetch`,
      );
      return;
    }

    setIsLoading(true);

    // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, retryCount), 16000);

    console.log(
      `[UserProvider] User not found in database, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
    );

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const result = await refetchUser();
          if (result.data) {
            console.log(
              `[UserProvider] Successfully fetched user: ${result.data.username}`,
            );
            setUser(result.data);
            setIsLoading(false);
          } else {
            // User still doesn't exist, increment retry count
            setRetryCount((prev) => prev + 1);
            setIsLoading(false);
          }
        } catch (error) {
          console.error(`[UserProvider] Error fetching user:`, error);
          setRetryCount((prev) => prev + 1);
          setIsLoading(false);
        }
      })();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [user, clerkLoaded, clerkUser?.id, retryCount, refetchUser, maxRetries]);

  // Update user when fetchedUser changes
  React.useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser]);

  // Update loading state when TRPC is fetching
  React.useEffect(() => {
    if (isFetching) {
      setIsLoading(true);
    }
  }, [isFetching]);

  const value: UserContextValue = {
    user,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access the current user from context
 * @returns The user context value containing user data and loading state
 */
export function useUser(): UserContextValue {
  const context = React.useContext(UserContext);
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
