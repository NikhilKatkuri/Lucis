"use client";

import {
  CrosshairSimpleIcon,
  MinusIcon,
  PlusIcon,
  CloudRainIcon,
  MapPinIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MapControlsProps {
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  basemap: "light" | "dark" | "satellite";
  onBasemapChange: (basemap: "light" | "dark" | "satellite") => void;
  showResources: boolean;
  onToggleResources: () => void;
  showWeather: boolean;
  onToggleWeather: () => void;
  className?: string;
}

/**
 * Floating map control stack. Rendered as an overlay on top of the map canvas
 * rather than inside it, so keyboard order stays predictable.
 */
export function MapControls({
  onRecenter,
  onZoomIn,
  onZoomOut,
  basemap,
  onBasemapChange,
  showResources,
  onToggleResources,
  showWeather,
  onToggleWeather,
  className,
}: MapControlsProps) {
  const basemaps = [
    { id: "light" as const, label: "Light map" },
    { id: "dark" as const, label: "Dark map" },
    { id: "satellite" as const, label: "Satellite imagery" },
  ];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col justify-between p-3",
        className,
      )}
    >
      {/* Top row: basemap + layer toggles */}
      <div className="pointer-events-auto flex flex-wrap items-start gap-2">
        <div
          role="group"
          aria-label="Basemap"
          className="flex overflow-hidden rounded-full border border-border bg-surface/95 shadow-elevation-3 backdrop-blur-sm"
        >
          {basemaps.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onBasemapChange(option.id)}
              aria-pressed={basemap === option.id}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                basemap === option.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <LayerToggle
            active={showResources}
            onClick={onToggleResources}
            icon={<MapPinIcon className="size-4" />}
            label="Resources"
          />
          <LayerToggle
            active={showWeather}
            onClick={onToggleWeather}
            icon={<CloudRainIcon className="size-4" />}
            label="Weather"
          />
        </div>
      </div>

      {/* Bottom row: recentre and zoom */}
      <div className="pointer-events-auto flex items-end justify-between gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={onRecenter}
          aria-label="Centre the map on my location"
          className="bg-surface/95 shadow-elevation-3 backdrop-blur-sm"
        >
          <CrosshairSimpleIcon className="size-5" weight="bold" />
        </Button>

        <div className="flex flex-col overflow-hidden rounded-full border border-border bg-surface/95 shadow-elevation-3 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="rounded-none"
          >
            <PlusIcon className="size-4" weight="bold" />
          </Button>
          <span aria-hidden="true" className="h-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="rounded-none"
          >
            <MinusIcon className="size-4" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LayerToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium shadow-elevation-2 backdrop-blur-sm",
        "transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-primary/40 bg-primary text-primary-foreground"
          : "border-border bg-surface/95 text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Legend rendered in the map's bottom-left corner. */
export function MapLegend({ className }: { className?: string }) {
  const items = [
    { label: "Risk zone", className: "bg-severity-critical/70" },
    { label: "Flood extent", className: "bg-severity-high/70" },
    { label: "Shelter", className: "bg-success" },
    { label: "Hospital", className: "bg-info" },
    { label: "You", className: "bg-primary" },
  ];

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-surface/95 px-3 py-2 text-[11px] text-muted-foreground shadow-elevation-2 backdrop-blur-sm",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("size-2.5 rounded-full", item.className)}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

