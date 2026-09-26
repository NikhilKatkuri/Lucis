import type { Coordinates, GeoPoint } from "../types/index.js";

export const point = (latitude: number, longitude: number): GeoPoint => ({ type: "Point", coordinates: [longitude, latitude] });

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const radians = (value: number) => value * Math.PI / 180;
  const earth = 6_371_000;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function pointCoordinates(value: GeoPoint): Coordinates {
  return { latitude: value.coordinates[1], longitude: value.coordinates[0] };
}
