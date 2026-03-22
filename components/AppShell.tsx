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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh app-shell-bg">
      <div className="mx-auto flex w-full max-w-mainContent">
        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 border-r border-sidebarBorder bg-sidebarBg backdrop-blur-[20px] transition-[width] duration-200 overflow-hidden ${
            desktopSidebarOpen ? "w-[240px]" : "w-[52px]"
          }`}
          aria-label="Primary navigation"
        >
          <SidebarNav
            collapsed={!desktopSidebarOpen}
            onDesktopSidebarToggle={() => setDesktopSidebarOpen((v) => !v)}
          />
        </aside>

        <div className="min-w-0 flex-1 min-h-dvh">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="p-3 lg:p-5">{children}</main>
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
            className="fixed left-0 top-0 z-50 h-dvh w-[240px] border-r border-sidebarBorder bg-sidebarBg backdrop-blur-[20px] lg:hidden"
            aria-label="Primary navigation"
          >
            <SidebarNav />
          </aside>
        </>
      ) : null}
    </div>
  );
}
