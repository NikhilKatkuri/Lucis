import type { Coordinates } from "../../types/index.js";
import { activeAlerts } from "../alerts/alerts.service.js";
import { nearbyReports, nearbyRisk, safeZone } from "../geo/geo.service.js";
import { nearbyResources } from "../resources/resources.service.js";
import { state } from "../state.js";
import { nearestWeather } from "../weather/weather.service.js";

export function buildContext(coordinates: Coordinates, radiusKm = 10) { return { generatedAt: new Date(), coordinates, risk: nearbyRisk(coordinates, radiusKm), alerts: activeAlerts(), weather: nearestWeather(coordinates), reports: nearbyReports(coordinates, radiusKm), resources: nearbyResources(coordinates, radiusKm), safeZone: safeZone(coordinates), simulation: state.simulation }; }
