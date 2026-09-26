import type { Server, Socket } from "socket.io";
import { state } from "../modules/state.js";
import { logger } from "../utils/logger.js";

export class ConnectionManager {
  constructor(private readonly io: Server) {}

  broadcast(event: string, payload: unknown): void { this.io.of("/live").emit(event, payload); }
  sendToDevice(deviceId: string, event: string, payload: unknown): void {
    const device = state.devices.get(deviceId);
    if (device?.socketId) this.io.of("/live").to(device.socketId).emit(event, payload);
  }
  joinLocationRooms(socket: Socket, latitude: number, longitude: number): void {
    const lat = latitude.toFixed(1); const lon = longitude.toFixed(1);
    void socket.join([`geo:${lat}:${lon}`, "all-devices"]);
  }
  connections(): number { return this.io.of("/live").sockets.size; }
  logConnection(deviceId: string, socketId: string): void { logger.debug({ deviceId, socketId }, "Live socket connected"); }
}
