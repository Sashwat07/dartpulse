"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";

type Props = {
  initialColor: string;
};

export function ProfileColorClient({ initialColor }: Props) {
  const router = useRouter();
  const [avatarColor, setAvatarColor] = useState(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async () => {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/me/player", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
        Dart board color
      </h2>
      <p className="text-sm text-mutedForeground mb-3">
        You can update your player color anytime. Display name is fixed.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={avatarColor}
          onChange={(e) => setAvatarColor(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-button border border-glassBorder bg-glassBackground p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
        />
        <span className="text-xs text-mutedForeground tabular-nums">{avatarColor}</span>
        <Button type="button" variant="secondary" size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save color"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </GlassCard>
  );
}
