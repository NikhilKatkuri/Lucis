"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CaretDownIcon,
  CloudRainIcon,
  CrosshairIcon,
  DropIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  BroadcastIcon,
  ShieldCheckIcon,
  SirenIcon,
  TimerIcon,
  WavesIcon,
  WindIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { SeverityChip } from "@/components/alerts/severity-chip";
import { Chip } from "@/components/shared/chip";
import { Meter } from "@/components/shared/meter";
import { Button } from "@/components/ui/button";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { EVIDENCE_SOURCE_LABEL } from "@/constants/app";
import {
  SEVERITY_LABEL,
  distanceKm,
  formatAge,
  formatRadius,
  formatRelativeTime,
} from "@/lib/format";
import type { Alert, RiskEvidence } from "@/types/api";
import { cn } from "@/lib/utils";

const EVIDENCE_ICON: Record<RiskEvidence["source"], React.ComponentType<{ className?: string }>> = {
  weather: CloudRainIcon,
  satellite: BroadcastIcon,
  sensor: WavesIcon,
  report: PaperPlaneTiltIcon,
};

export interface AlertCardProps {
  alert: Alert;
  /** Compact layout for sidebars and dense feeds. */
  compact?: boolean;
  /** Show the distance from the user's position. */
  showDistance?: boolean;
  className?: string;
  /** Expandable evidence section. On by default. */
  expandable?: boolean;
  /** Rendered in the card footer, e.g. a resolve action. */
  actions?: React.ReactNode;
}

/**
 * A single alert, colour-coded by severity.
 *
 * Always shows severity, confidence, distance, timestamp and evidence count.
 * The detail disclosure reveals the per-source evidence breakdown.
 */
export function AlertCard({
  alert,
  compact = false,
  showDistance = true,
  expandable = true,
  className,
  actions,
}: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const { coordinates } = useEffectiveCoordinates();

  const distance = useMemo(
    () => distanceKm(coordinates, {
      latitude: alert.center.coordinates[1],
      longitude: alert.center.coordinates[0],
    }),
    [coordinates, alert.center],
  );

  const accent = {
    CRITICAL: "bg-severity-critical",
    HIGH: "bg-severity-high",
    MODERATE: "bg-severity-medium",
    LOW: "bg-severity-low",
  }[alert.severity];

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-surface",
        "transition-shadow duration-200 ease-standard hover:shadow-elevation-2",
        className,
      )}
    >
      {/* Severity rail */}
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accent)} />

      <div className={cn("flex flex-col gap-3", compact ? "p-4 pl-5" : "p-5 pl-6")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityChip severity={alert.severity} />
              {alert.status === "UPDATED" ? (
                <Chip tone="info" size="sm" variant="outline">
                  Updated
                </Chip>
              ) : null}
              {alert.status === "EXPIRED" ? (
                <Chip tone="neutral" size="sm" variant="outline">
                  Resolved
                </Chip>
              ) : null}
            </div>

            <h3
              className={cn(
                "mt-2 font-semibold text-balance text-foreground",
                compact ? "text-sm" : "text-base",
              )}
            >
              {alert.title}
            </h3>
          </div>

          <SirenIcon
            aria-hidden="true"
            className={cn(
              "size-6 shrink-0",
              alert.severity === "CRITICAL"
                ? "text-severity-critical"
                : "text-muted-foreground",
            )}
            weight={alert.severity === "CRITICAL" ? "fill" : "regular"}
          />
        </div>

        {/* Metrics row */}
        <dl
          className={cn(
            "grid gap-3 text-xs",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          <div>
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="mt-1">
              <Meter
                value={alert.confidence}
                tone={
                  alert.severity === "CRITICAL"
                    ? "danger"
                    : alert.severity === "HIGH"
                      ? "warning"
                      : "primary"
                }
                label={`Confidence ${Math.round(alert.confidence * 100)} percent`}
              />
            </dd>
          </div>

          {showDistance ? (
            <div>
              <dt className="text-muted-foreground">Distance</dt>
              <dd className="mt-1 flex items-center gap-1 font-medium text-foreground tabular-nums">
                <CrosshairIcon className="size-3.5" aria-hidden="true" />
                {distance < 0.1 ? "At your position" : `${distance.toFixed(1)} km`}
              </dd>
            </div>
          ) : null}

          <div>
            <dt className="text-muted-foreground">Radius</dt>
            <dd className="mt-1 flex items-center gap-1 font-medium text-foreground tabular-nums">
              <MapPinIcon className="size-3.5" aria-hidden="true" />
              {formatRadius(alert.radius)}
            </dd>
          </div>

          <div>
            <dt className="text-muted-foreground">Evidence</dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {alert.evidence.length} source{alert.evidence.length === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TimerIcon className="size-3.5" aria-hidden="true" />
            <time dateTime={alert.createdAt} title={formatRelativeTime(alert.createdAt)}>
              Updated {formatAge(alert.updatedAt)} ago
            </time>
          </span>

          <div className="flex items-center gap-2">
            {actions}

            {expandable && alert.evidence.length > 0 ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsExpanded((value) => !value)}
                aria-expanded={isExpanded}
                aria-controls={`alert-evidence-${alert.id}`}
              >
                {isExpanded ? "Hide" : "Show"} evidence
                <CaretDownIcon
                  aria-hidden="true"
                  weight="bold"
                  className={cn(
                    "size-3 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </Button>
            ) : null}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && expandable ? (
            <motion.div
              id={`alert-evidence-${alert.id}`}
              key="evidence"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="overflow-hidden"
            >
              <ul className="flex flex-col divide-y divide-border border-t border-border">
                {alert.evidence.map((item) => {
                  const Icon = EVIDENCE_ICON[item.source];
                  return (
                    <li
                      key={`${alert.id}-${item.source}`}
                      className="flex items-start gap-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">
                          {EVIDENCE_SOURCE_LABEL[item.source]}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                        {item.score.toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

/** Condensed alert row used inside panels and sidebars. */
export function AlertRow({
  alert,
  className,
}: {
  alert: Alert;
  className?: string;
}) {
  const { coordinates } = useEffectiveCoordinates();

  const distance = distanceKm(coordinates, {
    latitude: alert.center.coordinates[1],
    longitude: alert.center.coordinates[0],
  });

  const dot = {
    CRITICAL: "bg-severity-critical",
    HIGH: "bg-severity-high",
    MODERATE: "bg-severity-medium",
    LOW: "bg-severity-low",
  }[alert.severity];

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-border py-3 last:border-b-0",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot)}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {SEVERITY_LABEL[alert.severity]} · {distance.toFixed(1)} km ·{" "}
          {alert.evidence.length} sources
        </p>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatAge(alert.updatedAt)}
      </span>
    </div>
  );
}

/** Prominent "you are clear" state used when nothing is active. */
export function AllClearCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border border-success/30 bg-success-container px-5 py-8 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-full bg-success/15 text-success"
      >
        <ShieldCheckIcon className="size-6" weight="fill" />
      </span>
      <p className="text-sm font-semibold text-foreground">No active alerts</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        Nothing is currently flagged within your monitoring area. This page keeps
        updating automatically.
      </p>
    </div>
  );
}

/** Small inline readout of rainfall/wind, reused by the weather card. */
export function WeatherInlineStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export { CloudRainIcon, DropIcon, WindIcon };
