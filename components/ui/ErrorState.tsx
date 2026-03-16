import type { ReactNode } from "react";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

type ErrorStateProps = {
  title?: string;
  description: string;
  /** Optional retry action (e.g. button). */
  action?: ReactNode;
  className?: string;
};

/**
 * Reusable error state card. GlassCard-compatible.
 * Calm, non-alarming presentation.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <GlassCard className={cn("p-6 border-glassBorder", className)}>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-mutedForeground">{title}</p>
        <p className="text-sm text-mutedForeground">{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </GlassCard>
  );
}
