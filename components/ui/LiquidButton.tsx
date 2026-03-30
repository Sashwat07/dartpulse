"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

/* ─────────────────────────────────────────────────────────────────────────────
   SVG displacement-map filter — inlined once, referenced everywhere.
   Uses a unique ID to avoid collisions with any other filters in the page.
───────────────────────────────────────────────────────────────────────────── */
function LiquidGlassFilter() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <defs>
        <filter
          id="dartpulse-liquid-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {/* Organic turbulence noise */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="2"
            result="turbulence"
          />
          {/* Slight blur so displacement edges aren't harsh */}
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          {/* Displace the backdrop through the liquid glass */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          {/* Soft final blur to sell the refraction depth */}
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Variant definitions
───────────────────────────────────────────────────────────────────────────── */
const liquidButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center cursor-pointer gap-2",
    "whitespace-nowrap font-semibold tracking-wide",
    "transition-[transform,opacity] duration-200",
    "disabled:pointer-events-none disabled:opacity-40",
    "outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "hover:scale-[1.03] active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Fully transparent — backdrop shows through the glass distortion */
        default: "text-white",
        /** Cyan-tinted — DartPulse brand tint */
        brand: "text-primaryNeon",
        /** Foreground-tinted — works in both light and dark mode */
        light: "text-foreground/85 dark:text-white/90",
      },
      size: {
        sm:  "h-9  rounded-full px-5  text-xs  gap-1.5",
        md:  "h-11 rounded-full px-7  text-sm",
        lg:  "h-12 rounded-full px-9  text-base",
        xl:  "h-14 rounded-full px-11 text-lg",
        icon:"h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "md",
    },
  }
);

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export type LiquidButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof liquidButtonVariants> & {
    asChild?: boolean;
  };

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const variantClass = cn(liquidButtonVariants({ variant, size }), className);

    /**
     * Radix `Slot` (asChild) requires exactly one React element child. Do not
     * render glass layers as siblings of Slot — they break `React.Children.only`.
     */
    if (asChild) {
      return (
        <>
          <LiquidGlassFilter />
          <Slot ref={ref} className={variantClass} {...props}>
            {children}
          </Slot>
        </>
      );
    }

    return (
      <>
        <LiquidGlassFilter />

        <button ref={ref} type="button" className={variantClass} {...props}>
          <span
            aria-hidden
            className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
            style={{ backdropFilter: 'url("#dartpulse-liquid-glass")' }}
          />

          <span
            aria-hidden
            className={cn(
              "absolute inset-0 z-[1] rounded-[inherit]",
              "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_8px_rgba(163,177,198,0.5),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.95),inset_-3px_-3px_0.5px_-3px_rgba(184,200,218,0.70),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.85),inset_-1px_-1px_1px_-0.5px_rgba(163,177,198,0.45),inset_0_0_6px_6px_rgba(255,255,255,0.35),inset_0_0_2px_2px_rgba(255,255,255,0.20)]",
              "dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.14),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.9),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.65),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.65),inset_0_0_6px_6px_rgba(255,255,255,0.10),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_16px_rgba(0,229,255,0.12)]",
            )}
          />

          <span className="relative z-10 inline-flex min-w-0 flex-row items-center justify-center gap-1.5">
            {children}
          </span>
        </button>
      </>
    );
  }
);

LiquidButton.displayName = "LiquidButton";
