import * as React from "react";

import { cn } from "@/utils/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
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

