import { api, toQuery } from "@/services/api.client";
import type {
  BootstrapResponse,
  Coordinates,
  DeviceRecord,
  RegisterDeviceRequest,
  SetPreferencesRequest,
  UpdateLocationResponse,
} from "@/types/api";

export interface DeviceLocationRequest {
  deviceId: string;
  latitude: number;
  longitude: number;
  /** Metres. */
  accuracy: number;
  speed?: number;
  heading?: number;
  battery?: number;
  timestamp: string;
}

export const deviceService = {
  /**
   * Registers or refreshes a device. Idempotent: existing location, battery and
   * notification preferences are preserved.
   */
  register: (body: RegisterDeviceRequest) =>
    api.post<DeviceRecord>("/api/device/register", body),

  /**
   * Pushes a position fix. The server only stores it when the device has moved
   * at least 30 m *and* at least 15 s have passed, so `meaningful` is often
   * false for high-frequency updates.
   */
  updateLocation: (body: DeviceLocationRequest) =>
    api.patch<UpdateLocationResponse>("/api/device/location", body),

  setPreferences: (body: SetPreferencesRequest) =>
    api.patch<DeviceRecord>("/api/device/preferences", body),

  /**
   * One-shot bundle of weather, alerts, resources and risk.
   *
   * Note: the server accepts `radiusKm` and `type` here but ignores both — it
   * always uses a 10 km resource radius and a 25 km risk radius.
   */
  bootstrap: (coordinates: Coordinates, radiusKm?: number) =>
    api.get<BootstrapResponse>(
      `/api/device/bootstrap${toQuery({ ...coordinates, radiusKm })}`,
    ),
};
