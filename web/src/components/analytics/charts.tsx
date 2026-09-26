"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

/**
 * Shared Recharts configuration.
 *
 * Semantic tokens only, rounded bars, hairline gridlines and a Material-style
 * tooltip. Recharts renders SVG, so colours arrive as CSS variable references
 * which the browser resolves — that keeps charts on-theme without duplicating
 * the palette in JS.
 */

const AXIS_STYLE = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

const GRID_COLOR = "var(--chart-grid)";

export interface TooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  dataKey?: string | number;
}

/**
 * Swatch colours keyed by series name. Recharts supplies raw colours on the
 * payload, but the project forbids inline styles, so each known series maps to
 * a static Tailwind background utility instead.
 */
const SERIES_SWATCH: Record<string, string> = {
  risk: "bg-severity-high",
  "Risk score": "bg-severity-high",
  confidence: "bg-chart-2",
  Confidence: "bg-chart-2",
  rainfall: "bg-chart-3",
  Rainfall: "bg-chart-3",
  count: "bg-chart-1",
  Alerts: "bg-chart-1",
  Facilities: "bg-chart-1",
};

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-elevation-3">
      {label !== undefined ? (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {payload.map((item, index) => (
          <li
            key={`${item.dataKey}-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                SERIES_SWATCH[String(item.dataKey ?? item.name)] ?? "bg-muted-foreground",
              )}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">
              {item.value}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Risk score over time. */
export function RiskTimelineChart({
  data,
  className,
}: {
  data: { time: string; risk: number; confidence: number }[];
  className?: string;
}) {
  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid
            stroke={GRID_COLOR}
            strokeWidth={1}
            vertical={false}
          />
          <XAxis dataKey="time" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            width={44}
          />
          <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: GRID_COLOR }} />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
          />
          <Line
            type="monotone"
            dataKey="risk"
            name="Risk score"
            stroke="var(--chart-4)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke="var(--chart-2)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Hourly rainfall projection. */
export function RainfallChart({
  data,
  className,
}: {
  data: { time: string; rainfall: number }[];
  className?: string;
}) {
  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid
            stroke={GRID_COLOR}
            strokeWidth={1}
            vertical={false}
          />
          <XAxis dataKey="time" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            content={<ChartTooltip unit=" mm" />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar
            dataKey="rainfall"
            name="Rainfall"
            fill="var(--chart-3)"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Alert counts by severity. */
export function AlertSeverityChart({
  data,
  className,
}: {
  data: { severity: string; count: number }[];
  className?: string;
}) {
  const toneBySeverity: Record<string, string> = {
    Critical: "var(--severity-critical)",
    High: "var(--severity-high)",
    Medium: "var(--severity-medium)",
    Safe: "var(--severity-low)",
  };

  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid
            stroke={GRID_COLOR}
            strokeWidth={1}
            vertical={false}
          />
          <XAxis dataKey="severity" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar dataKey="count" name="Alerts" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell
                key={entry.severity}
                fill={toneBySeverity[entry.severity] ?? "var(--chart-1)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Resource availability by category. */
export function ResourceAvailabilityChart({
  data,
  className,
}: {
  data: { type: string; count: number }[];
  className?: string;
}) {
  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            stroke={GRID_COLOR}
            strokeWidth={1}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="type"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={104}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar
            dataKey="count"
            name="Facilities"
            fill="var(--chart-1)"
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartTooltip };
