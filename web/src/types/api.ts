/**
 * Domain types mirroring the Lucis backend wire contract.
 *
 * Every field the server models as `Date` arrives as an ISO-8601 string, and
 * every `GeoPoint.coordinates` tuple is GeoJSON-ordered `[longitude, latitude]`
 * — the reverse of the `{ latitude, longitude }` shape the client sends.
 */

export type IsoDateString = string;

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type Hazard =
  | "FLOOD"
  | "FLASH_FLOOD"
  | "HEAVY_RAIN"
  | "WILDFIRE"
  | "CYCLONE"
  | "HEATWAVE";

export type AlertStatus = "ACTIVE" | "UPDATED" | "SAFE" | "EXPIRED";

export type ResourceType =
  | "SHELTER"
  | "HOSPITAL"
  | "FOOD"
  | "WATER"
  | "CHARGING_STATION"
  | "RESCUE_CENTER"
  | "POLICE"
  | "AMBULANCE";

export type SimulationStatus = "IDLE" | "RUNNING" | "PAUSED";

/** Natural coordinate order — what the client sends and what geocoding returns. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** GeoJSON point. `coordinates` is `[longitude, latitude]`. */
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export type EvidenceSource = "weather" | "satellite" | "sensor" | "report";

export interface RiskEvidence {
  source: EvidenceSource;
  /** 0..1 */
  score: number;
  summary: string;
}

export interface RiskZone {
  id: string;
  center: GeoPoint;
  /** Metres. */
  radius: number;
  /** Declared by the server but never populated — treat as absent. */
  polygon?: GeoPolygon;
  hazard: Hazard;
  /** 0..1 */
  score: number;
  severity: Severity;
  /** 0..1 */
  confidence: number;
  evidence: RiskEvidence[];
  updatedAt: IsoDateString;
}

export interface Alert {
  id: string;
  title: string;
  /** Free-form `${HAZARD}_WARNING`; test alerts use `WEATHER_WATCH`. */
  type: string;
  status: AlertStatus;
  severity: Severity;
  confidence: number;
  center: GeoPoint;
  /** Metres. */
  radius: number;
  evidence: RiskEvidence[];
  expiresAt: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface WeatherSnapshot {
  location: GeoPoint;
  /** °C */
  temperature: number;
  /** % */
  humidity: number;
  /** mm over the last hour */
  rainfall: number;
  /** km/h */
  windSpeed: number;
  condition: string;
  updatedAt: IsoDateString;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: GeoPoint;
  address: string;
  capacity?: number;
  available?: boolean;
  phone?: string;
}

export interface CommunityReport {
  id: string;
  deviceId: string;
  location: GeoPoint;
  message: string;
  timestamp: IsoDateString;
  /** 0..1 — always 0.5 on creation. */
  trustScore: number;
  verified: boolean;
}

export interface AnalyticsSnapshot {
  activeDisasters: number;
  affectedDevices: number;
  alertsSent: number;
  averageRisk: number;
  averageLatency: number;
  reportsReceived: number;
  weatherUpdates: number;
  websocketConnections: number;
  updatedAt: IsoDateString;
}

export interface SimulationState {
  status: SimulationStatus;
  /** Not validated server-side — treat unknown values as generic. */
  scenario: string;
  tick: number;
  updatedAt: IsoDateString;
}

export interface SimulationTickEvent {
  scenario: string;
  eventType: "TICK";
  payload: { tick: number };
  timestamp: IsoDateString;
}

export type SimulationEvent = SimulationState | SimulationTickEvent;

export interface SafePayload {
  message: string;
  timestamp: IsoDateString;
}

export interface BootstrapResponse {
  weather?: WeatherSnapshot;
  alerts: Alert[];
  resources: Resource[];
  risk: RiskZone[];
}

export interface AiContextResponse {
  generatedAt: IsoDateString;
  coordinates: Coordinates;
  risk: RiskZone[];
  alerts: Alert[];
  weather?: WeatherSnapshot;
  reports: CommunityReport[];
  resources: Resource[];
  safeZone?: Resource;
  simulation: SimulationState;
}

export interface AiChatResponse {
  provider: string;
  /** Plain prose, not JSON. */
  content: string;
}

export interface AiProviderInfo {
  name: string;
  priority: number;
  status: "configured" | "unconfigured" | "healthy" | "unavailable";
}

export interface DeviceRecord {
  deviceId: string;
  socketId?: string;
  language: string;
  appVersion?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
    timestamp: IsoDateString;
  };
  notificationEnabled: boolean;
  lastSeen: IsoDateString;
  battery?: number;
  movementState: "moving" | "stationary";
}

export interface HealthResponse {
  ok: true;
  service: "lucis-api";
  time: IsoDateString;
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

export interface CreateReportRequest {
  deviceId: string;
  location: Coordinates;
  message: string;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  language?: string;
  appVersion?: string;
}

export interface UpdateLocationResponse {
  device: DeviceRecord;
  meaningful: boolean;
  /** Metres from the previous accepted fix. */
  distance: number;
}

export interface SetPreferencesRequest {
  deviceId: string;
  notificationEnabled?: boolean;
  language?: string;
}

export interface AiChatRequest {
  message: string;
  location?: Coordinates;
  radiusKm?: number;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export interface ValidationErrorResponse {
  error: "Validation failed";
  details: {
    formErrors: string[];
    /** Keys are only ever `"query"` or `"body"`. */
    fieldErrors: Record<string, string[]>;
  };
}

export interface ApiErrorResponse {
  error: string;
}

export function isValidationError(
  body: unknown,
): body is ValidationErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { error?: unknown }).error === "Validation failed"
  );
}
