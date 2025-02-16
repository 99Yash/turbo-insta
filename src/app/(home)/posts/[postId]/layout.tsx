"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { useClickOutside } from "~/hooks/use-click-outside";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
        className="max-w-screen-2xl overflow-hidden p-0"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
