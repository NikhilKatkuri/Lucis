import { SimulationEventModel } from "../../database/models.js";
import { state } from "../state.js";
import type { Hazard } from "../../types/index.js";

export function setSimulationStatus(status: "RUNNING" | "PAUSED" | "IDLE") { state.simulation.status = status; state.simulation.updatedAt = new Date(); return state.simulation; }
export function startSimulation(scenario?: string) { state.simulation.scenario = (scenario ?? state.simulation.scenario).toUpperCase(); state.simulation.status = "RUNNING"; state.simulation.updatedAt = new Date(); return state.simulation; }
export function resetSimulation() { state.simulation = { status: "IDLE", scenario: "FLOOD", tick: 0, updatedAt: new Date() }; state.risks.clear(); state.alerts.clear(); return state.simulation; }
export function tickSimulation() { if (state.simulation.status !== "RUNNING") return undefined; state.simulation.tick += 1; state.simulation.updatedAt = new Date(); const event = { scenario: state.simulation.scenario as Hazard, eventType: "TICK", payload: { tick: state.simulation.tick }, timestamp: new Date() }; void SimulationEventModel.create(event).catch(() => undefined); return event; }
export const simulationState = () => state.simulation;
