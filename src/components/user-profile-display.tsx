"use client";

import { useAuthenticatedUser, useUser } from "~/contexts/user-context";

/**
 * Example component showing how to use the user context
 * This component will safely handle both authenticated and unauthenticated states
 */
export function UserProfileDisplay() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">No user logged in</div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {user.imageUrl && (
        <img
          src={user.imageUrl}
          alt={`${user.name}'s profile`}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col">
        <span className="font-medium">{user.name}</span>
        <span className="text-sm text-muted-foreground">@{user.username}</span>
      </div>
    </div>
  );
}

/**
 * Example component that requires an authenticated user
 * This will throw an error if no user is authenticated
 */
export function AuthenticatedUserDisplay() {
  const user = useAuthenticatedUser();

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Welcome back, {user.name}!</h3>
      <p className="text-sm text-muted-foreground">Email: {user.email}</p>
      {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
    </div>
  );
}
