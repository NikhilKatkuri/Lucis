"use client";

import { CheckCircleIcon, PaperPlaneTiltIcon, UserCircleIcon } from "@phosphor-icons/react";

import { Chip } from "@/components/shared/chip";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { distanceKm, formatAge, formatRelativeTime } from "@/lib/format";
import type { CommunityReport } from "@/types/api";
import { cn } from "@/lib/utils";

/** A citizen-submitted report. Newest first in every feed. */
export function CommunityReportCard({
  report,
  className,
}: {
  report: CommunityReport;
  className?: string;
}) {
  const { coordinates } = useEffectiveCoordinates();
  const isOptimistic = report.id.startsWith("optimistic-");

  const distance = distanceKm(coordinates, {
    latitude: report.location.coordinates[1],
    longitude: report.location.coordinates[0],
  });

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-card border border-border bg-surface p-4",
        isOptimistic && "opacity-70",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-info-container text-info-container-foreground"
      >
        <UserCircleIcon className="size-5" weight="fill" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {report.deviceId.slice(0, 18)}
          </p>

          <div className="flex items-center gap-1.5">
            {report.verified ? (
              <Chip tone="success" size="sm" variant="tonal" icon={<CheckCircleIcon className="size-3.5" />}>
                Verified
              </Chip>
            ) : (
              <Chip tone="warning" size="sm" variant="tonal">
                Unverified
              </Chip>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          {report.message}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span
            className="tabular-nums"
            title={formatRelativeTime(report.timestamp)}
          >
            {isOptimistic ? "Sending…" : `${formatAge(report.timestamp)} ago`}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{distance.toFixed(1)} km away</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            trust {report.trustScore.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Compact row used inside the dashboard activity feed. */
export function CommunityReportRow({
  report,
  className,
}: {
  report: CommunityReport;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-border py-3 last:border-b-0",
        report.id.startsWith("optimistic-") && "opacity-70",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-info-container text-info-container-foreground"
      >
        <PaperPlaneTiltIcon className="size-3.5" weight="fill" />
      </span>

      <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
        {report.message}
      </p>

      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {formatAge(report.timestamp)}
      </span>
    </div>
  );
}
