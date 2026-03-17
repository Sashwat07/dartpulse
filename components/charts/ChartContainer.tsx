"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

const CHART_HEIGHT = 260;

type ChartContainerProps = {
  /** Optional section title (card label style). */
  title?: string;
  /** Optional short description below title. */
  description?: string;
  /** Optional class for the GlassCard. */
  className?: string;
  /** Chart content (e.g. LineChart, BarChart). Rendered inside ResponsiveContainer. */
  children: ReactNode;
};

/**
 * Reusable chart wrapper: GlassCard + consistent title/spacing + ResponsiveContainer.
 * All charts should use this for consistent layout and responsiveness.
 */
export function ChartContainer({
  title,
  description,
  className,
  children,
}: ChartContainerProps) {
  return (
    <GlassCard className={cn("min-w-0 p-5", className)}>
      <div className="space-y-3">
        {title != null && (
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description != null && (
              <p className="mt-0.5 text-xs text-mutedForeground break-words">{description}</p>
            )}
          </div>
        )}
        {title == null && description != null && (
          <p className="text-xs text-mutedForeground break-words">{description}</p>
        )}
        <div className="h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
