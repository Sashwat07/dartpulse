"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  PanelLeft,
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

type SidebarNavProps = {
  collapsed?: boolean;
  /** When set (desktop sidebar only), shows collapse/expand to the right of the brand (below when collapsed). */
  onDesktopSidebarToggle?: () => void;
};

export function SidebarNav({ collapsed = false, onDesktopSidebarToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const showDesktopToggle = Boolean(onDesktopSidebarToggle);

  return (
    <nav aria-label="Primary" className="flex h-full flex-col p-3 pt-4">
      {/* Brand + desktop collapse */}
      <div
        className={cn(
          "mb-4 flex px-1",
          showDesktopToggle && collapsed && "flex-col items-center gap-2",
          showDesktopToggle && !collapsed && "items-center gap-1.5",
          !showDesktopToggle && "items-center gap-2.5"
        )}
      >
        <Link
          href="/app"
          title="DartPulse — Home"
          className={cn(
            "flex items-center rounded-lg text-foreground outline-none transition-colors",
            "hover:text-primaryNeon focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            showDesktopToggle && !collapsed && "min-w-0 flex-1 gap-2.5",
            showDesktopToggle && collapsed && "justify-center",
            !showDesktopToggle && "gap-2.5"
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primaryNeon/15 border border-primaryNeon/30">
            <Target size={16} className="text-primaryNeon" aria-hidden />
          </span>
          {!collapsed && (
            <span className="font-display text-base font-bold tracking-wide whitespace-nowrap">
              DartPulse
            </span>
          )}
        </Link>
        {onDesktopSidebarToggle ? (
          <button
            type="button"
            onClick={onDesktopSidebarToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button border border-glassBorder text-mutedForeground hover:border-primaryNeon/40 hover:bg-surfaceSubtle hover:text-primaryNeon focus-ring transition-colors"
          >
            <PanelLeft size={16} />
          </button>
        ) : null}
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
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-button py-2 text-sm font-medium transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? "bg-primaryNeon/10 text-primaryNeon ring-1 ring-inset ring-primaryNeon/25"
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
                {!collapsed && item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
