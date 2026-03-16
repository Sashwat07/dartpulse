"use client";

import { useEffect, useState } from "react";

import type { MatchStatePayload } from "@/types/dto";
import { useMatchStore } from "@/store/useMatchStore";

type LiveMatchHydratorProps = {
  matchId: string;
  children?: React.ReactNode;
};

export function LiveMatchHydrator({ matchId, children }: LiveMatchHydratorProps) {
  const setMatchState = useMatchStore((s) => s.setMatchState);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    setStatus("loading");
    setErrorMessage(null);
    fetch(`/api/matches/${matchId}/state`)
      .then((res) => {
        if (res.status === 404) {
          setStatus("error");
          setErrorMessage("Match not found");
          return null;
        }
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<MatchStatePayload>;
      })
      .then((data) => {
        if (data === null) return;
        setMatchState(data);
        setStatus("done");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to load match state");
      });
  }, [matchId, setMatchState]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="p-4 text-sm text-mutedForeground">
        Loading match…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 text-sm text-destructive">
        {errorMessage ?? "Failed to load match state"}
      </div>
    );
  }

  return <>{children}</>;
}
