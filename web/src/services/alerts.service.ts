import { api } from "@/services/api.client";
import type { Alert } from "@/types/api";

export const alertsService = {
  /** Alerts that have not expired. */
  live: () => api.get<Alert[]>("/api/alerts/live"),

  /** Every alert the server still holds, including expired ones. */
  history: () => api.get<Alert[]>("/api/alerts/history"),

  /** Broadcasts a synthetic test alert. Expires after 15 minutes. */
  test: () => api.post<Alert>("/api/alerts/test"),

  /** Marks an alert expired. */
  resolve: (id: string) => api.patch<Alert>(`/api/alerts/resolve/${id}`),
};
