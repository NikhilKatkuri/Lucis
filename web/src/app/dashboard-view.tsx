"use client";

import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRightIcon,
  BroadcastIcon,
  ChartLineUpIcon,
  CrosshairIcon,
  MapTrifoldIcon,
  NavigationArrowIcon,
  ShieldCheckIcon,
  SirenIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { AlertCard, AllClearCard } from "@/components/alerts/alert-card";
import {
  IncidentTimeline,
  useIncidentTimeline,
} from "@/components/alerts/incident-timeline";
import { PageHeader, Panel } from "@/components/layout/page-shell";
import { LazyDisasterMap } from "@/components/map/lazy-disaster-map";
import { ResourceCard } from "@/components/resources/resource-card";
import { CommunityReportRow } from "@/components/reports/community-report-card";
import { FilterChips } from "@/components/shared/filter-chips";
import { Chip } from "@/components/shared/chip";
import { SearchBar } from "@/components/shared/search-bar";
import { SkeletonRows } from "@/components/shared/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ForecastStrip, WeatherCard } from "@/components/weather/weather-card";
import { RiskIndicator } from "@/components/weather/risk-indicator";
import { Button } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM, FALLBACK_COORDINATES, SEVERITIES } from "@/constants/app";
import {
  useAlerts,
  useAnalytics,
  useNearbyResources,
  useReports,
  useRisk,
  useSafeZone,
  useWeather,
} from "@/hooks/use-live-data";
import { useUserLocation } from "@/hooks/use-user-location";
import { useSocket } from "@/providers/socket.provider";
import { SEVERITY_LABEL, formatLocation, formatUtcTime } from "@/lib/format";
import type { Severity } from "@/types/api";

type SeverityFilter = Severity | "ALL";

/**
 * Live dashboard body. Composes the read-only "situation" surface: location,
 * the most severe alert, weather, risk score, quick actions, recent alerts and
 * the activity feed.
 */
