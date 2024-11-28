import * as React from "react";
import { cn } from "~/lib/utils";

export function MaxWidthContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-screen-xl px-3 lg:px-10", className)}
    >
      {children}
    </div>
  );
}
