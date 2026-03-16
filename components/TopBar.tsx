"use client";

import { LogOut, Menu } from "lucide-react";
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
    <div className="flex h-14 items-center justify-between border-b border-glassBorder bg-glassBackground px-4 backdrop-blur-[20px]">
      <div className="flex items-center gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button border border-glassBorder text-foreground/90 hover:border-primaryNeon/40 hover:bg-surfaceSubtle hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] lg:hidden"
          >
            <Menu size={20} />
          </button>
        ) : null}
        <span className="text-sm font-medium text-mutedForeground lg:text-foreground/80">
          DartPulse
        </span>
      </div>
      <div className="flex items-center gap-2">
        {status === "loading" ? (
          <span className="text-xs text-mutedForeground">…</span>
        ) : session?.user ? (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaryNeon/20 text-xs font-medium text-primaryNeon">
                  {session.user.name?.slice(0, 1) ?? session.user.email?.slice(0, 1) ?? "?"}
                </span>
              )}
              <span className="max-w-[120px] truncate text-sm text-foreground">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-button border border-glassBorder bg-glassBackground px-2.5 py-1.5 text-xs font-medium text-foreground/90 hover:border-primaryNeon/40 hover:bg-surfaceSubtle hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              aria-label="Sign out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-3 py-1.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Sign in
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
