import type { ReactNode } from "react";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  title?: string;
  description: string;
  /** Optional action (e.g. link or button). */
  action?: ReactNode;
  className?: string;
};

/**
 * Reusable empty state card. GlassCard-compatible.
 * Use in history, resume, leaderboard, analytics.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <GlassCard className={cn("p-8", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        {title ? (
          <p className="text-sm font-semibold text-foreground/70">{title}</p>
        ) : null}
        <p className="text-sm text-mutedForeground max-w-xs leading-relaxed">{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </GlassCard>
  );
}
