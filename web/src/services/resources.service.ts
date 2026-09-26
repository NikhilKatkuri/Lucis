import { api, toQuery } from "@/services/api.client";
import type { Coordinates, Resource, ResourceType } from "@/types/api";

export const resourcesService = {
  /** Static list of supported resource types. */
  categories: () => api.get<ResourceType[]>("/api/resources/categories"),

  /**
   * Resources within `radiusKm`, sorted by ascending distance.
   * An unrecognised `type` yields an empty array rather than an error.
   */
  nearby: (coordinates: Coordinates, radiusKm: number, type?: ResourceType) =>
    api.get<Resource[]>(
      `/api/resources/nearby${toQuery({ ...coordinates, radiusKm, type })}`,
    ),

  /**
   * Nearest shelter, else nearest hospital, within a hard-coded 25 km.
   * Resolves to `null` when neither exists.
   */
  safeZone: (coordinates: Coordinates) =>
    api.get<Resource | null>(`/api/geo/safe-zone${toQuery(coordinates)}`),
};
