import { api, toQuery } from "@/services/api.client";
import type { Coordinates, WeatherSnapshot } from "@/types/api";

export const weatherService = {
  /**
   * Nearest observation to the given point. The server ignores `radiusKm` and
   * returns the globally nearest snapshot, or `null` when it holds none.
   */
  current: (coordinates: Coordinates) =>
    api.get<WeatherSnapshot | null>(
      `/api/weather/current${toQuery(coordinates)}`,
    ),

  /**
   * Always 24 hourly entries derived from the current snapshot, with
   * `updatedAt` one hour apart going forward.
   */
  forecast: (coordinates: Coordinates) =>
    api.get<WeatherSnapshot[]>(
      `/api/weather/forecast${toQuery(coordinates)}`,
    ),
};
