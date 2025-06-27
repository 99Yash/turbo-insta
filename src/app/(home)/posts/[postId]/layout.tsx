"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();

  return (
    <Dialog defaultOpen={true}>
      <VisuallyHidden asChild>
        <div className="sr-only">
          <DialogTitle>Post</DialogTitle>
          <DialogDescription>Post</DialogDescription>
        </div>
      </VisuallyHidden>

      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            router.back();
          }
        }}
        onInteractOutside={(_e) => {
          router.back();
        }}
        className="max-w-screen-xl overflow-hidden border-none bg-transparent p-0 outline-none focus-within:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:rounded-none"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
