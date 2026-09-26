"use client";

import {
  AmbulanceIcon,
  BatteryChargingIcon,
  CrosshairIcon,
  DropIcon,
  FirstAidIcon,
  ForkKnifeIcon,
  MapPinIcon,
  PhoneIcon,
  PoliceCarIcon,
  SirenIcon,
  TentIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useMemo } from "react";

import { Chip } from "@/components/shared/chip";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { RESOURCE_TYPE_LABEL } from "@/constants/app";
import { distanceKm, formatDistance } from "@/lib/format";
import type { Resource, ResourceType } from "@/types/api";
import { cn } from "@/lib/utils";

/** Per-type iconography, used on cards and map markers. */
export const RESOURCE_ICON: Record<ResourceType, Icon> = {
  SHELTER: TentIcon,
  HOSPITAL: FirstAidIcon,
  FOOD: ForkKnifeIcon,
  WATER: DropIcon,
  CHARGING_STATION: BatteryChargingIcon,
  RESCUE_CENTER: SirenIcon,
  POLICE: PoliceCarIcon,
  AMBULANCE: AmbulanceIcon,
};

export interface ResourceCardProps {
  resource: Resource;
  /** Pre-computed distance; falls back to calculating from the user position. */
  distance?: number;
  onSelect?: (resource: Resource) => void;
  className?: string;
  /** Emphasise as the recommended safe destination. */
  highlight?: boolean;
}

/** A nearby emergency resource with its distance and availability. */
export function ResourceCard({
  resource,
  distance,
  onSelect,
  className,
  highlight = false,
}: ResourceCardProps) {
  const { coordinates } = useEffectiveCoordinates();
  const Icon = RESOURCE_ICON[resource.type] ?? MapPinIcon;

  const km = useMemo(
    () =>
      distance ??
      distanceKm(coordinates, {
        latitude: resource.location.coordinates[1],
        longitude: resource.location.coordinates[0],
      }),
    [distance, coordinates, resource.location],
  );

  const isInteractive = Boolean(onSelect);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border bg-surface p-4 transition-shadow duration-200 ease-standard",
        highlight
          ? "border-success/40 shadow-elevation-2"
          : "border-border hover:shadow-elevation-2",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          highlight
            ? "bg-success-container text-success-container-foreground"
            : "bg-primary-container text-primary-container-foreground",
        )}
      >
        <Icon className="size-5" weight="fill" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {resource.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {resource.address}
            </p>
          </div>

          <Chip
            tone={highlight ? "success" : "neutral"}
            size="sm"
            variant={highlight ? "tonal" : "outline"}
          >
            {RESOURCE_TYPE_LABEL[resource.type] ?? resource.type}
          </Chip>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground tabular-nums">
            <CrosshairIcon className="size-3.5" aria-hidden="true" />
            {formatDistance(km)}
          </span>

          {resource.capacity !== undefined ? (
            <span className="tabular-nums">{resource.capacity} places</span>
          ) : null}

          {resource.available !== undefined ? (
            <Chip
              tone={resource.available ? "success" : "warning"}
              size="sm"
              variant="tonal"
              className="h-5 px-1.5"
            >
              {resource.available ? "Available" : "Full"}
            </Chip>
          ) : null}

          {resource.phone ? (
            <a
              href={`tel:${resource.phone}`}
              className="flex items-center gap-1 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <PhoneIcon className="size-3.5" aria-hidden="true" />
              {resource.phone}
            </a>
          ) : null}
        </div>

        {isInteractive ? (
          <button
            type="button"
            onClick={() => onSelect?.(resource)}
            className="mt-3 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Show on map
            <span className="sr-only"> — {resource.name}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
