import type { Hazard } from "../../types/index.js";
import { state } from "../state.js";

export interface IngestionEvent { source: "weather" | "satellite" | "sensor" | "report"; hazard?: Hazard; payload: Record<string, unknown>; timestamp: Date; }
export function ingest(event: IngestionEvent): IngestionEvent { state.simulation.updatedAt = new Date(); return event; }
