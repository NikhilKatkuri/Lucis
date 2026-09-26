"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CrosshairIcon, MapPinIcon, ShieldWarningIcon } from "@phosphor-icons/react";
import { useMemo } from "react";

import { Chip } from "@/components/shared/chip";
import { Meter } from "@/components/shared/meter";
import { SeverityChip } from "@/components/alerts/severity-chip";
import { Skeleton } from "@/components/shared/skeleton";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { HAZARD_LABEL } from "@/constants/app";
import { distanceKm, formatRadius, formatRelativeTime } from "@/lib/format";
import type { RiskZone, Severity } from "@/types/api";
import { cn } from "@/lib/utils";

/** Maps a 0..1 risk score onto the same four-step ramp as alert severity. */
function severityForScore(score: number): Severity {
  if (score >= 0.8) return "CRITICAL";
  if (score >= 0.6) return "HIGH";
  if (score >= 0.35) return "MODERATE";
  return "LOW";
}

export interface RiskIndicatorProps {
  risk: RiskZone | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * Composite risk score with severity, hazard and distance.
 *
 * The numeric score animates on change so a rising risk level is noticeable
 * without relying on colour alone.
 */
export function RiskIndicator({ risk, isLoading, className }: RiskIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const { coordinates } = useEffectiveCoordinates();

  const distance = useMemo(() => {
    if (!risk) return null;
    return distanceKm(coordinates, {
      latitude: risk.center.coordinates[1],
      longitude: risk.center.coordinates[0],
    });
  }, [coordinates, risk]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-card border border-border bg-surface p-5",
          className,
        )}
      >
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!risk) {
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
          <ShieldWarningIcon className="size-6" />
        </span>
        <p className="text-sm font-semibold text-foreground">No active risk zone</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          The model is not currently flagging a hazard near your position.
        </p>
      </div>
    );
  }

  const severity = severityForScore(risk.score);
  const tone = {
    CRITICAL: "danger",
    HIGH: "warning",
    MODERATE: "primary",
    LOW: "success",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-card border border-border bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Composite risk score
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <motion.span
              key={risk.score.toFixed(2)}
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-4xl leading-none font-semibold tracking-tight text-foreground tabular-nums"
            >
              {Math.round(risk.score * 100)}
            </motion.span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>

        <SeverityChip severity={severity} />
      </div>

      <Meter
        value={risk.score}
        tone={tone[severity]}
        size="md"
        hideValue
        label={`Risk score ${Math.round(risk.score * 100)} of 100`}
      />

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Hazard</dt>
          <dd className="mt-1 font-medium text-foreground">
            {HAZARD_LABEL[risk.hazard] ?? risk.hazard.replaceAll("_", " ")}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Confidence</dt>
          <dd className="mt-1 font-medium text-foreground tabular-nums">
            {Math.round(risk.confidence * 100)}%
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Radius</dt>
          <dd className="mt-1 flex items-center gap-1 font-medium text-foreground tabular-nums">
            <MapPinIcon className="size-3.5" aria-hidden="true" />
            {formatRadius(risk.radius)}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Distance</dt>
          <dd className="mt-1 flex items-center gap-1 font-medium text-foreground tabular-nums">
            <CrosshairIcon className="size-3.5" aria-hidden="true" />
            {distance === null ? "—" : `${distance.toFixed(1)} km`}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Chip tone="neutral" size="sm" variant="outline">
          {risk.evidence.length} evidence inputs
        </Chip>
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeTime(risk.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/** Slim risk bar for page headers. */
export function RiskPill({ risk }: { risk: RiskZone | null }) {
  if (!risk) {
    return (
      <Chip tone="success" size="sm" variant="tonal">
        No active risk
      </Chip>
    );
  }

  const severity = severityForScore(risk.score);

  return (
    <Chip tone="neutral" size="sm" variant="outline">
      Risk {Math.round(risk.score * 100)}
      <SeverityChip severity={severity} size="sm" className="ml-1 h-5 px-1.5" />
    </Chip>
  );
}
