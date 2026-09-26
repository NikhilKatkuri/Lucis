import type { SimulationEvent, SimulationState, SimulationTickEvent } from "@/types/api";

/**
 * The backend emits `simulation` with two structurally different payloads:
 * a state snapshot on connect, and a per-tick event every 5 s while running.
 * The tick variant is the only one carrying `eventType`, so it is the
 * reliable discriminator.
 */
export function isSimulationTick(event: SimulationEvent): event is SimulationTickEvent {
  return "eventType" in event;
}

export function isSimulationState(event: SimulationEvent): event is SimulationState {
  return "status" in event;
}

/** Scenario values the UI offers. The server does not validate this field. */
export function isKnownScenario(
  scenario: string,
): scenario is (typeof KNOWN_SCENARIOS)[number] {
  return (KNOWN_SCENARIOS as readonly string[]).includes(scenario);
}

export const KNOWN_SCENARIOS = [
  "FLOOD",
  "FLASH_FLOOD",
  "HEAVY_RAIN",
  "WILDFIRE",
  "CYCLONE",
  "HEATWAVE",
] as const;
