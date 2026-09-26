import type { Coordinates } from "../../types/index.js";
import { activeAlerts } from "../alerts/alerts.service.js";
import { nearbyRisk } from "../geo/geo.service.js";
import { nearbyResources } from "../resources/resources.service.js";
import { nearestWeather } from "../weather/weather.service.js";

export function bootstrap(coordinates: Coordinates) { return { weather: nearestWeather(coordinates), alerts: activeAlerts(), resources: nearbyResources(coordinates), risk: nearbyRisk(coordinates, 25) }; }
