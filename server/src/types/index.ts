import type { Server as HttpServer } from "node:http";

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Hazard = "FLOOD" | "FLASH_FLOOD" | "HEAVY_RAIN" | "WILDFIRE" | "CYCLONE" | "HEATWAVE";
export type AlertStatus = "ACTIVE" | "UPDATED" | "SAFE" | "EXPIRED";
export type ResourceType = "SHELTER" | "HOSPITAL" | "FOOD" | "WATER" | "CHARGING_STATION" | "RESCUE_CENTER" | "POLICE" | "AMBULANCE";

export interface Coordinates { latitude: number; longitude: number; }
export interface GeoPoint { type: "Point"; coordinates: [number, number]; }
export interface GeoPolygon { type: "Polygon"; coordinates: number[][][]; }
export interface DeviceLocation extends Coordinates { accuracy: number; speed?: number; heading?: number; timestamp: Date; }
export interface RiskEvidence { source: "weather" | "satellite" | "sensor" | "report"; score: number; summary: string; }
export interface RiskZone { id: string; center: GeoPoint; radius: number; polygon?: GeoPolygon; hazard: Hazard; score: number; severity: Severity; confidence: number; evidence: RiskEvidence[]; updatedAt: Date; }
export interface Alert { id: string; title: string; type: string; status: AlertStatus; severity: Severity; confidence: number; center: GeoPoint; radius: number; evidence: RiskEvidence[]; expiresAt: Date; createdAt: Date; updatedAt: Date; }
export interface WeatherSnapshot { location: GeoPoint; temperature: number; humidity: number; rainfall: number; windSpeed: number; condition: string; updatedAt: Date; }
export interface Resource { id: string; name: string; type: ResourceType; location: GeoPoint; address: string; capacity?: number; available?: boolean; phone?: string; }
export interface CommunityReport { id: string; deviceId: string; location: GeoPoint; message: string; timestamp: Date; trustScore: number; verified: boolean; }
export interface AnalyticsSnapshot { activeDisasters: number; affectedDevices: number; alertsSent: number; averageRisk: number; averageLatency: number; reportsReceived: number; weatherUpdates: number; websocketConnections: number; updatedAt: Date; }

export interface LiveServer {
  httpServer: HttpServer;
  io: import("socket.io").Server;
}
