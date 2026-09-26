import type { Hazard, ResourceType } from "@/types/api";

/**
 * Centralised TanStack Query keys. Keeping them in one place makes
 * invalidation predictable when socket events mutate server state.
 */
export const queryKeys = {
  bootstrap: (lat: number, lng: number) =>
    ["bootstrap", Number(lat.toFixed(3)), Number(lng.toFixed(3))] as const,

  alerts: {
    all: ["alerts"] as const,
    live: () => [...queryKeys.alerts.all, "live"] as const,
    history: () => [...queryKeys.alerts.all, "history"] as const,
  },

  risk: {
    all: ["risk"] as const,
    live: () => [...queryKeys.risk.all, "live"] as const,
  },

  weather: {
    all: ["weather"] as const,
    current: (lat: number, lng: number) =>
      [...queryKeys.weather.all, "current", Number(lat.toFixed(2)), Number(lng.toFixed(2))] as const,
    forecast: (lat: number, lng: number) =>
      [...queryKeys.weather.all, "forecast", Number(lat.toFixed(2)), Number(lng.toFixed(2))] as const,
  },

  resources: {
    all: ["resources"] as const,
    categories: () => [...queryKeys.resources.all, "categories"] as const,
    nearby: (lat: number, lng: number, radiusKm: number, type?: ResourceType) =>
      [
        ...queryKeys.resources.all,
        "nearby",
        Number(lat.toFixed(2)),
        Number(lng.toFixed(2)),
        radiusKm,
        type ?? "all",
      ] as const,
    safeZone: (lat: number, lng: number) =>
      [...queryKeys.resources.all, "safe-zone", Number(lat.toFixed(2)), Number(lng.toFixed(2))] as const,
  },

  reports: {
    all: ["reports"] as const,
    live: () => [...queryKeys.reports.all, "live"] as const,
    nearby: (lat: number, lng: number, radiusKm: number) =>
      [...queryKeys.reports.all, "nearby", Number(lat.toFixed(2)), Number(lng.toFixed(2)), radiusKm] as const,
  },

  analytics: {
    all: ["analytics"] as const,
    live: () => [...queryKeys.analytics.all, "live"] as const,
  },

  ai: {
    all: ["ai"] as const,
    providers: () => [...queryKeys.ai.all, "providers"] as const,
    context: () => [...queryKeys.ai.all, "context"] as const,
  },

  simulation: {
    all: ["simulation"] as const,
    state: () => [...queryKeys.simulation.all, "state"] as const,
  },

  health: () => ["health"] as const,
} as const;

export type HazardScenario = Hazard;
