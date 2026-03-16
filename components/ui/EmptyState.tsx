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
    <GlassCard className={cn("p-6", className)}>
      <div className="flex flex-col gap-2">
        {title ? (
          <p className="text-sm font-medium text-mutedForeground">{title}</p>
        ) : null}
        <p className="text-sm text-mutedForeground">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </GlassCard>
  );
}
