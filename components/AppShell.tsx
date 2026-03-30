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
    <div className="flex min-h-dvh flex-col app-shell-bg">
      <div className="mx-auto flex w-full max-w-mainContent flex-col flex-1 gap-2">
        {/* Full-width TopBar — spans above sidebar + content */}
        <div className="shrink-0 px-2 pt-2">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        {/* Sidebar + Content — gap-2 above separates from TopBar; px-2 matches bar inset */}
        <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
          {/* Desktop sidebar — rounded card, same inset + border language as TopBar */}
          <aside
            className={`group hidden lg:flex flex-col shrink-0 overflow-hidden rounded-2xl border border-glassBorder bg-sidebarBg backdrop-blur-[20px] transition-[width] duration-200 ${
              desktopSidebarOpen ? "w-[240px]" : "w-[52px]"
            }`}
            style={{ boxShadow: "var(--topBarShadow)" }}
            aria-label="Primary navigation"
          >
            <SidebarNav
              collapsed={!desktopSidebarOpen}
              onDesktopSidebarToggle={() => setDesktopSidebarOpen((v) => !v)}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <main className="p-3 lg:p-5">{children}</main>
          </div>
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
            className="fixed bottom-2 left-2 top-2 z-50 w-[240px] overflow-hidden rounded-2xl border border-glassBorder bg-sidebarBg backdrop-blur-[20px] lg:hidden"
            style={{ boxShadow: "var(--topBarShadow)" }}
            aria-label="Primary navigation"
          >
            <SidebarNav />
          </aside>
        </>
      ) : null}
    </div>
  );
}
