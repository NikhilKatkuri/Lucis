import { randomUUID } from "node:crypto";
import { AlertModel } from "../../database/models.js";
import type { Alert, RiskZone } from "../../types/index.js";
import { state } from "../state.js";

export function syncAlert(risk: RiskZone): Alert | undefined {
  if (risk.severity !== "HIGH" && risk.severity !== "CRITICAL" && risk.severity !== "MODERATE") return undefined;
  const existing = [...state.alerts.values()].find((alert) => alert.id === risk.id);
  const alert: Alert = { id: risk.id, title: `${risk.hazard.replaceAll("_", " ")} warning`, type: `${risk.hazard}_WARNING`, status: existing ? "UPDATED" : "ACTIVE", severity: risk.severity, confidence: risk.confidence, center: risk.center, radius: risk.radius, evidence: risk.evidence, expiresAt: new Date(Date.now() + 30 * 60_000), createdAt: existing?.createdAt ?? new Date(), updatedAt: new Date() };
  state.alerts.set(alert.id, alert);
  state.analytics.alertsSent += existing ? 0 : state.devices.size;
  void AlertModel.updateOne({ id: alert.id }, { $set: alert }, { upsert: true }).catch(() => undefined);
  return alert;
}
export function activeAlerts(): Alert[] { return [...state.alerts.values()].filter((alert) => alert.expiresAt > new Date() && alert.status !== "EXPIRED"); }
export function resolveAlert(id: string): Alert | undefined { const alert = state.alerts.get(id); if (!alert) return undefined; alert.status = "EXPIRED"; alert.updatedAt = new Date(); return alert; }
export function testAlert(): Alert { const firstRisk = [...state.risks.values()][0]; const alert: Alert = { id: randomUUID(), title: "Test emergency broadcast", type: "WEATHER_WATCH", status: "ACTIVE", severity: "HIGH", confidence: 1, center: firstRisk?.center ?? { type: "Point", coordinates: [78.4867, 17.385] }, radius: 1_000, evidence: [], expiresAt: new Date(Date.now() + 15 * 60_000), createdAt: new Date(), updatedAt: new Date() }; state.alerts.set(alert.id, alert); return alert; }
