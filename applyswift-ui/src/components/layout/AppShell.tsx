"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/login";

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main style={{ marginLeft: 220, minHeight: "100vh", padding: "28px 28px 40px", position: "relative", zIndex: 1 }}>
        {children}
      </main>
    </>
  );
}
