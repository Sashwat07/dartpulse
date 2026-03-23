"use client";

import { BookOpen, ChevronDown, LogOut, Menu, Target, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { RulebookModal } from "@/components/RulebookModal";

export type TopBarProps = {
  onMenuClick?: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session, status } = useSession();
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userInitial =
    session?.user?.name?.slice(0, 1) ??
    session?.user?.email?.slice(0, 1) ??
    "?";
  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const userMenuLabel = (() => {
    const firstToken = userName.trim().split(/\s+/)[0] ?? "";
    if (!firstToken) return "";
    return firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase();
  })();

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [userMenuOpen]);

  return (
    <>
      {/* TopBar */}
      <div
        className="relative z-30 flex h-14 items-center justify-between px-4 backdrop-blur-[24px]"
        style={{
          background: "var(--glassBackground)",
          borderBottom: "1px solid var(--glassBorder)",
          boxShadow: "0 1px 0 0 rgba(0,229,255,0.06), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Neon accent line at bottom */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, rgba(0,229,255,0.25) 40%, rgba(0,229,255,0.08) 70%, transparent 100%)",
          }}
          aria-hidden
        />

        {/* ── Left: hamburger + brand ── */}
        <div className="flex items-center gap-2.5">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-glassBorder text-mutedForeground hover:border-primaryNeon/40 hover:bg-primaryNeon/8 hover:text-primaryNeon focus-ring transition-all duration-150 lg:hidden"
            >
              <Menu size={17} />
            </button>
          ) : null}

          {/* Mobile brand */}
          <Link
            href="/app"
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon/60 rounded-lg lg:hidden"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primaryNeon/30"
              style={{ background: "rgba(0,229,255,0.12)" }}
            >
              <Target size={13} className="text-primaryNeon" aria-hidden />
            </span>
            <span className="font-display text-sm font-bold tracking-wide text-foreground">
              DartPulse
            </span>
          </Link>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex items-center gap-2">

          {/* Rules button */}
          <button
            type="button"
            onClick={() => setRulebookOpen(true)}
            aria-label="Open rulebook"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-ring"
            style={{
              border: "1px solid rgba(0,229,255,0.25)",
              background: "rgba(0,229,255,0.06)",
              color: "var(--primaryNeon)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,229,255,0.5)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 10px rgba(0,229,255,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,229,255,0.25)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
          >
            <BookOpen size={13} strokeWidth={2.2} />
            <span className="hidden sm:inline tracking-wide">Rules</span>
          </button>

          {/* Thin separator */}
          <div
            className="hidden sm:block h-5 w-px mx-0.5"
            style={{ background: "var(--glassBorder)" }}
            aria-hidden
          />

          {status === "loading" ? (
            <span className="text-xs text-mutedForeground px-2">…</span>
          ) : session?.user ? (
            /* ── User dropdown ── */
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
                className="flex items-center gap-2 rounded-lg border border-glassBorder px-2.5 py-1.5 transition-all duration-150 hover:bg-surfaceSubtle focus-ring"
                style={userMenuOpen ? { borderColor: "rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.05)" } : undefined}
              >
                {/* Avatar */}
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={22}
                    height={22}
                    className="rounded-full ring-1 ring-primaryNeon/20 shrink-0"
                  />
                ) : (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,229,255,0.1))",
                      border: "1px solid rgba(0,229,255,0.3)",
                      color: "var(--primaryNeon)",
                    }}
                  >
                    {userInitial.toUpperCase()}
                  </span>
                )}
                {/* Name — hidden on very small screens */}
                <span className="hidden sm:block max-w-[110px] truncate text-xs font-semibold text-foreground/85">
                  {userMenuLabel}
                </span>
                <ChevronDown
                  size={12}
                  className="hidden sm:block shrink-0 text-mutedForeground transition-transform duration-150"
                  style={{ transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {/* Dropdown panel */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-[200] w-52 rounded-xl border border-glassBorder overflow-hidden"
                  style={{
                    background: "color-mix(in srgb, var(--background) 92%, transparent)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset",
                  }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-glassBorder/60">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-mutedForeground mb-0.5">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    {session.user.email && session.user.name && (
                      <p className="text-[11px] text-mutedForeground truncate mt-0.5">
                        {session.user.email}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition-colors hover:bg-surfaceSubtle focus-ring"
                    >
                      <User size={14} className="shrink-0 text-mutedForeground" />
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-ring"
                    >
                      <LogOut size={14} className="shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-outline-primary focus-ring px-3 py-1.5 text-xs font-semibold"
            >
              Sign in
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>

      <RulebookModal open={rulebookOpen} onClose={() => setRulebookOpen(false)} />
    </>
  );
}
