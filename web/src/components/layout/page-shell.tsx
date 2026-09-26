import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * CSS Grid page scaffold with a consistent heading block.
 *
 * Desktop: a single column capped at 1440px. Every page composes its own
 * responsive grid from here rather than inventing new wrappers.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pt-5 pb-24 sm:px-6 sm:pt-6 md:pb-8 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  /** Small uppercase label above the title. */
  kicker?: string;
  title: string;
  description?: string;
  /** Buttons, chips or controls aligned to the trailing edge. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {kicker ? (
          <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A titled surface. Replaces the prototype's `.panel` and gives every region
 * the same 1px outline, 16px radius and header treatment.
 */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div" | "article";
}) {
  const hasHeader = Boolean(title || actions);

  return (
    <Tag
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation-1",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-sm font-semibold text-foreground">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("min-w-0 flex-1 p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}
