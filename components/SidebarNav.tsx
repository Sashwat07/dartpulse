"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Play,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

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

const primaryNav = navItems.slice(0, 3);
const secondaryNav = navItems.slice(3);

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
  onDesktopSidebarToggle?: () => void;
};

function NavItem({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "sidebar-nav-item group",
          collapsed ? "justify-center px-1 py-3" : "gap-3.5 px-3.5 py-3",
          /* Expanded: full neumorphic active pill. Collapsed: icon color only — no oval background. */
          active && !collapsed && "sidebar-nav-item-active",
          active && collapsed && "border-transparent bg-transparent shadow-none",
          !active && "sidebar-nav-item-inactive",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon
          size={19}
          className={cn(
            "shrink-0 transition-colors duration-150",
            active ? "text-primaryNeon" : "text-mutedForeground group-hover:text-foreground"
          )}
          aria-hidden
        />
        {!collapsed && (
          <span
            className={cn(
              "text-[14.5px] font-medium leading-none transition-colors duration-150",
              active ? "text-primaryNeon" : "text-mutedForeground group-hover:text-foreground"
            )}
          >
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}

export function SidebarNav({ collapsed = false, onDesktopSidebarToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const showDesktopToggle = Boolean(onDesktopSidebarToggle);
  const { data: session, status } = useSession();

  const userInitial =
    session?.user?.name?.slice(0, 1) ??
    session?.user?.email?.slice(0, 1) ??
    "?";
  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const userEmail = session?.user?.email ?? "";

  return (
    <nav aria-label="Primary" className="flex h-full flex-col px-4 py-3">

      {/* ── Collapsed: expand button only (desktop) ───────────────────── */}
      {onDesktopSidebarToggle && collapsed && (
        <div className="mb-3 flex justify-center">
          <button
            type="button"
            onClick={onDesktopSidebarToggle}
            aria-label="Expand sidebar"
            className="sidebar-collapse-btn focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-mutedForeground hover:text-primaryNeon"
          >
            <PanelLeft size={14} />
          </button>
        </div>
      )}

      {/* ── Menu: label + collapse on one row (expanded desktop); label only (drawer) ── */}
      {!collapsed && (
        <>
          {showDesktopToggle ? (
            <div className="mb-2 flex min-h-7 items-center justify-between gap-1">
              <p className="sidebar-section-label mb-0 min-w-0 shrink pl-3.5">Menu</p>
              <button
                type="button"
                onClick={onDesktopSidebarToggle}
                aria-label="Collapse sidebar"
                className={cn(
                  "sidebar-collapse-btn focus-ring m-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-0 text-mutedForeground hover:text-primaryNeon",
                  "transition-opacity duration-200",
                  "opacity-0 pointer-events-none",
                  "group-hover:opacity-100 group-hover:pointer-events-auto",
                  "focus-visible:opacity-100 focus-visible:pointer-events-auto",
                )}
              >
                <PanelLeft size={14} />
              </button>
            </div>
          ) : (
            <p className="sidebar-section-label mb-2 px-3.5">Menu</p>
          )}
        </>
      )}

      {/* ── Menu: Home, New Match, Resume ─────────────────────────────── */}
      <div>
        <ul className="flex flex-col gap-0.5">
          {primaryNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isActive(pathname, item.href, item.exact, item.pathPrefix)}
            />
          ))}
        </ul>
      </div>

      {/* Group divider */}
      <div
        className={cn("sidebar-group-divider my-4", collapsed ? "mx-auto w-6" : "mx-1")}
        aria-hidden
      />

      {/* ── Explore: Leaderboard, Players, History, Analytics ─────────── */}
      <div>
        {!collapsed && (
          <p className="sidebar-section-label mb-2 px-3.5">Explore</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {secondaryNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isActive(pathname, item.href, item.exact, item.pathPrefix)}
            />
          ))}
        </ul>
      </div>

      {/* ── User profile card (pinned to bottom) ───────────────────────── */}
      <div className="mt-auto pt-4">
        <div className={cn("sidebar-divider mb-3", collapsed ? "mx-auto w-8" : "mx-1")} aria-hidden />

        {status === "authenticated" && session?.user ? (
          <div
            className={cn(
              "sidebar-user-card group flex items-center rounded-xl border border-transparent px-2 py-2.5 transition-all duration-180",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            {/* Avatar */}
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={34}
                height={34}
                className="rounded-full ring-1 ring-primaryNeon/25 shrink-0"
              />
            ) : (
              <span className="sidebar-user-avatar flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-black">
                {userInitial.toUpperCase()}
              </span>
            )}

            {/* Name + email */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                  {userName}
                </p>
                {userEmail && (
                  <p className="truncate text-[11px] text-mutedForeground leading-tight mt-0.5">
                    {userEmail}
                  </p>
                )}
              </div>
            )}

            {/* Sign out button */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Sign out"
                title="Sign out"
                className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-mutedForeground opacity-0 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus-ring"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        ) : status === "unauthenticated" ? (
          <Link
            href="/login"
            className={cn(
              "sidebar-nav-item sidebar-nav-item-inactive gap-3.5 px-3.5 py-3",
              collapsed && "justify-center px-1"
            )}
          >
            <span className="sidebar-user-avatar flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mutedForeground" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            {!collapsed && (
              <span className="text-[14.5px] font-medium text-mutedForeground">Sign in</span>
            )}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
