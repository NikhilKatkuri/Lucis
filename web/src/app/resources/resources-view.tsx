"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BuildingsIcon,
  FirstAidIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SirenIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { PageHeader, Panel } from "@/components/layout/page-shell";
import { FilterChips } from "@/components/shared/filter-chips";
import { SearchBar } from "@/components/shared/search-bar";
import { SkeletonRows } from "@/components/shared/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/shared/chip";
import {
  RESOURCE_ICON,
  ResourceCard,
} from "@/components/resources/resource-card";
import { DEFAULT_RADIUS_KM, RESOURCE_TYPES, RESOURCE_TYPE_LABEL } from "@/constants/app";
import {
  useNearbyResources,
  useResourceCategories,
  useSafeZone,
} from "@/hooks/use-live-data";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { distanceKm, formatDistance, formatLocation } from "@/lib/format";
import type { ResourceType } from "@/types/api";

type TypeFilter = ResourceType | "ALL";
type RadiusFilter = "5" | "10" | "25" | "50";
type SortKey = "distance" | "name" | "type";

const RADIUS_OPTIONS: readonly { value: RadiusFilter; km: number }[] = [
  { value: "5", km: 5 },
  { value: "10", km: 10 },
  { value: "25", km: 25 },
  { value: "50", km: 50 },
];

