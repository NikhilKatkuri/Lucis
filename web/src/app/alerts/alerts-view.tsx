"use client";

import { AnimatePresence } from "framer-motion";
import {
  BellRingingIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CrosshairIcon,
  SirenIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AlertCard, AllClearCard } from "@/components/alerts/alert-card";
import { PageHeader, Panel } from "@/components/layout/page-shell";
import { FilterChips } from "@/components/shared/filter-chips";
import { Chip } from "@/components/shared/chip";
import { SearchBar } from "@/components/shared/search-bar";
import { SkeletonRows } from "@/components/shared/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM, SEVERITIES } from "@/constants/app";
import { useAlerts } from "@/hooks/use-live-data";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { alertsService } from "@/services/alerts.service";
import { queryKeys } from "@/lib/query-keys";
import {
  SEVERITY_LABEL,
  distanceKm,
  formatAge,
  minutesUntil,
} from "@/lib/format";
import {
  canUseBrowserNotifications,
  requestBrowserNotifications,
  showBrowserNotification,
} from "@/lib/browser-notifications";
import type { Severity } from "@/types/api";

type StatusFilter = "ACTIVE" | "RESOLVED" | "ALL";
type ProximityFilter = "ALL" | "NEARBY";

/** Live alert feed with severity, status, proximity and text filters. */
export function AlertsView() {
  const queryClient = useQueryClient();
  const { alerts, isLoading, isError, error, refetch } = useAlerts();
  const { coordinates } = useEffectiveCoordinates();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [proximityFilter, setProximityFilter] =
    useState<ProximityFilter>("ALL");
  const [query, setQuery] = useState("");

  const resolve = useMutation({
    mutationFn: (id: string) => alertsService.resolve(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
  });

  const testAlert = useMutation({
    mutationFn: alertsService.test,
    onSuccess: (alert) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      const description = `${SEVERITY_LABEL[alert.severity]} · simulated emergency notification`;
      const nativeShown = showBrowserNotification(alert.title, description, alert.id);
      toast.error(alert.title, {
        description,
        duration: 10_000,
        action: !nativeShown && canUseBrowserNotifications()
          ? { label: "Enable alerts", onClick: () => void requestBrowserNotifications() }
          : { label: "View alerts", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
      });
    },
  });

  /** Distance from the user, computed once per alert per position. */
  const distances = useMemo(() => {
    const map = new Map<string, number>();
    for (const alert of alerts) {
      map.set(
        alert.id,
        distanceKm(coordinates, {
          latitude: alert.center.coordinates[1],
          longitude: alert.center.coordinates[0],
        }),
      );
    }
    return map;
  }, [alerts, coordinates]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      const isExpired = alert.status === "EXPIRED";

      if (statusFilter === "ACTIVE" && isExpired) return false;
      if (statusFilter === "RESOLVED" && !isExpired) return false;

      if (severityFilter !== "ALL" && alert.severity !== severityFilter) {
        return false;
      }

      if (proximityFilter === "NEARBY") {
        const km = distances.get(alert.id);
        if (km === undefined || km > DEFAULT_RADIUS_KM) return false;
      }

      if (!needle) return true;
      return (
        alert.title.toLowerCase().includes(needle) ||
        alert.type.toLowerCase().includes(needle)
      );
    });
  }, [alerts, statusFilter, severityFilter, proximityFilter, query, distances]);

  const counts = useMemo(
    () => ({
      active: alerts.filter((a) => a.status !== "EXPIRED").length,
      resolved: alerts.filter((a) => a.status === "EXPIRED").length,
      nearby: alerts.filter((a) => (distances.get(a.id) ?? Infinity) <= DEFAULT_RADIUS_KM)
        .length,
      critical: alerts.filter((a) => a.severity === "CRITICAL").length,
    }),
    [alerts, distances],
  );

  const soonestExpiry = useMemo(() => {
    const pending = alerts
      .filter((a) => a.status !== "EXPIRED")
      .map((a) => minutesUntil(a.expiresAt))
      .filter((minutes) => minutes > 0);

    return pending.length > 0 ? Math.min(...pending) : null;
  }, [alerts]);

  return (
    <>
      <PageHeader
        kicker="Live feed"
        title="Alerts"
        description="Warnings raised by the risk model, ranked by severity and recency."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAlert.mutate()}
              disabled={testAlert.isPending}
            >
              <SirenIcon className="size-4" aria-hidden="true" />
              {testAlert.isPending ? "Broadcasting…" : "Broadcast test"}
            </Button>
            <Button variant="secondary" size="sm" onClick={refetch}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active alerts"
          value={counts.active.toString().padStart(2, "0")}
          note="Not yet expired"
          icon={<SirenIcon />}
          tone={counts.active > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Critical"
          value={counts.critical.toString().padStart(2, "0")}
          note="Highest severity tier"
          icon={<BellRingingIcon />}
          tone={counts.critical > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label={`Within ${DEFAULT_RADIUS_KM} km`}
          value={counts.nearby.toString().padStart(2, "0")}
          note="In your monitoring area"
          icon={<CrosshairIcon />}
          tone="primary"
        />
        <StatCard
          label="Next expiry"
          value={soonestExpiry === null ? "—" : `${soonestExpiry}m`}
          note="Until the earliest alert lapses"
          icon={<TimerIcon />}
          tone="warning"
        />
      </div>

      {isError ? (
        <ErrorState
          kind="api"
          description={error?.message}
          onRetry={refetch}
        />
      ) : null}

      <Panel
        title="Alert feed"
        subtitle={`${visible.length} of ${alerts.length} shown`}
      >
        <div className="flex flex-col gap-4">
          <SearchBar
            value={query}
            onValueChange={setQuery}
            label="Search alerts"
            placeholder="Search by title or type"
            containerClassName="max-w-md"
            hint={`${visible.length} shown`}
          />

          <div className="flex flex-col gap-3">
            <FilterChips<StatusFilter>
              label="Filter alerts by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ACTIVE", label: "Active", count: counts.active },
                { value: "RESOLVED", label: "Resolved", count: counts.resolved },
                { value: "ALL", label: "All", count: alerts.length },
              ]}
            />

            <FilterChips<Severity | "ALL">
              label="Filter alerts by severity"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={[
                { value: "ALL" as const, label: "Any severity" },
                ...SEVERITIES.map((severity) => ({
                  value: severity,
                  label: SEVERITY_LABEL[severity],
                  count: alerts.filter((a) => a.severity === severity).length,
                })),
              ]}
            />

            <FilterChips<ProximityFilter>
              label="Filter alerts by proximity"
              value={proximityFilter}
              onChange={setProximityFilter}
              options={[
                { value: "ALL", label: "Anywhere" },
                {
                  value: "NEARBY",
                  label: `Nearby (${DEFAULT_RADIUS_KM} km)`,
                  count: counts.nearby,
                },
              ]}
            />
          </div>

          {isLoading ? (
            <SkeletonRows rows={4} />
          ) : visible.length === 0 ? (
            alerts.length === 0 ? (
              <AllClearCard />
            ) : (
              <EmptyState
                kind="alerts"
                title="No alerts match these filters"
                description="Widen the status, severity or proximity filter to see more."
                actionLabel="Reset filters"
                onAction={() => {
                  setStatusFilter("ALL");
                  setSeverityFilter("ALL");
                  setProximityFilter("ALL");
                  setQuery("");
                }}
              />
            )
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {visible.map((alert) => (
                  <li key={alert.id}>
                    <AlertCard
                      alert={alert}
                      actions={
                        alert.status === "EXPIRED" ? (
                          <Chip tone="neutral" size="sm" variant="outline">
                            <CheckCircleIcon className="size-3.5" aria-hidden="true" />
                            Resolved
                          </Chip>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => resolve.mutate(alert.id)}
                            disabled={resolve.isPending}
                          >
                            Mark resolved
                          </Button>
                        )
                      }
                    />
                  </li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </Panel>

      {alerts.length > 0 ? (
        <Panel
          title="How to read an alert"
          subtitle="Estimates, not instructions"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Alerts are generated from modelled signals and community reports. They
            describe what the system believes is happening, not what has been
            confirmed on the ground. Each alert carries a confidence value and the
            evidence behind it — inspect the sources before acting, and follow the
            instructions of local emergency services.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ClockCountdownIcon className="size-4" aria-hidden="true" />
            Alerts expire automatically; the most recent refresh was{" "}
            {formatAge(
              alerts.reduce(
                (latest, alert) =>
                  new Date(alert.updatedAt).getTime() > new Date(latest).getTime()
                    ? alert.updatedAt
                    : latest,
                alerts[0].updatedAt,
              ),
            )}{" "}
            ago.
          </div>
        </Panel>
      ) : null}
    </>
  );
}
