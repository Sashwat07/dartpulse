"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils/cn";

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  pathPrefix?: string;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Home", exact: true },
  { href: "/match/new", label: "New Match", exact: false, pathPrefix: "/match" },
  { href: "/resume", label: "Resume", exact: true },
  { href: "/leaderboard", label: "Leaderboard", exact: true },
  { href: "/players", label: "Players", exact: false, pathPrefix: "/players" },
  { href: "/history", label: "History", exact: false },
  { href: "/analytics", label: "Analytics", exact: true },
];

function isActive(
  pathname: string,
  href: string,
  exact: boolean,
  pathPrefix?: string
): boolean {
  if (pathPrefix && pathname.startsWith(pathPrefix)) return true;
  if (exact) return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-2 p-4">
      <div className="pb-3">
        <span className="text-sm font-semibold tracking-wide text-primaryNeon">DartPulse</span>
      </div>
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact, item.pathPrefix);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-button border px-3 py-2 text-sm transition-colors duration-150",
                  "hover:border-primaryNeon/30 hover:bg-surfaceHover",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  active
                    ? "border-primaryNeon/50 bg-primaryNeon/10 text-primaryNeon shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                    : "border-transparent text-foreground/90"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