export function DashboardView() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [query, setQuery] = useState("");

  const {
    alerts,
    isLoading: alertsLoading,
    isError: alertsFailed,
    error: alertsError,
    refetch,
  } = useAlerts();
  const { risk, isLoading: riskLoading } = useRisk();
  const { weather, forecast, isLoading: weatherLoading } = useWeather();
  const { data: resources = [] } = useNearbyResources(DEFAULT_RADIUS_KM);
  const safeZone = useSafeZone();
  const { reports } = useReports();
  const analytics = useAnalytics();
  const { status, simulation } = useSocket();
  const {
    coordinates: detectedPosition,
    isUsingFallback,
    status: locationStatus,
    requestPermission,
  } = useUserLocation();
  const coordinates = detectedPosition ?? FALLBACK_COORDINATES;

  const topAlert = alerts[0] ?? null;

  const filteredAlerts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      if (severityFilter !== "ALL" && alert.severity !== severityFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        alert.title.toLowerCase().includes(needle) ||
        alert.type.toLowerCase().includes(needle)
      );
    });
  }, [alerts, severityFilter, query]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: alerts.length };
    for (const severity of SEVERITIES) {
      counts[severity] = alerts.filter((a) => a.severity === severity).length;
    }
    return counts;
  }, [alerts]);

  const timeline = useIncidentTimeline({
    alerts: alerts.slice(0, 6),
    reports: reports.slice(0, 6),
    weatherUpdatedAt: weather?.updatedAt ?? null,
  });

  const nearbyShelters = useMemo(
    () =>
      resources
        .filter((resource) => resource.type === "SHELTER")
        .slice(0, 2),
    [resources],
  );

  return (
    <>
      <PageHeader
        kicker="Regional operations"
        title="Situation overview"
        description="A clear picture of what is changing, and where a closer look matters."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">
                <ChartLineUpIcon className="size-4" aria-hidden="true" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/map">
                <MapTrifoldIcon className="size-4" aria-hidden="true" />
                Open live map
              </Link>
            </Button>
          </>
        }
      />

      {/* Current location strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-container text-primary-container-foreground"
          >
            <NavigationArrowIcon
              className="size-4"
              weight={isUsingFallback ? "regular" : "fill"}
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {isUsingFallback ? "Monitoring the default regional centre" : "Your current location"}
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {formatLocation(coordinates)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isUsingFallback ? (
            <Chip tone="warning" size="sm" variant="tonal">
              {locationStatus === "denied" ? "Permission denied" : "Approximate"}
            </Chip>
          ) : null}
          {isUsingFallback ? (
            <Button variant="ghost" size="xs" onClick={requestPermission}>
              Use my location
            </Button>
          ) : null}
          <Chip tone="neutral" size="sm" variant="outline">
            <CrosshairIcon className="size-3.5" aria-hidden="true" />
            {DEFAULT_RADIUS_KM} km radius
          </Chip>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active alerts"
          value={alertsLoading ? "—" : String(alerts.length).padStart(2, "0")}
          note={
            topAlert
              ? `Most severe: ${SEVERITY_LABEL[topAlert.severity]}`
              : "Nothing currently flagged"
          }
          icon={<SirenIcon />}
          tone={alerts.length > 0 ? "danger" : "success"}
        />

        <StatCard
          label="Risk score"
          value={risk ? Math.round(risk.score * 100) : "—"}
          note={risk ? `${risk.evidence.length} evidence inputs` : "No active risk zone"}
          icon={<ShieldCheckIcon />}
          tone={risk ? "warning" : "success"}
        />

        <StatCard
          label="Resources in range"
          value={String(resources.length).padStart(2, "0")}
          note={
            safeZone.data
              ? `Nearest safe zone: ${safeZone.data.name}`
              : "No shelter or hospital found"
          }
          icon={<SquaresFourIcon />}
          tone="primary"
        />

        <StatCard
          label="Community reports"
          value={reports.length.toString().padStart(2, "0")}
          note="Citizen submissions received"
          icon={<UsersThreeIcon />}
          tone="info"
        />
      </div>

      {/* Alerts error surface */}
      {alertsFailed ? (
        <ErrorState
          kind="api"
          description={
            alertsError?.message ??
            "The alert service did not respond. Retrying automatically."
          }
          onRetry={refetch}
        />
      ) : null}

      {/* Primary workspace: map + situation summary */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Impact and evidence map"
          subtitle="Live hazard extent, resources and your position"
          actions={
            <Button variant="ghost" size="xs" asChild>
              <Link href="/map">
                Expand
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <LazyDisasterMap
            variant="panel"
            risk={risk}
            resources={resources}
            alerts={alerts}
            weather={weather}
          />
        </Panel>

        <div className="flex flex-col gap-4">
          {/* Most severe alert */}
          <Panel
            title="Active disaster alert"
            subtitle={
              topAlert
                ? `Updated ${formatUtcTime(topAlert.updatedAt)}`
                : "No alerts in your area"
            }
          >
            {topAlert ? (
              <AlertCard alert={topAlert} showDistance={false} />
            ) : (
              <AllClearCard />
            )}
          </Panel>

          <WeatherCard weather={weather} isLoading={weatherLoading} />
        </div>
      </div>

      {/* Risk + forecast */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <RiskIndicator risk={risk} isLoading={riskLoading} />

        <Panel
          title="Forecast"
          subtitle="Next 6 hours, derived from the current observation"
        >
          {forecast.length > 0 ? (
            <ForecastStrip forecast={forecast} hours={6} />
          ) : weatherLoading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              kind="generic"
              title="No forecast available"
              description="The backend has not produced a forecast for your area yet."
              className="border-0 bg-transparent py-6"
            />
          )}
        </Panel>
      </div>

      {/* Alerts list + activity */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Recent alerts"
          subtitle="Ranked by severity, then recency"
          actions={
            <Button variant="ghost" size="xs" asChild>
              <Link href="/alerts">
                View all
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <SearchBar
              value={query}
              onValueChange={setQuery}
              label="Search alerts"
              placeholder="Search alerts"
              containerClassName="max-w-sm"
            />

            <FilterChips<SeverityFilter>
              label="Filter alerts by severity"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={[
                { value: "ALL", label: "All", count: severityCounts.ALL },
                ...SEVERITIES.map((severity) => ({
                  value: severity as SeverityFilter,
                  label: SEVERITY_LABEL[severity],
                  count: severityCounts[severity] ?? 0,
                })),
              ]}
            />

            {alertsLoading ? (
              <SkeletonRows rows={3} />
            ) : filteredAlerts.length === 0 ? (
              <EmptyState
                kind="alerts"
                title={alerts.length === 0 ? "No active alerts" : "No matching alerts"}
                description={
                  alerts.length === 0
                    ? "Nothing is currently flagged in your monitoring area. This page updates automatically."
                    : "Try a different severity or clear the search term."
                }
                actionLabel={alerts.length > 0 ? "Clear filters" : undefined}
                onAction={
                  alerts.length > 0
                    ? () => {
                        setQuery("");
                        setSeverityFilter("ALL");
                      }
                    : undefined
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {filteredAlerts.slice(0, 4).map((alert) => (
                    <li key={alert.id}>
                      <AlertCard alert={alert} />
                    </li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel
            title="Live activity"
            subtitle="Incoming across your region"
            actions={
              <Chip tone={status === "connected" ? "success" : "warning"} size="sm" variant="tonal">
                {status === "connected" ? "Live" : "Paused"}
              </Chip>
            }
          >
            {reports.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No community activity yet.
              </p>
            ) : (
              <ul>
                {reports.slice(0, 5).map((report) => (
                  <li key={report.id}>
                    <CommunityReportRow report={report} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Incident timeline"
            subtitle="A changing picture, not a definitive record"
          >
            <IncidentTimeline
              events={timeline.slice(0, 6)}
              emptyMessage="No events recorded in the current window."
            />
          </Panel>
        </div>
      </div>

      {/* Quick actions + nearby shelters */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/resources">
                <SquaresFourIcon className="size-4" aria-hidden="true" />
                Find a shelter
              </Link>
            </Button>
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/reports">
                <UsersThreeIcon className="size-4" aria-hidden="true" />
                Report an incident
              </Link>
            </Button>
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/map">
                <MapTrifoldIcon className="size-4" aria-hidden="true" />
                View hazard map
              </Link>
            </Button>
            <Button variant="secondary" className="justify-start" asChild>
              <Link href="/settings">
                <BroadcastIcon className="size-4" aria-hidden="true" />
                Simulation controls
              </Link>
            </Button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
            <div>
              <dt className="text-muted-foreground">Weather updates</dt>
              <dd className="mt-1 font-medium text-foreground tabular-nums">
                {analytics.data?.weatherUpdates ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Live connections</dt>
              <dd className="mt-1 font-medium text-foreground tabular-nums">
                {analytics.data?.websocketConnections ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Alerts sent</dt>
              <dd className="mt-1 font-medium text-foreground tabular-nums">
                {analytics.data?.alertsSent ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Simulation</dt>
              <dd className="mt-1 font-medium text-foreground">
                {simulation?.status.toLowerCase() ?? "—"}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel
          title="Nearby shelters"
          subtitle={`Within ${DEFAULT_RADIUS_KM} km of your position`}
          actions={
            <Button variant="ghost" size="xs" asChild>
              <Link href="/resources">
                All resources
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          }
        >
          {nearbyShelters.length === 0 ? (
            <EmptyState
              kind="resources"
              title="No shelters in range"
              description="Widen the radius on the resources page to search further afield."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {nearbyShelters.map((resource) => (
                <li key={resource.id}>
                  <ResourceCard
                    resource={resource}
                    highlight={safeZone.data?.id === resource.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
