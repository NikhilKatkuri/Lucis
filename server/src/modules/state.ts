import { randomUUID } from "node:crypto";
import type { Alert, AnalyticsSnapshot, CommunityReport, DeviceLocation, Resource, RiskZone, WeatherSnapshot } from "../types/index.js";
import { point } from "../utils/geo.js";

export interface DeviceRecord {
  deviceId: string; socketId?: string; language: string; appVersion?: string; location?: DeviceLocation;
  notificationEnabled: boolean; lastSeen: Date; battery?: number; movementState: "moving" | "stationary";
}

export const state = {
  devices: new Map<string, DeviceRecord>(),
  alerts: new Map<string, Alert>(),
  risks: new Map<string, RiskZone>(),
  reports: [] as CommunityReport[],
  resources: [] as Resource[],
  weather: [] as WeatherSnapshot[],
  simulation: { status: "IDLE" as "IDLE" | "RUNNING" | "PAUSED", scenario: "FLOOD", tick: 0, updatedAt: new Date() },
  analytics: { activeDisasters: 0, affectedDevices: 0, alertsSent: 0, averageRisk: 0, averageLatency: 0, reportsReceived: 0, weatherUpdates: 0, websocketConnections: 0, updatedAt: new Date() } satisfies AnalyticsSnapshot
};

export function ensureDemoData(): void {
  if (state.resources.length > 0) return;
  const entries: Array<[string, Resource["type"], number, number, string]> = [
    ["Hyderabad Emergency Shelter", "SHELTER", 17.385, 78.4867, "Tank Bund Road"],
    ["Gandhi Hospital", "HOSPITAL", 17.373, 78.478, "Musheerabad"],
    ["Secunderabad Water Point", "WATER", 17.4399, 78.4983, "Clock Tower"],
    ["Nampally Rescue Center", "RESCUE_CENTER", 17.393, 78.466, "Nampally"],
    ["Madhapur Charging Station", "CHARGING_STATION", 17.4486, 78.3908, "HITEC City"],
    ["Charminar Community Kitchen", "FOOD", 17.3616, 78.4747, "Charminar"],
    ["Lakdikapul Police Help Desk", "POLICE", 17.401, 78.465, "Lakdikapul"],
    ["Jubilee Hills Ambulance Point", "AMBULANCE", 17.4239, 78.407, "Jubilee Hills"]
  ];
  state.resources = entries.map(([name, type, latitude, longitude, address]) => ({ id: randomUUID(), name, type, location: point(latitude, longitude), address, available: true }));
  state.weather = [{ location: point(17.385, 78.4867), temperature: 28, humidity: 78, rainfall: 8.2, windSpeed: 14, condition: "Heavy rain", updatedAt: new Date() }];
}
