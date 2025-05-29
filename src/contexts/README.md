# User Context System

This directory contains the user context implementation that provides authenticated user data throughout the application.

## Overview

The user context system consists of:

1. **`user-context.tsx`** - Client-side React context and hooks
2. **`user-provider-wrapper.tsx`** - Server component that fetches user data
3. **Usage hooks** - Custom hooks for common user data access patterns

## How it works

1. The `UserProviderWrapper` (server component) fetches user data using `getCachedUser()`
2. The fetched user data is passed to the client-side `UserProvider`
3. Client components can access user data via hooks

## Usage

### Basic user access

```tsx
"use client";

import { useUser } from "~/contexts/user-context";

export function MyComponent() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Hello, {user.name}!</div>;
}
```

### Authenticated user access

```tsx
"use client";

import { useAuthenticatedUser } from "~/contexts/user-context";

export function ProtectedComponent() {
  const user = useAuthenticatedUser(); // Throws if not authenticated

  return <div>Welcome, {user.name}!</div>;
}
```

### User ID access

```tsx
"use client";

import { useUserId, useAuthenticatedUserId } from "~/hooks/use-user-id";

export function MyComponent() {
  const userId = useUserId(); // string | null
  // or
  const userId = useAuthenticatedUserId(); // string (throws if not authenticated)
}
```

## Error Handling

The hooks will throw errors in these cases:

- `useUser()`, `useAuthenticatedUser()`, `useUserId()`, `useAuthenticatedUserId()` - if used outside of a UserProvider
- `useAuthenticatedUser()`, `useAuthenticatedUserId()` - if no user is authenticated

## Integration

The user context is automatically set up in the root layout (`src/app/layout.tsx`) and is available throughout the entire application.

## Type Safety

All hooks are fully typed with the `User` type from your database schema, providing excellent TypeScript support and autocompletion.
