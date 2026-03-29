"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/GlassCard";

const inputCls =
  "w-full rounded-button border border-glassBorder bg-glassBackground px-3 py-2.5 text-sm text-foreground placeholder:text-mutedForeground transition-colors focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20";

export function CompleteProfileForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState("#00e5ff");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/me/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save profile");
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <GlassCard className="p-5 max-w-md mx-auto">
      <h1 className="text-lg font-bold text-foreground">Complete your profile</h1>
      <p className="mt-1 text-sm text-mutedForeground">
        Choose your display name and color. Your name cannot be changed later.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="dp-name" className="block text-xs font-medium text-mutedForeground mb-1.5">
            Display name
          </label>
          <input
            id="dp-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputCls}
            required
            maxLength={80}
            autoComplete="nickname"
          />
        </div>
        <div>
          <label htmlFor="dp-color" className="block text-xs font-medium text-mutedForeground mb-1.5">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="dp-color"
              type="color"
              value={avatarColor}
              onChange={(e) => setAvatarColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-button border border-glassBorder bg-glassBackground p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
              required
            />
            <span className="text-xs text-mutedForeground tabular-nums">{avatarColor}</span>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <LiquidButton type="submit" variant="brand" size="md" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Continue to app →"}
        </LiquidButton>
      </form>
    </GlassCard>
  );
}
