"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FullWidthLayout } from "../_components/sidebar/components";

export default function ProfileLayout({ children }: React.PropsWithChildren) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && (!user || !isSignedIn)) {
      router.replace("/signin");
    }
  }, [user, isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user || !isSignedIn) {
    return null;
  }

  return (
    <FullWidthLayout>
      <div className="mx-auto w-full max-w-[800px]">{children}</div>
    </FullWidthLayout>
  );
}
