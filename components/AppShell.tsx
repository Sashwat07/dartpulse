"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/SidebarNav";
import { TopBar } from "@/components/TopBar";

export type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background dark:bg-[radial-gradient(ellipse_at_top_left,#0d1525_0%,#080c15_55%,#060a12_100%)]">
      <div className="mx-auto grid w-full max-w-mainContent grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-sidebarBorder bg-sidebarBg backdrop-blur-[20px] lg:block">
          <SidebarNav />
        </aside>
        <div className="min-w-0 min-h-dvh">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>

      {/* Mobile nav overlay + drawer */}
      {mobileNavOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 h-dvh w-[260px] border-r border-sidebarBorder bg-sidebarBg backdrop-blur-[20px] lg:hidden"
            aria-label="Primary navigation"
          >
            <SidebarNav />
          </aside>
        </>
      ) : null}
    </div>
  );
}
