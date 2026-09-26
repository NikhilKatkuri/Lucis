import { api, toQuery } from "@/services/api.client";
import type { Coordinates, RiskZone } from "@/types/api";

export const riskService = {
  /** Every risk zone the server currently models. */
  live: () => api.get<RiskZone[]>("/api/risk/live"),

  /** Alias of `live`. */
  zones: () => api.get<RiskZone[]>("/api/risk/zones"),

  /** Risk zones within `radiusKm` of the given point. */
  nearby: (coordinates: Coordinates, radiusKm: number) =>
    api.get<RiskZone[]>(
      `/api/geo/nearby-risk${toQuery({ ...coordinates, radiusKm })}`,
    ),
};
