"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && <TopBar />}
      <main>{children}</main>
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<>{children}</>}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}