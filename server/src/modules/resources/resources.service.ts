import type { Coordinates, Resource, ResourceType } from "../../types/index.js";
import { distanceMeters, pointCoordinates } from "../../utils/geo.js";
import { state } from "../state.js";

export function nearbyResources(coordinates: Coordinates, radiusKm = 10, type?: ResourceType): Resource[] {
  return state.resources.filter((resource) => (!type || resource.type === type) && distanceMeters(coordinates, pointCoordinates(resource.location)) <= radiusKm * 1_000).sort((a, b) => distanceMeters(coordinates, pointCoordinates(a.location)) - distanceMeters(coordinates, pointCoordinates(b.location)));
}
export const resourceCategories = (): ResourceType[] => ["SHELTER", "HOSPITAL", "FOOD", "WATER", "CHARGING_STATION", "RESCUE_CENTER", "POLICE", "AMBULANCE"];
