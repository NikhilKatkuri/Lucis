import type { Coordinates } from "../../types/index.js";
import { distanceMeters, pointCoordinates } from "../../utils/geo.js";
import { state } from "../state.js";
import { nearbyResources } from "../resources/resources.service.js";

export function nearbyRisk(coordinates: Coordinates, radiusKm: number) { return [...state.risks.values()].filter((risk) => distanceMeters(coordinates, pointCoordinates(risk.center)) <= radiusKm * 1_000); }
export function nearbyReports(coordinates: Coordinates, radiusKm: number) { return state.reports.filter((report) => distanceMeters(coordinates, pointCoordinates(report.location)) <= radiusKm * 1_000); }
export function safeZone(coordinates: Coordinates) { return nearbyResources(coordinates, 25, "SHELTER")[0] ?? nearbyResources(coordinates, 25, "HOSPITAL")[0]; }