/** Nearby emergency resources, filtered and sorted by distance. */
export function ResourcesView() {
  const { coordinates } = useEffectiveCoordinates();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [radius, setRadius] = useState<RadiusFilter>(
    RADIUS_OPTIONS.find((option) => option.km === DEFAULT_RADIUS_KM)?.value ?? "10",
  );
  const radiusKm = Number(radius);
  const [sortKey, setSortKey] = useState<SortKey>("distance");
  const [query, setQuery] = useState("");

  const { data: categories } = useResourceCategories();
  const { data: resources = [], isLoading, isError, error, refetch } =
    useNearbyResources(radiusKm, typeFilter === "ALL" ? undefined : typeFilter);
  const safeZone = useSafeZone();

  /** The server already sorts by distance, so distance is always available. */
  const withDistance = useMemo(
    () =>
      resources.map((resource) => ({
        resource,
        distance: distanceKm(coordinates, {
          latitude: resource.location.coordinates[1],
          longitude: resource.location.coordinates[0],
        }),
      })),
    [resources, coordinates],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = needle
      ? withDistance.filter(
          ({ resource }) =>
            resource.name.toLowerCase().includes(needle) ||
            resource.address.toLowerCase().includes(needle),
        )
      : withDistance;

    const sorted = [...filtered];
    if (sortKey === "name") {
      sorted.sort((a, b) => a.resource.name.localeCompare(b.resource.name));
    } else if (sortKey === "type") {
      sorted.sort((a, b) => a.resource.type.localeCompare(b.resource.type));
    }

    return sorted;
  }, [withDistance, query, sortKey]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { resource } of withDistance) {
      counts.set(resource.type, (counts.get(resource.type) ?? 0) + 1);
    }
    return counts;
  }, [withDistance]);

  const nearest = withDistance[0];
  const availableTypes = categories ?? [...RESOURCE_TYPES];

  return (
    <>
      <PageHeader
        kicker="Nearby"
        title="Emergency resources"
        description="Shelters, hospitals and essential services, closest first."
        actions={
          <Chip tone="neutral" size="sm" variant="outline">
            <MapPinIcon className="size-3.5" aria-hidden="true" />
            {formatLocation(coordinates)}
          </Chip>
        }
      />

      {isError ? (
        <ErrorState kind="api" description={error?.message} onRetry={refetch} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="In range"
          value={String(withDistance.length).padStart(2, "0")}
          note={`Within ${radiusKm} km`}
          icon={<BuildingsIcon />}
          tone="primary"
        />
        <StatCard
          label="Nearest"
          value={nearest ? formatDistance(nearest.distance) : "—"}
          note={nearest ? nearest.resource.name : "Nothing found"}
          icon={<MapPinIcon />}
          tone="info"
        />
        <StatCard
          label="Shelters"
          value={String(typeCounts.get("SHELTER") ?? 0).padStart(2, "0")}
          note="Designated refuge points"
          icon={<ShieldCheckIcon />}
          tone="success"
        />
        <StatCard
          label="Medical"
          value={String(typeCounts.get("HOSPITAL") ?? 0).padStart(2, "0")}
          note="Hospitals and rescue centres"
          icon={<FirstAidIcon />}
          tone="danger"
        />
      </div>

      {safeZone.data ? (
        <Panel
          title="Recommended safe destination"
          subtitle="Nearest shelter or hospital according to the backend"
          actions={
            <Chip tone="success" size="sm" variant="tonal">
              <ShieldCheckIcon className="size-3.5" aria-hidden="true" />
              Safe zone
            </Chip>
          }
        >
          <ResourceCard resource={safeZone.data} highlight />
        </Panel>
      ) : null}

      <Panel
        title="All resources"
        subtitle={`${visible.length} shown · ${sortKey === "distance" ? "closest first" : `sorted by ${sortKey}`}`}
      >
        <div className="flex flex-col gap-4">
          <SearchBar
            value={query}
            onValueChange={setQuery}
            label="Search resources"
            placeholder="Search by name or address"
            containerClassName="max-w-md"
          />

          <FilterChips<TypeFilter>
            label="Filter resources by type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "ALL", label: "All types", count: withDistance.length },
              ...availableTypes
                .filter((type) => (typeCounts.get(type) ?? 0) > 0)
                .map((type) => ({
                  value: type,
                  label: RESOURCE_TYPE_LABEL[type] ?? type,
                  count: typeCounts.get(type) ?? 0,
                  icon: (() => {
                    const Icon = RESOURCE_ICON[type];
                    return Icon ? <Icon className="size-3.5" /> : undefined;
                  })(),
                })),
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips<RadiusFilter>
              label="Search radius"
              value={radius}
              onChange={setRadius}
              size="sm"
              options={RADIUS_OPTIONS.map((option) => ({
                value: option.value,
                label: `${option.km} km`,
              }))}
            />

            <div
              role="group"
              aria-label="Sort resources"
              className="flex items-center gap-1"
            >
              <span className="text-xs text-muted-foreground">Sort</span>
              {(
                [
                  { value: "distance" as const, label: "Distance", icon: ArrowDownIcon },
                  { value: "name" as const, label: "Name", icon: ArrowUpIcon },
                  { value: "type" as const, label: "Type", icon: SirenIcon },
                ] satisfies { value: SortKey; label: string; icon: typeof ArrowDownIcon }[]
              ).map((option) => {
                const Icon = option.icon;
                const isActive = sortKey === option.value;

                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "secondary" : "ghost"}
                    size="xs"
                    onClick={() => setSortKey(option.value)}
                    aria-pressed={isActive}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <SkeletonRows rows={5} />
          ) : visible.length === 0 ? (
            <EmptyState
              kind="resources"
              title="No resources in range"
              description={`Nothing was found within ${radiusKm} km. Try a wider radius or clear the type filter.`}
              actionLabel="Widen to 50 km"
              onAction={() => setRadius("50")}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {visible.map(({ resource, distance }) => (
                <li key={resource.id}>
                  <ResourceCard
                    resource={resource}
                    distance={distance}
                    highlight={safeZone.data?.id === resource.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel title="Before you travel" subtitle="Practical cautions">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-container text-warning-container-foreground"
          >
            <WarningIcon className="size-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Availability and access status are reported by each facility and may be
            out of date. Roads near an active risk zone may be impassable, and
            remote sensing cannot establish whether a route is safe. Confirm with
            local responders before travelling, and avoid entering a hazard zone to
            reach a facility.
          </p>
        </div>
      </Panel>
    </>
  );
}
