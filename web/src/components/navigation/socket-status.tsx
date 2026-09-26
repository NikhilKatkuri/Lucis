"use client";

import { Chip, type ChipTone } from "@/components/shared/chip";
import { useSocket } from "@/providers/socket.provider";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { isKnownScenario } from "@/lib/socket-events";
import { cn } from "@/lib/utils";

/**
 * The four states the brief calls for: connected, reconnecting, offline and
 * simulation mode. Simulation is surfaced as a distinct badge because it
 * changes how every other number on screen should be read.
 */
export function SocketStatusBadge({ className }: { className?: string }) {
  const { status, isConnected, simulation } = useSocket();
  const isOnline = useOnlineStatus();

  const connection: { label: string; tone: ChipTone; dot: string } = !isOnline
    ? { label: "Offline", tone: "danger", dot: "bg-danger" }
    : status === "connected"
      ? { label: "Live", tone: "success", dot: "bg-success" }
      : status === "reconnecting"
        ? { label: "Reconnecting", tone: "warning", dot: "bg-warning" }
        : status === "connecting"
          ? { label: "Connecting", tone: "neutral", dot: "bg-muted-foreground" }
          : { label: "Disconnected", tone: "danger", dot: "bg-danger" };

  const isSimulating = simulation?.status === "RUNNING";
  const scenarioLabel =
    simulation && isKnownScenario(simulation.scenario)
      ? simulation.scenario.replaceAll("_", " ").toLowerCase()
      : simulation?.scenario.toLowerCase();

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-live="polite"
    >
      <Chip tone={connection.tone} size="sm" variant="tonal">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            connection.dot,
            isConnected && "animate-ripple",
          )}
        />
        {connection.label}
        <span className="sr-only"> live connection</span>
      </Chip>

      {isSimulating ? (
        <Chip tone="info" size="sm" variant="outline">
          Simulation · {scenarioLabel}
          <span className="sr-only"> mode active</span>
        </Chip>
      ) : null}
    </div>
  );
}
