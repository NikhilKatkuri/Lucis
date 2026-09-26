import { randomUUID } from "node:crypto";
import { ReportModel } from "../../database/models.js";
import type { Coordinates } from "../../types/index.js";
import { point } from "../../utils/geo.js";
import { state } from "../state.js";

export function createReport(input: { deviceId: string; location: Coordinates; message: string }) {
  const report = { id: randomUUID(), deviceId: input.deviceId, location: point(input.location.latitude, input.location.longitude), message: input.message, timestamp: new Date(), trustScore: 0.5, verified: false };
  state.reports.unshift(report);
  state.reports.splice(1000);
  state.analytics.reportsReceived += 1;
  void ReportModel.create(report).catch(() => undefined);
  return report;
}
export const liveReports = (): typeof state.reports => state.reports.slice(0, 100);
