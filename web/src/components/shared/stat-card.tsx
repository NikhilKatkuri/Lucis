import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled statistic tile. The dashboard's metric row and several page
 * headers are built from this single component.
 */
export interface StatCardProps extends React.ComponentProps<"article"> {
  label: string;
  value: React.ReactNode;
  /** Small print below the value, e.g. a trend or a comparison. */
  note?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  /** Stretch to the height of the grid row. */
  fill?: boolean;
}

const ICON_TONE = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-container text-primary-container-foreground",
  success: "bg-success-container text-success-container-foreground",
  warning: "bg-warning-container text-warning-container-foreground",
  danger: "bg-danger-container text-danger-container-foreground",
  info: "bg-info-container text-info-container-foreground",
} as const;

export function StatCard({
  className,
  label,
  value,
  note,
  icon,
  tone = "neutral",
  fill = false,
  ...props
}: StatCardProps) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-elevation-1",
        "transition-shadow duration-200 ease-standard hover:shadow-elevation-2",
        fill && "h-full",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
              ICON_TONE[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className="text-3xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>

      {note ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
      ) : null}
    </article>
  );
}
