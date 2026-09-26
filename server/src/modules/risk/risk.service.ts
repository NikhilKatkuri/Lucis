import { randomUUID } from "node:crypto";
import { RiskZoneModel } from "../../database/models.js";
import type { Hazard, RiskEvidence, RiskZone, Severity } from "../../types/index.js";
import { point } from "../../utils/geo.js";
import { logger } from "../../utils/logger.js";
import { state } from "../state.js";

const severityFor = (score: number): Severity => score >= 0.8 ? "CRITICAL" : score >= 0.6 ? "HIGH" : score >= 0.35 ? "MODERATE" : "LOW";

export function calculateRisk(): RiskZone[] {
  const weather = state.weather[0];
  if (!weather) return [];
  const rainScore = Math.min(weather.rainfall / 25, 1);
  const windScore = Math.min(weather.windSpeed / 80, 1);
  const weatherScore = rainScore * 0.7 + windScore * 0.3;
  const satelliteScore = state.simulation.scenario === "FLOOD" || state.simulation.scenario === "FLASH_FLOOD" ? Math.min(0.4 + state.simulation.tick / 100, 1) : 0.15;
  const sensorScore = Math.min(weather.rainfall / 40 + (state.simulation.tick % 12) / 100, 1);
  const reportScore = Math.min(state.reports.filter((report) => report.verified).length / 20, 1);
  const score = Math.min(1, weatherScore * 0.25 + satelliteScore * 0.4 + sensorScore * 0.2 + reportScore * 0.15);
  const hazard: Hazard = state.simulation.scenario === "FLASH_FLOOD" ? "FLASH_FLOOD" : state.simulation.scenario as Hazard;
  const evidence: RiskEvidence[] = [
    { source: "weather", score: weatherScore, summary: `${weather.rainfall.toFixed(1)} mm rainfall and ${weather.windSpeed.toFixed(1)} km/h wind` },
    { source: "satellite", score: satelliteScore, summary: "Synthetic satellite water-extent signal" },
    { source: "sensor", score: sensorScore, summary: "River sensor trend within monitored basin" },
    { source: "report", score: reportScore, summary: `${state.reports.filter((report) => report.verified).length} verified community reports` }
  ];
  const previous = [...state.risks.values()][0];
  const risk = { id: previous?.id ?? randomUUID(), center: weather.location, radius: 5_000, hazard, score, severity: severityFor(score), confidence: Math.min(0.99, 0.55 + score * 0.4), evidence, updatedAt: new Date() };
  state.risks.set(risk.id, risk);
  state.analytics.activeDisasters = risk.severity === "LOW" ? 0 : 1;
  state.analytics.averageRisk = score;
  void RiskZoneModel.updateOne({ id: risk.id }, { $set: risk }, { upsert: true }).catch((error) => logger.debug({ err: error }, "Could not persist risk zone"));
  return [risk];
}

export function liveRisk() { return [...state.risks.values()]; }
