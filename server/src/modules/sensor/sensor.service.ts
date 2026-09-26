import { SensorEventModel } from "../../database/models.js";
import type { GeoPoint } from "../../types/index.js";

export interface SensorEvent { river: string; waterLevel: number; threshold: number; coordinates: GeoPoint; timestamp: Date; }
export async function latestSensorEvents(): Promise<SensorEvent[]> { const values = await SensorEventModel.find().sort({ timestamp: -1 }).limit(100).lean(); return values.map((value) => ({ river: value.river ?? "unknown", waterLevel: value.waterLevel ?? 0, threshold: value.threshold ?? 0, coordinates: value.coordinates as unknown as GeoPoint, timestamp: value.timestamp ?? new Date() })); }
