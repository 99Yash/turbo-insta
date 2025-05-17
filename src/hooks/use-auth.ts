"use client";

import { useAuth as useClerkAuth } from "@clerk/nextjs";

export function useAuth() {
  const { userId } = useClerkAuth();

  return {
    userId: userId ?? "",
    isAuthenticated: !!userId,
  };
}
