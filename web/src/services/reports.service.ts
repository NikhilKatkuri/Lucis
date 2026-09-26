import { api, toQuery } from "@/services/api.client";
import type {
  CommunityReport,
  Coordinates,
  CreateReportRequest,
} from "@/types/api";

/** The server caps this feed at the 100 most recent reports. */
export const REPORTS_PAGE_SIZE = 100;

export const reportsService = {
  live: () => api.get<CommunityReport[]>("/api/reports/live"),

  /** Reports within `radiusKm`; order is newest-first but not re-sorted. */
  nearby: (coordinates: Coordinates, radiusKm: number) =>
    api.get<CommunityReport[]>(
      `/api/geo/nearby-reports${toQuery({ ...coordinates, radiusKm })}`,
    ),

  /** Submits a citizen report. Trust starts at 0.5 and `verified` is false. */
  create: (body: CreateReportRequest) =>
    api.post<CommunityReport>("/api/reports", body),
};
