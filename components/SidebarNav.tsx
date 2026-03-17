"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  Play,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/utils/cn";

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  pathPrefix?: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Home", exact: true, icon: LayoutDashboard },
  { href: "/match/new", label: "New Match", exact: false, pathPrefix: "/match", icon: Target },
  { href: "/resume", label: "Resume", exact: true, icon: Play },
  { href: "/leaderboard", label: "Leaderboard", exact: true, icon: Trophy },
  { href: "/players", label: "Players", exact: false, pathPrefix: "/players", icon: Users },
  { href: "/history", label: "History", exact: false, icon: Clock },
  { href: "/analytics", label: "Analytics", exact: true, icon: BarChart3 },
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
    <nav aria-label="Primary" className="flex h-full flex-col p-4 pt-5">
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primaryNeon/15 border border-primaryNeon/30">
          <Target size={16} className="text-primaryNeon" aria-hidden />
        </span>
        <span className="font-display text-base font-bold tracking-wide text-foreground">
          DartPulse
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact, item.pathPrefix);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  active
                    ? "bg-primaryNeon/10 text-primaryNeon shadow-[inset_0_0_0_1px_rgba(0,229,255,0.2)]"
                    : "text-mutedForeground hover:bg-surfaceHover hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-primaryNeon" : "text-mutedForeground"
                  )}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
