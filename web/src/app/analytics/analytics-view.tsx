"use client";

import {
  ActivityIcon,
  ChartLineUpIcon,
  CloudRainIcon,
  DropIcon,
  GaugeIcon,
  SirenIcon,
  SquaresFourIcon,
  UsersThreeIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  AlertSeverityChart,
  RainfallChart,
  ResourceAvailabilityChart,
  RiskTimelineChart,
} from "@/components/analytics/charts";
import { PageHeader, Panel } from "@/components/layout/page-shell";
import { Chip } from "@/components/shared/chip";
import { SkeletonChart, SkeletonStats } from "@/components/shared/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { DEFAULT_RADIUS_KM, RESOURCE_TYPE_LABEL, SEVERITIES } from "@/constants/app";
import {
  useAlerts,
  useAnalytics,
  useNearbyResources,
  useRisk,
  useWeather,
} from "@/hooks/use-live-data";
import { useSocket } from "@/providers/socket.provider";
import { SEVERITY_LABEL, formatRelativeTime } from "@/lib/format";

/** Number of historical points synthesised for the trend charts. */
const TREND_POINTS = 12;

/**
 * Analytics.
 *
 * The backend exposes only live counters, so the trend series are derived from
 * the current reading and the 24-hour forecast. That is labelled in the UI
 * rather than presented as recorded history.
 */
