"use client";

import { LogOut, Menu, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/ThemeToggle";

export type TopBarProps = {
  onMenuClick?: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session, status } = useSession();

  return (
    <div className="flex h-14 items-center justify-between border-b border-glassBorder bg-glassBackground/80 px-4 backdrop-blur-[20px]">
      <div className="flex items-center gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button border border-glassBorder text-mutedForeground hover:border-primaryNeon/40 hover:bg-surfaceSubtle hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] transition-colors lg:hidden"
          >
            <Menu size={18} />
          </button>
        ) : null}
        {/* Brand mark — shown on mobile (sidebar hidden) */}
        <Link
          href="/app"
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon rounded lg:hidden"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primaryNeon/15 border border-primaryNeon/30">
            <Target size={14} className="text-primaryNeon" aria-hidden />
          </span>
          <span className="font-display text-sm font-bold tracking-wide text-foreground">
            DartPulse
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5">
        {status === "loading" ? (
          <span className="text-xs text-mutedForeground px-2">…</span>
        ) : session?.user ? (
          <>
            <div className="hidden items-center gap-2 sm:flex mr-1">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={26}
                  height={26}
                  className="rounded-full ring-1 ring-glassBorder"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaryNeon/15 text-xs font-semibold text-primaryNeon border border-primaryNeon/25">
                  {session.user.name?.slice(0, 1) ?? session.user.email?.slice(0, 1) ?? "?"}
                </span>
              )}
              <span className="max-w-[120px] truncate text-sm font-medium text-foreground/80">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-button border border-glassBorder bg-glassBackground px-2.5 py-1.5 text-xs font-medium text-mutedForeground hover:border-primaryNeon/30 hover:bg-surfaceSubtle hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-button border border-primaryNeon/40 bg-primaryNeon/10 px-3 py-1.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Sign in
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
