import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

type LoadingCardProps = {
  /** Optional message. Default "Loading…" */
  message?: string;
  className?: string;
};

/**
 * Reusable loading/skeleton card. GlassCard-compatible.
 * Use in PlayoffView and other async surfaces.
 */
export function LoadingCard({
  message = "Loading…",
  className,
}: LoadingCardProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-glassBorder border-t-primaryNeon"
          aria-hidden
        />
        <p className="text-sm font-medium text-mutedForeground">{message}</p>
      </div>
    </GlassCard>
  );
}
