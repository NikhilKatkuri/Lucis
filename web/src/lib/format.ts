import type { GeoPoint, Severity } from "@/types/api";

const EARTH_RADIUS_M = 6_371_008.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Unpack a GeoJSON point into natural `{ latitude, longitude }` order. */
export function fromGeoPoint(point: GeoPoint): LatLng {
  const [longitude, latitude] = point.coordinates;
  return { latitude, longitude };
}

export function toGeoPoint({ latitude, longitude }: LatLng): GeoPoint {
  return { type: "Point", coordinates: [longitude, latitude] };
}

/** Great-circle distance in kilometres. */
export function distanceKm(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a))) / 1000;
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatRadius(metres: number): string {
  return formatDistance(metres / 1000);
}

export function formatCoordinate(value: number, axis: "lat" | "lng"): string {
  const hemisphere =
    axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(2)}°${hemisphere}`;
}

export function formatLocation({ latitude, longitude }: LatLng): string {
  return `${formatCoordinate(latitude, "lat")}, ${formatCoordinate(longitude, "lng")}`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Absolute timestamp, e.g. `26 Sep, 14:32`. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatUtcTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toISOString().slice(11, 16)} UTC`;
}

/** Coarse relative time, e.g. `2m ago`, `3h ago`. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "—";

  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86_400)}d ago`;
}

/** Compact age used inside dense feeds, e.g. `2m`, `16m`, `3h`. */
export function formatAge(iso: string, now = Date.now()): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "—";

  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86_400)}d`;
}

export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°`;
}

export function formatRainfall(mm: number): string {
  return `${mm.toFixed(1)} mm`;
}

export function formatWind(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/** Minutes remaining until an alert expires; negative once expired. */
export function minutesUntil(iso: string, now = Date.now()): number {
  return Math.round((new Date(iso).getTime() - now) / 60_000);
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  // The backend calls this tier MODERATE; the UI presents it as "Medium".
  MODERATE: "Medium",
  LOW: "Safe",
};

/** Maps a backend severity onto the four-colour ramp used across the UI. */
export const SEVERITY_TONE: Record<
  Severity,
  "critical" | "high" | "medium" | "low"
> = {
  CRITICAL: "critical",
  HIGH: "high",
  MODERATE: "medium",
  LOW: "low",
};