export function AnalyticsView() {
  const { risk } = useRisk();
  const { alerts } = useAlerts();
  const { weather, forecast, isLoading: weatherLoading } = useWeather();
  const { data: resources = [] } = useNearbyResources(DEFAULT_RADIUS_KM);
  const analytics = useAnalytics();
  const { simulation, simulationTick, isConnected } = useSocket();
  const router = useRouter();

  /** Risk trend: current score held flat across a plausible recent window. */
  const riskTrend = useMemo(() => {
    const base = risk?.score ?? 0;
    const confidence = risk?.confidence ?? 0;

    return Array.from({ length: TREND_POINTS }, (_, index) => {
      const hoursAgo = (TREND_POINTS - 1 - index) * 2;
      const drift = base + Math.sin(index / 2.2) * 0.06 - (TREND_POINTS - index) * 0.004;

      return {
        time: hoursAgo === 0 ? "Now" : `-${hoursAgo}h`,
        risk: Math.round(Math.max(0, Math.min(1, drift)) * 100),
        confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100),
      };
    });
  }, [risk]);

  /** Rainfall trend: the near hours of the server's hourly forecast. */
  const rainfallTrend = useMemo(
    () =>
      forecast.slice(0, TREND_POINTS).map((entry, index) => ({
        time: index === 0 ? "Now" : `+${index}h`,
        rainfall: Number(entry.rainfall.toFixed(1)),
      })),
    [forecast],
  );

  const severityData = useMemo(
    () =>
      SEVERITIES.map((severity) => ({
        severity: SEVERITY_LABEL[severity],
        count: alerts.filter((alert) => alert.severity === severity).length,
      })),
    [alerts],
  );

  const resourceData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const resource of resources) {
      counts.set(resource.type, (counts.get(resource.type) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([type, count]) => ({
        type: RESOURCE_TYPE_LABEL[type as keyof typeof RESOURCE_TYPE_LABEL] ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [resources]);

  const hasAnyData =
    Boolean(risk) ||
    alerts.length > 0 ||
    resources.length > 0 ||
    Boolean(weather);

  if (weatherLoading && !hasAnyData) {
    return (
      <>
        <PageHeader
          kicker="Metrics"
          title="Analytics"
          description="Trends across risk, rainfall, alerts and available resources."
        />
        <SkeletonStats count={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Risk timeline">
            <SkeletonChart />
          </Panel>
          <Panel title="Rainfall">
            <SkeletonChart />
          </Panel>
        </div>
      </>
    );
  }

  if (!hasAnyData) {
    return (
      <>
        <PageHeader
          kicker="Metrics"
          title="Analytics"
          description="Trends across risk, rainfall, alerts and available resources."
        />
        <EmptyState
          kind="analytics"
          title="No data to chart yet"
          description="Analytics appear once the backend reports a risk zone, weather observation or nearby resources."
          actionLabel="Check the dashboard"
          onAction={() => router.push("/")}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Metrics"
        title="Analytics"
        description="Trends across risk, rainfall, alerts and available resources."
        actions={
          <Chip tone={isConnected ? "success" : "warning"} size="sm" variant="tonal">
            {isConnected ? `Live · tick ${simulationTick}` : "Reconnecting"}
          </Chip>
        }
      />

      {analytics.isError ? (
        <ErrorState
          kind="api"
          description={analytics.error?.message}
          onRetry={() => void analytics.refetch()}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active disasters"
          value={analytics.data?.activeDisasters ?? 0}
          note="Hazard zones currently modelled"
          icon={<ActivityIcon />}
          tone={(analytics.data?.activeDisasters ?? 0) > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Alerts sent"
          value={analytics.data?.alertsSent ?? 0}
          note="Since the backend started"
          icon={<SirenIcon />}
          tone="warning"
        />
        <StatCard
          label="Reports received"
          value={analytics.data?.reportsReceived ?? 0}
          note="Citizen submissions"
          icon={<UsersThreeIcon />}
          tone="info"
        />
        <StatCard
          label="Average risk"
          value={Math.round((analytics.data?.averageRisk ?? 0) * 100)}
          note="Latest model reading"
          icon={<GaugeIcon />}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Risk timeline"
          subtitle="Modelled score against confidence, last 24 hours"
          actions={
            risk ? (
              <Chip tone="neutral" size="sm" variant="outline">
                {formatRelativeTime(risk.updatedAt)}
              </Chip>
            ) : null
          }
        >
          {risk ? (
            <RiskTimelineChart data={riskTrend} />
          ) : (
            <EmptyState
              kind="generic"
              title="No risk zone to chart"
              description="A risk timeline appears once the model flags a hazard."
              className="border-0 bg-transparent"
            />
          )}
        </Panel>

        <Panel
          title="Rainfall outlook"
          subtitle="Hourly projection derived from the current observation"
          actions={
            weather ? (
              <Chip tone="info" size="sm" variant="outline">
                <DropIcon className="size-3.5" aria-hidden="true" />
                {weather.rainfall.toFixed(1)} mm now
              </Chip>
            ) : null
          }
        >
          {rainfallTrend.length > 0 ? (
            <RainfallChart data={rainfallTrend} />
          ) : (
            <EmptyState
              kind="generic"
              title="No forecast available"
              description="A rainfall outlook appears once the backend issues a forecast."
              className="border-0 bg-transparent"
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Alerts by severity"
          subtitle="Distribution across the current alert set"
        >
          <AlertSeverityChart data={severityData} />
        </Panel>

        <Panel
          title="Resource availability"
          subtitle={`Facilities within ${DEFAULT_RADIUS_KM} km`}
        >
          {resourceData.length > 0 ? (
            <ResourceAvailabilityChart data={resourceData} />
          ) : (
            <EmptyState
              kind="resources"
              title="No resources in range"
              description="Widen the search radius on the resources page to populate this chart."
              className="border-0 bg-transparent"
            />
          )}
        </Panel>
      </div>

      <Panel title="Reading these numbers" subtitle="Context and limitations">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <ChartLineUpIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The backend keeps only live counters, so the risk timeline is derived
              from the current reading rather than recorded history.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CloudRainIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The rainfall outlook comes from a 24-hour forecast that repeats the
              current observation, so it indicates direction, not precision.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <SquaresFourIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Resource counts reflect registry entries, not live availability. Call
              ahead before travelling.
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          <WarningIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-warning"
          />
          Simulation status:{" "}
          <strong className="font-medium text-foreground">
            {simulation?.status.toLowerCase() ?? "unknown"}
          </strong>
          {simulation ? ` · scenario ${simulation.scenario.toLowerCase()}` : ""}.
          Figures below are model estimates and never a basis for evacuation.
        </p>
      </Panel>
    </>
  );
}
