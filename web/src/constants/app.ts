import type { Hazard, ResourceType, Severity } from "@/types/api";

export const APP_NAME = "Lucis";
export const APP_TAGLINE = "Disaster Intelligence";

/**
 * Fallback coordinates (Hyderabad) used until the browser reports a position.
 * Mirrors the backend's own hard-coded centre in `alerts.service.ts`.
 */
export const FALLBACK_COORDINATES = {
  latitude: 17.385,
  longitude: 78.4867,
} as const;

export const DEFAULT_RADIUS_KM = 10;

/** `GET /api/geo/safe-zone` hard-codes 25 km regardless of the query param. */
export const SAFE_ZONE_RADIUS_KM = 25;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

/** The backend exposes a Socket.IO *namespace* at `/live` on the default path. */
export const SOCKET_URL = `${API_BASE_URL}/live`;
export const SOCKET_PATH = "/socket.io/";

export const HAZARDS: readonly Hazard[] = [
  "FLOOD",
  "FLASH_FLOOD",
  "HEAVY_RAIN",
  "WILDFIRE",
  "CYCLONE",
  "HEATWAVE",
] as const;

export const RESOURCE_TYPES: readonly ResourceType[] = [
  "SHELTER",
  "HOSPITAL",
  "FOOD",
  "WATER",
  "CHARGING_STATION",
  "RESCUE_CENTER",
  "POLICE",
  "AMBULANCE",
] as const;

/** Ordered most severe first — used for sorting and filter chips. */
export const SEVERITIES: readonly Severity[] = [
  "CRITICAL",
  "HIGH",
  "MODERATE",
  "LOW",
] as const;

export const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
};

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  SHELTER: "Shelter",
  HOSPITAL: "Hospital",
  FOOD: "Food centre",
  WATER: "Water point",
  CHARGING_STATION: "Charging station",
  RESCUE_CENTER: "Rescue centre",
  POLICE: "Police station",
  AMBULANCE: "Ambulance",
};

export const HAZARD_LABEL: Record<Hazard, string> = {
  FLOOD: "Flood",
  FLASH_FLOOD: "Flash flood",
  HEAVY_RAIN: "Heavy rain",
  WILDFIRE: "Wildfire",
  CYCLONE: "Cyclone",
  HEATWAVE: "Heatwave",
};

export const EVIDENCE_SOURCE_LABEL = {
  weather: "Weather",
  satellite: "Satellite",
  sensor: "Sensor",
  report: "Community",
} as const;

/** Socket namespaces/events mirrored from `server/src/socket/gateway.ts`. */
export const SOCKET_EVENTS = {
  risk: "risk",
  alert: "alert",
  weather: "weather",
  simulation: "simulation",
  safe: "safe",
  /** Forward-compatible aliases from the product spec — not emitted today. */
  alertNew: "alert:new",
  alertUpdate: "alert:update",
  alertResolved: "alert:resolved",
  weatherUpdate: "weather:update",
  riskUpdate: "risk:update",
  resourceUpdate: "resource:update",
  reportNew: "report:new",
  simulationEvent: "simulation:event",
} as const;
