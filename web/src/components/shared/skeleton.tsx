import type * as React from "react";

import { cn } from "@/lib/utils";

/** A single shimmering placeholder block. */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("lucis-skeleton rounded-md", className)}
      {...props}
    />
  );
}

/** Card-shaped placeholder matching `StatCard` geometry. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** A row of placeholders sized for dense tables and feeds. */
export function SkeletonRows({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a stats row. */
export function SkeletonStats({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/** Placeholder sized for a map viewport, including a legend block. */
export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-muted",
        className,
      )}
    >
      <Skeleton className="absolute inset-0 rounded-none opacity-60" />
      <div className="absolute top-3 left-3 flex gap-2">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      <div className="absolute bottom-3 left-3 flex gap-3">
        <Skeleton className="h-6 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/** Static bar heights so Tailwind can generate the utilities at build time. */
const CHART_BAR_HEIGHTS = [
  "h-[45%]",
  "h-[70%]",
  "h-[55%]",
  "h-[85%]",
  "h-[62%]",
  "h-[78%]",
  "h-[50%]",
] as const;

/** Placeholder for a chart plot area. */
export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex h-40 items-end gap-2">
        {CHART_BAR_HEIGHTS.map((height, index) => (
          <Skeleton key={index} className={cn("flex-1 rounded-t-md", height)} />
        ))}
      </div>
    </div>
  );
}
