"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import { DEFAULT_RADIUS_KM } from "@/constants/app";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { getDeviceId } from "@/lib/device-id";
import { queryKeys } from "@/lib/query-keys";
import { alertsService } from "@/services/alerts.service";
import { analyticsService } from "@/services/analytics.service";
import { deviceService } from "@/services/device.service";
import { reportsService } from "@/services/reports.service";
import { resourcesService } from "@/services/resources.service";
import { riskService } from "@/services/risk.service";
import { simulationService } from "@/services/simulation.service";
import { weatherService } from "@/services/weather.service";
import { SEVERITY_RANK } from "@/constants/app";
import type { Alert, ResourceType, SimulationState } from "@/types/api";

/* -------------------------------------------------------------------------- */
/* Alerts                                                                      */
/* -------------------------------------------------------------------------- */

export interface UseAlertsResult {
  alerts: Alert[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  activeCount: number;
}

/**
 * Active alerts from HTTP, overlaid with anything the socket has pushed.
 *
 * The backend has no `alert:new` event, so the socket only contributes changes
 * to alerts it has already seen; HTTP polling remains the source of truth for
 * discovery and fills the gap between events.
 */
export function useAlerts(): UseAlertsResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.alerts.live(),
    queryFn: alertsService.live,
    // Creation and severity changes arrive over the socket, which writes
    // straight into this cache key. Polling is still required for mutations the
    // backend does not broadcast: `PATCH /api/alerts/resolve/:id` and
    // `POST /api/simulation/reset` both change state silently.
    refetchInterval: 30_000,
  });

  const alerts = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) =>
          SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [query.data],
  );

  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
  }, [queryClient]);

  return {
    alerts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    activeCount: alerts.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Risk                                                                        */
/* -------------------------------------------------------------------------- */

export function useRisk() {
  const query = useQuery({
    queryKey: queryKeys.risk.live(),
    queryFn: riskService.live,
    // Safety net: the backend re-evaluates risk every 3s but only emits when
    // severity or confidence changes, so polling is what guarantees liveness
    // for a zone that has settled.
    refetchInterval: 30_000,
  });

  return {
    risk: query.data?.[0] ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/* -------------------------------------------------------------------------- */
/* Weather                                                                     */
/* -------------------------------------------------------------------------- */

export function useWeather() {
  const { coordinates } = useEffectiveCoordinates();

  const current = useQuery({
    queryKey: queryKeys.weather.current(coordinates.latitude, coordinates.longitude),
    queryFn: () => weatherService.current(coordinates),
    // The socket pushes every 60s and writes into this key, so polling is only
    // a fallback for when the socket is down.
    refetchInterval: 60_000,
  });

  const forecast = useQuery({
    queryKey: queryKeys.weather.forecast(coordinates.latitude, coordinates.longitude),
    queryFn: () => weatherService.forecast(coordinates),
    // Invalidated whenever a new observation arrives, since the projection is
    // derived from it.
    refetchInterval: 5 * 60_000,
  });

  return {
    weather: current.data ?? null,
    forecast: forecast.data ?? [],
    isLoading: current.isLoading,
    isError: current.isError,
    error: current.error,
  };
}

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

export function useResourceCategories() {
  return useQuery({
    queryKey: queryKeys.resources.categories(),
    queryFn: resourcesService.categories,
    staleTime: Infinity,
  });
}

export function useNearbyResources(
  radiusKm: number = DEFAULT_RADIUS_KM,
  type?: ResourceType,
) {
  const { coordinates } = useEffectiveCoordinates();

  return useQuery({
    queryKey: queryKeys.resources.nearby(
      coordinates.latitude,
      coordinates.longitude,
      radiusKm,
      type,
    ),
    queryFn: () => resourcesService.nearby(coordinates, radiusKm, type),
    refetchInterval: 60_000,
  });
}

export function useSafeZone() {
  const { coordinates } = useEffectiveCoordinates();

  return useQuery({
    queryKey: queryKeys.resources.safeZone(
      coordinates.latitude,
      coordinates.longitude,
    ),
    queryFn: () => resourcesService.safeZone(coordinates),
    refetchInterval: 5 * 60_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                     */
/* -------------------------------------------------------------------------- */

export interface UseReportsResult {
  reports: ReturnType<typeof reportsService.live> extends Promise<infer T>
    ? T
    : never;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  submit: (message: string) => Promise<void>;
  isSubmitting: boolean;
  submitError: Error | null;
}

/**
 * Live citizen reports.
 *
 * The backend exposes reports over HTTP only, so this polls. New reports are
 * inserted optimistically and rolled back if the request fails.
 */
export function useReports(radiusKm?: number): UseReportsResult {
  const queryClient = useQueryClient();
  const { coordinates } = useEffectiveCoordinates();

  const query = useQuery({
    queryKey: radiusKm
      ? queryKeys.reports.nearby(
          coordinates.latitude,
          coordinates.longitude,
          radiusKm,
        )
      : queryKeys.reports.live(),
    queryFn: () =>
      radiusKm
        ? reportsService.nearby(coordinates, radiusKm)
        : reportsService.live(),
    refetchInterval: 20_000,
  });

  const liveKey = queryKeys.reports.live();
  const nearbyKey = radiusKm
    ? queryKeys.reports.nearby(
        coordinates.latitude,
        coordinates.longitude,
        radiusKm,
      )
    : null;

  const mutation = useMutation({
    mutationFn: (message: string) => {
      const deviceId = getDeviceId();
      return reportsService.create({
        deviceId,
        location: coordinates,
        message,
      });
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: liveKey });
      if (nearbyKey) await queryClient.cancelQueries({ queryKey: nearbyKey });

      const deviceId = getDeviceId();
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        deviceId,
        location: {
          type: "Point" as const,
          coordinates: [coordinates.longitude, coordinates.latitude] as [number, number],
        },
        message,
        timestamp: new Date().toISOString(),
        trustScore: 0.5,
        verified: false,
      };

      const previousLive = queryClient.getQueryData(liveKey);
      const previousNearby = nearbyKey
        ? queryClient.getQueryData(nearbyKey)
        : undefined;

      queryClient.setQueryData(liveKey, (previous: unknown) =>
        Array.isArray(previous) ? [optimistic, ...previous] : [optimistic],
      );

      if (nearbyKey) {
        queryClient.setQueryData(nearbyKey, (previous: unknown) =>
          Array.isArray(previous) ? [optimistic, ...previous] : [optimistic],
        );
      }

      return { previousLive, previousNearby };
    },
    onError: (_error, _message, context) => {
      if (context?.previousLive) {
        queryClient.setQueryData(liveKey, context.previousLive);
      }
      if (context?.previousNearby && nearbyKey) {
        queryClient.setQueryData(nearbyKey, context.previousNearby);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });

  return {
    reports: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    submit: async (message: string) => {
      await mutation.mutateAsync(message);
    },
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
  };
}

/* -------------------------------------------------------------------------- */
/* Analytics & simulation                                                      */
/* -------------------------------------------------------------------------- */

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.live(),
    queryFn: analyticsService.live,
    refetchInterval: 30_000,
  });
}

export function useSimulationState() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.simulation.state(),
    queryFn: simulationService.state,
    // The socket pushes the state on connect and on every scenario change.
    refetchInterval: 60_000,
  });

  const state: SimulationState | null = query.data ?? null;

  const invalidateAfterReset = useCallback(async () => {
    // `reset` clears server-side risks and alerts without emitting any event,
    // so both caches must be dropped explicitly.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.risk.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.simulation.all }),
    ]);
  }, [queryClient]);

  const start = useMutation({
    mutationFn: (scenario: string) => simulationService.start({ scenario }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.simulation.all }),
  });

  const pause = useMutation({
    mutationFn: simulationService.pause,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.simulation.all }),
  });

  const resume = useMutation({
    mutationFn: simulationService.resume,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.simulation.all }),
  });

  const reset = useMutation({
    mutationFn: simulationService.reset,
    onSuccess: invalidateAfterReset,
  });

  return {
    state,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    start,
    pause,
    resume,
    reset,
  };
}

/* -------------------------------------------------------------------------- */
/* Device registration                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Registers this browser as a device so the backend can target it with
 * socket messages. Best-effort: the app stays usable if it fails.
 */
export function useDeviceRegistration() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    void deviceService
      .register({ deviceId: getDeviceId(), language: "en" })
      .then((device) => {
        if (cancelled) return;
        queryClient.setQueryData(["device", device.deviceId], device);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [queryClient]);
}
