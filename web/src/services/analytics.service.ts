import { api } from "@/services/api.client";
import type { AnalyticsSnapshot } from "@/types/api";

export const analyticsService = {
  /**
   * Live counters. `updatedAt` is fixed at server boot and never refreshed, so
   * do not present it as a sync heartbeat. `affectedDevices` and
   * `averageLatency` are always 0 in the current backend.
   */
  live: () => api.get<AnalyticsSnapshot>("/api/analytics/live"),
};
