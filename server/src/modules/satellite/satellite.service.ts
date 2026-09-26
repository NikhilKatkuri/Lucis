import { SatelliteEventModel } from "../../database/models.js";
import type { GeoPolygon } from "../../types/index.js";

export interface SatelliteDetection { affectedArea: GeoPolygon; confidence: number; timestamp: Date; }
export async function latestSatelliteLayer(): Promise<SatelliteDetection | null> { const value = await SatelliteEventModel.findOne().sort({ timestamp: -1 }).lean(); return value ? { affectedArea: value.affectedArea as unknown as GeoPolygon, confidence: value.confidence ?? 0, timestamp: value.timestamp ?? new Date() } : null; }
export async function affectedZones(): Promise<SatelliteDetection[]> { const values = await SatelliteEventModel.find().sort({ timestamp: -1 }).limit(100).lean(); return values.map((value) => ({ affectedArea: value.affectedArea as unknown as GeoPolygon, confidence: value.confidence ?? 0, timestamp: value.timestamp ?? new Date() })); }
