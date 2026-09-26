"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { formatAge, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineTone = "critical" | "high" | "medium" | "success" | "info";

export interface TimelineEvent {
  id: string;
  /** Bolded lead-in, e.g. "Threshold crossed". */
  title: string;
  description?: string;
  /** ISO timestamp. */
  timestamp: string;
  tone?: TimelineTone;
}

const DOT_TONE: Record<TimelineTone, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  success: "bg-success",
  info: "bg-info",
};

/**
 * Chronological incident log. Explicitly framed as "a changing picture, not a
 * definitive record" — the same caveat the prototype carries.
 */
export function IncidentTimeline({
  events,
  className,
  emptyMessage = "No recorded events yet.",
}: {
  events: TimelineEvent[];
  className?: string;
  emptyMessage?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (events.length === 0) {
    return (
      <p className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className={cn("relative flex flex-col", className)}>
      {/* Connecting rail */}
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[5px] w-px bg-border"
      />

      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.li
            key={event.id}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="relative flex gap-3 py-2.5 pl-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-surface",
                DOT_TONE[event.tone ?? "info"],
              )}
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {formatTime(event.timestamp)} · {event.title}
                </span>
                {event.description ? ` — ${event.description}` : null}
              </p>
            </div>

            <time
              dateTime={event.timestamp}
              className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
            >
              {formatAge(event.timestamp)}
            </time>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

/**
 * Derives a timeline from the entities the backend exposes, so every event
 * carries a real server timestamp.
 */
export function useIncidentTimeline(input: {
  alerts: { id: string; title: string; createdAt: string; severity: string }[];
  reports: { id: string; message: string; timestamp: string }[];
  weatherUpdatedAt?: string | null;
}): TimelineEvent[] {
  const { alerts, reports, weatherUpdatedAt } = input;

  return [
    ...alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: "Alert raised by the risk model",
      timestamp: alert.createdAt,
      tone:
        alert.severity === "CRITICAL"
          ? ("critical" as const)
          : alert.severity === "HIGH"
            ? ("high" as const)
            : ("medium" as const),
    })),
    ...reports.map((report) => ({
      id: `report-${report.id}`,
      title: "Community report received",
      description: report.message,
      timestamp: report.timestamp,
      tone: "success" as const,
    })),
    ...(weatherUpdatedAt
      ? [
          {
            id: "weather-refresh",
            title: "Weather observation refreshed",
            timestamp: weatherUpdatedAt,
            tone: "info" as const,
          },
        ]
      : []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
