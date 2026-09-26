import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { Chip, type ChipTone } from "@/components/shared/chip";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/api";

/**
 * Severity chip shared by every alert surface. The four-tone ramp is the
 * product's core visual language: red, orange, yellow, green.
 */
const severityChipVariants = cva("", {
  variants: {
    size: {
      sm: "h-6 px-2 text-[11px]",
      md: "h-8 px-3 text-xs",
    },
  },
  defaultVariants: { size: "md" },
});

export interface SeverityChipProps
  extends React.ComponentProps<typeof Chip>,
    VariantProps<typeof severityChipVariants> {
  severity: Severity;
}

export function SeverityChip({
  severity,
  size = "md",
  className,
  ...props
}: SeverityChipProps) {
  return (
    <Chip
      tone={SEVERITY_TONE[severity] as ChipTone}
      variant="tonal"
      size="sm"
      className={cn(severityChipVariants({ size }), className)}
      {...props}
    >
      {SEVERITY_LABEL[severity]}
    </Chip>
  );
}
