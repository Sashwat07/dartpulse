import * as React from "react";

import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primaryNeon text-primaryForeground hover:opacity-90 shadow-glowShadow",
  secondary:
    "bg-glassBackground text-foreground border border-glassBorder hover:bg-surfaceHover shadow-panelShadow",
  ghost: "bg-transparent text-foreground hover:bg-surfaceSubtle",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

