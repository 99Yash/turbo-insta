"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();

  return (
    <Dialog defaultOpen={true}>
      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            router.back();
          }
        }}
        onInteractOutside={(_e) => {
          router.back();
        }}
        className="max-w-screen-xl overflow-hidden rounded-none border-none bg-transparent p-0 outline-none focus-within:ring-0 focus-visible:outline-none focus-visible:ring-0"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
