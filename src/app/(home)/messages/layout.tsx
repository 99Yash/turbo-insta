"use client";

import { FullWidthLayout } from "../_components/sidebar/components";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FullWidthLayout showMobileTrigger={false}>{children}</FullWidthLayout>
  );
}
