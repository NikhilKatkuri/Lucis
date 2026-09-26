import { WeatherEventModel } from "../../database/models.js";
import type { Coordinates, WeatherSnapshot } from "../../types/index.js";
import { distanceMeters, point, pointCoordinates } from "../../utils/geo.js";
import { state } from "../state.js";

export function nearestWeather(coordinates: Coordinates): WeatherSnapshot | undefined {
  return [...state.weather].sort((a, b) => distanceMeters(coordinates, pointCoordinates(a.location)) - distanceMeters(coordinates, pointCoordinates(b.location)))[0];
}

export function forecastWeather(coordinates: Coordinates, hours = 24): WeatherSnapshot[] {
  const current = nearestWeather(coordinates);
  if (!current) return [];
  return Array.from({ length: Math.min(hours, 24) }, (_, index) => ({ ...current, temperature: current.temperature + Math.sin(index / 3), rainfall: Math.max(0, current.rainfall + Math.cos(index / 2) * 2), updatedAt: new Date(Date.now() + index * 3_600_000) }));
}

export function refreshWeather(): WeatherSnapshot[] {
  const current = state.weather[0];
  if (!current) return [];
  const updated = { ...current, rainfall: Math.max(0, current.rainfall + (Math.random() - 0.45) * 2), windSpeed: Math.max(0, current.windSpeed + (Math.random() - 0.5) * 2), updatedAt: new Date() };
  state.weather[0] = updated;
  state.analytics.weatherUpdates += 1;
  void WeatherEventModel.create({ ...updated }).catch(() => undefined);
  return [updated];
}
