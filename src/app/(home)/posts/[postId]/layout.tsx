"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { useClickOutside } from "~/hooks/use-click-outside";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  useClickOutside({
    ref: contentRef,
    handler: () => {
      router.back();
    },
  });

  return (
    <Dialog defaultOpen={true}>
      <DialogContent
        ref={contentRef}
        className="max-w-screen-xl overflow-hidden rounded-none border-none bg-transparent p-0 outline-none focus-within:ring-0 focus-visible:outline-none focus-visible:ring-0"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
