"use client";

import {
  CrosshairSimpleIcon,
  DropIcon,
  FirstAidIcon,
  RulerIcon,
  SquaresFourIcon,
  TentIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { PageHeader, Panel } from "@/components/layout/page-shell";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { LazyDisasterMap } from "@/components/map/lazy-disaster-map";
import { StatCard } from "@/components/shared/stat-card";
import { Chip } from "@/components/shared/chip";
import { ErrorState } from "@/components/shared/states";
import { ResourceCard } from "@/components/resources/resource-card";
import {
  DEFAULT_RADIUS_KM,
  FALLBACK_COORDINATES,
  RESOURCE_TYPE_LABEL,
} from "@/constants/app";
import { useAlerts, useNearbyResources, useRisk, useWeather } from "@/hooks/use-live-data";
import { useUserLocation } from "@/hooks/use-user-location";
import { formatLocation, formatRadius, formatRelativeTime } from "@/lib/format";
import { HAZARD_LABEL } from "@/constants/app";
import type { Resource } from "@/types/api";

/**
 * Fullscreen hazard map.
 *
 * The canvas fills the available viewport height; a detail sheet surfaces the
 * selected resource on small screens, while a side panel does the same from
 * `lg` upwards.
 */
export function MapView() {
  const [selected, setSelected] = useState<Resource | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { risk } = useRisk();
  const { alerts } = useAlerts();
  const { weather } = useWeather();
  const {
    data: resources = [],
    isError,
    error,
    refetch,
  } = useNearbyResources(DEFAULT_RADIUS_KM);
  const {
    coordinates: detectedPosition,
    isUsingFallback,
    requestPermission,
    status,
  } = useUserLocation();
  const coordinates = detectedPosition ?? FALLBACK_COORDINATES;

  const counts = useMemo(() => {
    const byType = new Map<string, number>();
    for (const resource of resources) {
      byType.set(resource.type, (byType.get(resource.type) ?? 0) + 1);
    }
    return byType;
  }, [resources]);

  const handleSelect = (resource: Resource) => {
    setSelected(resource);
    setSheetOpen(true);
  };

  return (
    <>
      <PageHeader
        kicker="Live situation"
        title="Live map"
        description="Your position, the active danger radius and nearby emergency resources."
        actions={
          <Chip tone={risk ? "danger" : "success"} size="sm" variant="tonal">
            {risk ? HAZARD_LABEL[risk.hazard] ?? risk.hazard : "No active hazard"}
          </Chip>
        }
      />

      {isError ? (
        <ErrorState kind="api" description={error?.message} onRetry={refetch} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Danger radius"
          value={risk ? formatRadius(risk.radius) : "—"}
          note={risk ? `Updated ${formatRelativeTime(risk.updatedAt)}` : "No active zone"}
          icon={<RulerIcon />}
          tone={risk ? "danger" : "success"}
        />
        <StatCard
          label="Resources in range"
          value={String(resources.length).padStart(2, "0")}
          note={`Within ${DEFAULT_RADIUS_KM} km`}
          icon={<SquaresFourIcon />}
          tone="primary"
        />
        <StatCard
          label="Shelters"
          value={String(counts.get("SHELTER") ?? 0).padStart(2, "0")}
          note="Designated refuge points"
          icon={<TentIcon />}
          tone="success"
        />
        <StatCard
          label="Hospitals"
          value={String(counts.get("HOSPITAL") ?? 0).padStart(2, "0")}
          note="Medical facilities"
          icon={<FirstAidIcon />}
          tone="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Hazard map"
          subtitle={formatLocation(coordinates)}
          actions={
            isUsingFallback ? (
              <button
                type="button"
                onClick={requestPermission}
                disabled={status === "locating"}
                className="flex items-center gap-1.5 rounded-full border border-outline px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CrosshairSimpleIcon className="size-3.5" weight="bold" aria-hidden="true" />
                {status === "locating" ? "Locating…" : "Use my location"}
              </button>
            ) : null
          }
          bodyClassName="p-0"
        >
          <LazyDisasterMap
            variant="full"
            className="h-[58dvh] min-h-[380px] w-full lg:h-[calc(100dvh-22rem)] lg:min-h-[520px]"
            risk={risk}
            resources={resources}
            alerts={alerts}
            weather={weather}
            onResourceSelect={handleSelect}
          />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel
            title="Nearby resources"
            subtitle={`Sorted by distance, ${DEFAULT_RADIUS_KM} km radius`}
            className="lg:max-h-[70dvh] lg:overflow-hidden"
            bodyClassName="scrollbar-slim lg:max-h-[calc(70dvh-4rem)] lg:overflow-y-auto"
          >
            {resources.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No resources were found within range.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {resources.map((resource) => (
                  <li key={resource.id}>
                    <ResourceCard
                      resource={resource}
                      onSelect={handleSelect}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Legend" subtitle="What the map is showing">
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full bg-severity-critical"
                />
                <span className="text-muted-foreground">
                  <strong className="font-medium text-foreground">Risk zone</strong> —
                  modelled hazard extent from the active risk assessment.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full bg-severity-high"
                />
                <span className="text-muted-foreground">
                  <strong className="font-medium text-foreground">Flood extent</strong>{" "}
                  — estimated inundation boundary. Not an evacuation boundary.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full bg-success"
                />
                <span className="text-muted-foreground">
                  <strong className="font-medium text-foreground">Shelter</strong> —
                  designated refuge with{" "}
                  {counts.get("SHELTER") ?? 0} in range.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 size-3 shrink-0 rounded-full bg-info"
                />
                <span className="text-muted-foreground">
                  <strong className="font-medium text-foreground">Hospital</strong> —
                  medical facility with {counts.get("HOSPITAL") ?? 0} in range.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 grid size-3 shrink-0 place-items-center rounded-full bg-primary"
                />
                <span className="text-muted-foreground">
                  <strong className="font-medium text-foreground">You</strong> — your
                  reported position.
                </span>
              </li>
            </ul>

            {weather ? (
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <DropIcon className="size-4" aria-hidden="true" />
                Rainfall {weather.rainfall.toFixed(1)} mm ·{" "}
                {RESOURCE_TYPE_LABEL.SHELTER} layer visible
              </div>
            ) : null}
          </Panel>
        </div>
      </div>

      {/* Mobile detail sheet — the desktop panel is not reachable at this size. */}
      {sheetOpen && selected ? (
        <BottomSheet
          onOpenChange={setSheetOpen}
          title={selected.name}
          description={RESOURCE_TYPE_LABEL[selected.type] ?? selected.type}
        >
          <ResourceCard resource={selected} highlight />
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <WarningIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Availability is reported by the facility and may be out of date. Call
            ahead where possible.
          </p>
        </BottomSheet>
      ) : null}
    </>
  );
}
