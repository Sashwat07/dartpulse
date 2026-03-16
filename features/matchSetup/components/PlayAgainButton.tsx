"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PlayAgainButtonProps = {
  sourceMatchId: string;
  label?: string;
  variant?: "button" | "link";
  className?: string;
};

/**
 * Creates a new match from the source (same players, rounds, settings; shuffled order)
 * and navigates to the new live match. Uses POST /api/matches/from-match.
 */
export function PlayAgainButton({
  sourceMatchId,
  label = "Play again",
  variant = "button",
  className = "",
}: PlayAgainButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/matches/from-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMatchId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.matchId) {
        router.push(`/match/${data.matchId}`);
      } else {
        setPending(false);
      }
    } catch {
      setPending(false);
    }
  };

  if (variant === "link") {
    return (
      <Link
        href="#"
        onClick={handleClick}
        className={className || "inline-block text-sm text-amber-400 hover:underline"}
        aria-disabled={pending}
      >
        {pending ? "Creating…" : label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        className ||
        "rounded-button border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
      }
    >
      {pending ? "Creating…" : label}
    </button>
  );
}
