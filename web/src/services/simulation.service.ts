import { api } from "@/services/api.client";
import type { SimulationState } from "@/types/api";

export interface SimulationStartRequest {
  scenario?: string;
}

export const simulationService = {
  state: () => api.get<SimulationState>("/api/simulation/state"),

  /** Omit `scenario` to keep the current one. */
  start: (body: SimulationStartRequest = {}) =>
    api.post<SimulationState>("/api/simulation/start", body),

  /** Alias of `start` — sets the scenario and forces `RUNNING`. */
  scenario: (body: SimulationStartRequest) =>
    api.post<SimulationState>("/api/simulation/scenario", body),

  pause: () => api.post<SimulationState>("/api/simulation/pause"),

  resume: () => api.post<SimulationState>("/api/simulation/resume"),

  /** Also clears server-side risk zones and alerts, so refetch after calling. */
  reset: () => api.post<SimulationState>("/api/simulation/reset"),
};
