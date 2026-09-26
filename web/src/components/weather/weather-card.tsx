"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CloudRainIcon,
  DropIcon,
  ThermometerIcon,
  TimerIcon,
  WindIcon,
} from "@phosphor-icons/react";

import { Chip } from "@/components/shared/chip";
import { Skeleton } from "@/components/shared/skeleton";
import {
  formatRainfall,
  formatTemperature,
  formatTime,
  formatWind,
} from "@/lib/format";
import type { WeatherSnapshot } from "@/types/api";
import { cn } from "@/lib/utils";

/** Maps the backend's free-text condition onto a Phosphor icon. */
function ConditionIcon({ condition }: { condition: string }) {
  const value = condition.toLowerCase();

  if (value.includes("rain") || value.includes("shower")) {
    return <CloudRainIcon className="size-8" weight="fill" />;
  }
  if (value.includes("storm") || value.includes("thunder")) {
    return <CloudRainIcon className="size-8" weight="duotone" />;
  }
  if (value.includes("wind")) {
    return <WindIcon className="size-8" weight="fill" />;
  }
  if (value.includes("cloud") || value.includes("overcast")) {
    return <CloudRainIcon className="size-8" weight="regular" />;
  }
  return <ThermometerIcon className="size-8" weight="fill" />;
}

export interface WeatherCardProps {
  weather: WeatherSnapshot | null;
  isLoading?: boolean;
  className?: string;
}

/** Live conditions: temperature, rainfall, humidity, wind and freshness. */
export function WeatherCard({ weather, isLoading, className }: WeatherCardProps) {
  // Hooks must run before any early return.
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-card border border-border bg-surface p-5",
          className,
        )}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-5 py-8 text-center",
          className,
        )}
      >
        <CloudRainIcon aria-hidden="true" className="size-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No observation yet</p>
        <p className="text-xs text-muted-foreground">
          The backend has not reported conditions for your area.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={weather.updatedAt}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col gap-4 rounded-card border border-border bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Live conditions
          </p>
          <p className="mt-1.5 flex items-baseline gap-1">
            <span className="text-4xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
              {formatTemperature(weather.temperature)}
            </span>
            <span className="text-sm text-muted-foreground">C</span>
          </p>
          <p className="mt-2 truncate text-sm text-foreground">{weather.condition}</p>
        </div>

        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-info-container text-info-container-foreground"
        >
          <ConditionIcon condition={weather.condition} />
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div>
          <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <DropIcon aria-hidden="true" className="size-3.5" />
            Rainfall
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
            {formatRainfall(weather.rainfall)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] text-muted-foreground">Humidity</dt>
          <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
            {Math.round(weather.humidity)}%
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <WindIcon aria-hidden="true" className="size-3.5" />
            Wind
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
            {formatWind(weather.windSpeed)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Chip tone="neutral" size="sm" variant="outline" icon={<TimerIcon className="size-3.5" />}>
          Updated {formatTime(weather.updatedAt)}
        </Chip>
        <span className="text-[11px] text-muted-foreground">1h accumulation</span>
      </div>
    </motion.div>
  );
}

/** Condensed forecast strip. The backend always returns 24 hourly entries. */
export function ForecastStrip({
  forecast,
  hours = 6,
  className,
}: {
  forecast: WeatherSnapshot[];
  hours?: number;
  className?: string;
}) {
  const entries = forecast.slice(0, hours);

  if (entries.length === 0) return null;

  return (
    <ul
      className={cn(
        "grid grid-cols-3 gap-2 sm:grid-cols-6",
        className,
      )}
      aria-label="Hourly forecast"
    >
      {entries.map((entry, index) => (
        <li
          key={entry.updatedAt}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-container-low px-2 py-2.5 text-center"
        >
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {index === 0 ? "Now" : formatTime(entry.updatedAt).slice(-5)}
          </span>
          <span aria-hidden="true" className="text-info-container-foreground">
            <ConditionIcon condition={entry.condition} />
          </span>
          <span className="text-xs font-medium text-foreground tabular-nums">
            {formatTemperature(entry.temperature)}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {entry.rainfall.toFixed(0)}mm
          </span>
        </li>
      ))}
    </ul>
  );
}
