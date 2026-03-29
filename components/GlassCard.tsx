import * as React from "react";

import { cn } from "@/utils/cn";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-glassBorder bg-glassBackground shadow-panelShadow",
        className,
      )}
      {...props}
    />
  );
}

