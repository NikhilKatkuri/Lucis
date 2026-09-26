import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Material 3 chip: 32px tall, fully rounded, optional leading icon,
 * with tonal and outline variants.
 */
const chipVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full border font-medium",
    "transition-colors duration-150 ease-standard",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        tonal: "border-transparent",
        outline: "border-outline bg-transparent",
        solid: "border-transparent",
      },
      size: {
        sm: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "tonal",
      size: "md",
    },
  },
);

export type ChipTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "critical"
  | "high"
  | "medium"
  | "low";

const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-container text-primary-container-foreground",
  success: "bg-success-container text-success-container-foreground",
  warning: "bg-warning-container text-warning-container-foreground",
  danger: "bg-danger-container text-danger-container-foreground",
  info: "bg-info-container text-info-container-foreground",
  critical: "bg-severity-critical-container text-severity-critical",
  high: "bg-severity-high-container text-severity-high",
  medium: "bg-severity-medium-container text-severity-medium",
  low: "bg-severity-low-container text-severity-low",
};

const SOLID_TONE_CLASSES: Record<ChipTone, string> = {
  neutral: "bg-muted-foreground text-background",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  info: "bg-info text-info-foreground",
  critical: "bg-severity-critical text-white",
  high: "bg-severity-high text-white",
  medium: "bg-severity-medium text-warning-foreground",
  low: "bg-severity-low text-success-foreground",
};

const OUTLINE_TONE_CLASSES: Record<ChipTone, string> = {
  neutral: "border-outline text-muted-foreground",
  primary: "border-primary/40 text-primary",
  success: "border-success/40 text-success",
  warning: "border-warning/45 text-warning-container-foreground dark:text-warning",
  danger: "border-danger/40 text-danger",
  info: "border-info/40 text-info",
  critical: "border-severity-critical/40 text-severity-critical",
  high: "border-severity-high/45 text-severity-high",
  medium: "border-severity-medium/50 text-severity-medium",
  low: "border-severity-low/40 text-severity-low",
};

export interface ChipProps
  extends Omit<React.ComponentProps<"span">, "color">,
    VariantProps<typeof chipVariants> {
  tone?: ChipTone;
  icon?: React.ReactNode;
}

export function Chip({
  className,
  variant = "tonal",
  size = "md",
  tone = "neutral",
  icon,
  children,
  ...props
}: ChipProps) {
  const toneClasses =
    variant === "solid"
      ? SOLID_TONE_CLASSES[tone]
      : variant === "outline"
        ? OUTLINE_TONE_CLASSES[tone]
        : TONE_CLASSES[tone];

  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, size }), toneClasses, className)}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

export { chipVariants };
