import type { Server } from "socket.io";
import { calculateRisk } from "../modules/risk/risk.service.js";
import { syncAlert } from "../modules/alerts/alerts.service.js";
import { refreshWeather } from "../modules/weather/weather.service.js";
import { tickSimulation } from "../modules/simulation/simulation.service.js";
import { state } from "../modules/state.js";
import { logger } from "../utils/logger.js";

export function startWorkers(io: Server): void {
  const riskSignatures = new Map<string, string>();
  const alertSignatures = new Map<string, string>();
  setInterval(() => { const event = tickSimulation(); if (event) io.of("/live").emit("simulation", event); }, 5_000).unref();
  setInterval(() => { const risks = calculateRisk(); for (const risk of risks) { const riskSignature = `${risk.severity}:${risk.confidence.toFixed(3)}`; if (riskSignatures.get(risk.id) !== riskSignature) { io.of("/live").emit("risk", risk); riskSignatures.set(risk.id, riskSignature); } const alert = syncAlert(risk); if (alert) { const alertSignature = `${alert.status}:${alert.severity}:${alert.confidence.toFixed(3)}`; if (alertSignatures.get(alert.id) !== alertSignature) { io.of("/live").emit("alert", alert); alertSignatures.set(alert.id, alertSignature); } } } }, 3_000).unref();
  setInterval(() => { for (const weather of refreshWeather()) io.of("/live").emit("weather", weather); }, 60_000).unref();
  setInterval(() => { for (const alert of state.alerts.values()) if (alert.expiresAt < new Date()) { alert.status = "EXPIRED"; io.of("/live").emit("alert", alert); } }, 300_000).unref();
  logger.info("Background workers started: simulation=5s risk=3s weather=60s cleanup=5m");
}
