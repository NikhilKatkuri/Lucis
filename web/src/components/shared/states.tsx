import {
  CloudSlashIcon,
  CompassIcon,
  MapTrifoldIcon,
  SirenIcon,
  WarningCircleIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateKind =
  | "alerts"
  | "resources"
  | "reports"
  | "analytics"
  | "generic";

const ILLUSTRATION: Record<
  EmptyStateKind,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  alerts: { icon: SirenIcon, label: "No active alerts" },
  resources: { icon: MapTrifoldIcon, label: "No resources in range" },
  reports: { icon: CompassIcon, label: "No community reports" },
  analytics: { icon: CloudSlashIcon, label: "Not enough data yet" },
  generic: { icon: CompassIcon, label: "Nothing to show" },
};

export interface EmptyStateProps extends React.ComponentProps<"div"> {
  kind?: EmptyStateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Every page renders one of these instead of a blank region. The illustration is
 * a tinted icon well rather than a bitmap, so it inherits the active theme.
 */
export function EmptyState({
  kind = "generic",
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  const { icon: Icon, label } = ILLUSTRATION[kind];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-2xl bg-primary-container text-primary-container-foreground"
      >
        <Icon className="size-7" />
      </span>

      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <p className="sr-only">{label}</p>

      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export type ErrorStateKind =
  | "api"
  | "socket"
  | "location"
  | "offline"
  | "generic";

const ERROR_ICON: Record<
  ErrorStateKind,
  React.ComponentType<{ className?: string }>
> = {
  api: WarningCircleIcon,
  socket: WifiSlashIcon,
  location: CompassIcon,
  offline: CloudSlashIcon,
  generic: WarningCircleIcon,
};

export interface ErrorStateProps extends React.ComponentProps<"div"> {
  kind?: ErrorStateKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const DEFAULT_TITLES: Record<ErrorStateKind, string> = {
  api: "Cannot reach the Lucis service",
  socket: "Live updates disconnected",
  location: "Location unavailable",
  offline: "You are offline",
  generic: "Something went wrong",
};

const DEFAULT_DESCRIPTIONS: Record<ErrorStateKind, string> = {
  api: "The backend did not respond. Start the API and try again — cached data stays on screen until then.",
  socket: "The realtime feed dropped. Lucis will reconnect automatically.",
  location: "Allow location access to see risks and resources near you.",
  offline: "Check your network connection. Cached alerts and weather remain available.",
  generic: "An unexpected error occurred while loading this view.",
};

/** Friendly, actionable failure card. Never a raw stack trace. */
export function ErrorState({
  kind = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  className,
  ...props
}: ErrorStateProps) {
  const Icon = ERROR_ICON[kind];

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-danger/25 bg-danger-container px-5 py-4",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-danger/15 text-danger"
        >
          <Icon className="size-5" />
        </span>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {title ?? DEFAULT_TITLES[kind]}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description ?? DEFAULT_DESCRIPTIONS[kind]}
          </p>
        </div>
      </div>

      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-12">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
