import { DeviceModel } from "../../database/models.js";
import type { DeviceLocation } from "../../types/index.js";
import { distanceMeters, point } from "../../utils/geo.js";
import { logger } from "../../utils/logger.js";
import { state, type DeviceRecord } from "../state.js";

export interface RegisterInput { deviceId: string; language: string; appVersion?: string; socketId?: string; }
export interface LocationInput extends DeviceLocation { deviceId: string; battery?: number; }

export function registerDevice(input: RegisterInput): DeviceRecord {
  const existing = state.devices.get(input.deviceId);
  const device: DeviceRecord = { ...existing, deviceId: input.deviceId, language: input.language, appVersion: input.appVersion, socketId: input.socketId ?? existing?.socketId, notificationEnabled: existing?.notificationEnabled ?? true, lastSeen: new Date(), movementState: existing?.movementState ?? "stationary" };
  state.devices.set(input.deviceId, device);
  void DeviceModel.updateOne({ deviceId: input.deviceId }, { $set: { ...device, location: device.location ? point(device.location.latitude, device.location.longitude) : undefined } }, { upsert: true }).catch(() => undefined);
  return device;
}

export function updateLocation(input: LocationInput): { device: DeviceRecord; meaningful: boolean; distance: number } {
  const device = state.devices.get(input.deviceId) ?? registerDevice({ deviceId: input.deviceId, language: "en" });
  const previous = device.location;
  const timestamp = new Date(input.timestamp);
  const distance = previous ? distanceMeters(previous, input) : 0;
  const timeDelta = previous ? timestamp.getTime() - previous.timestamp.getTime() : Number.POSITIVE_INFINITY;
  const meaningful = !previous || (distance >= 30 && timeDelta >= 15_000);
  device.lastSeen = new Date();
  device.battery = input.battery;
  if (meaningful) {
    device.location = { latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy, speed: input.speed, heading: input.heading, timestamp };
    device.movementState = (input.speed ?? 0) > 1 || distance > 100 ? "moving" : "stationary";
    void DeviceModel.updateOne({ deviceId: input.deviceId }, { $set: { location: point(input.latitude, input.longitude), lastSeen: device.lastSeen, battery: input.battery, movementState: device.movementState } }, { upsert: true }).catch((error) => logger.debug({ err: error }, "Could not persist device location"));
  }
  return { device, meaningful, distance };
}

export function setPreferences(deviceId: string, preferences: { notificationEnabled?: boolean; language?: string }): DeviceRecord {
  const device = state.devices.get(deviceId) ?? registerDevice({ deviceId, language: preferences.language ?? "en" });
  Object.assign(device, preferences);
  void DeviceModel.updateOne({ deviceId }, { $set: preferences }, { upsert: true }).catch(() => undefined);
  return device;
}
