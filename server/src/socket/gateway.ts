import type { Server } from "socket.io";
import { z } from "zod";
import { activeAlerts } from "../modules/alerts/alerts.service.js";
import { registerDevice, updateLocation } from "../modules/device/device.service.js";
import { nearbyRisk } from "../modules/geo/geo.service.js";
import { state } from "../modules/state.js";
import { ConnectionManager } from "./manager.js";

const deviceSchema = z.object({ deviceId: z.string().min(1).max(128), language: z.string().min(2).max(12), appVersion: z.string().max(64).optional() });
const locationSchema = z.object({ deviceId: z.string().min(1), latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), accuracy: z.number().nonnegative(), speed: z.number().nonnegative().optional(), heading: z.number().gte(0).lte(360).optional(), battery: z.number().gte(0).lte(100).optional(), timestamp: z.coerce.date() });

export function createLiveGateway(io: Server): void {
  const manager = new ConnectionManager(io);
  const live = io.of("/live");
  live.on("connection", (socket) => {
    state.analytics.websocketConnections += 1;
    let deviceId: string | undefined;
    socket.on("device:register", (payload: unknown, acknowledgement?: (response: unknown) => void) => {
      const input = deviceSchema.safeParse(payload);
      if (!input.success) { acknowledgement?.({ ok: false, error: input.error.flatten() }); return; }
      deviceId = input.data.deviceId;
      registerDevice({ ...input.data, socketId: socket.id });
      manager.logConnection(deviceId, socket.id);
      acknowledgement?.({ ok: true, deviceId, alerts: activeAlerts() });
    });
    socket.on("device:location", (payload: unknown, acknowledgement?: (response: unknown) => void) => {
      const input = locationSchema.safeParse(payload);
      if (!input.success) { acknowledgement?.({ ok: false, error: input.error.flatten() }); return; }
      const result = updateLocation(input.data);
      deviceId = input.data.deviceId;
      manager.joinLocationRooms(socket, input.data.latitude, input.data.longitude);
      const risk = nearbyRisk(input.data, 25);
      acknowledgement?.({ ok: true, meaningful: result.meaningful, distance: result.distance, risk, alerts: activeAlerts() });
      if (result.meaningful && risk.length === 0) manager.sendToDevice(input.data.deviceId, "safe", { message: "You are outside active monitored risk zones", timestamp: new Date() });
    });
    socket.on("device:heartbeat", (payload: unknown) => { if (typeof payload === "object" && payload !== null && "deviceId" in payload) { const device = state.devices.get(String(payload.deviceId)); if (device) device.lastSeen = new Date(); } });
    socket.on("disconnect", () => { state.analytics.websocketConnections = Math.max(0, state.analytics.websocketConnections - 1); });
    socket.emit("simulation", state.simulation);
  });

}
