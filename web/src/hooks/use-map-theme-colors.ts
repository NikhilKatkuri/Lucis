"use client";

import { useMemo, useSyncExternalStore } from "react";

import { toMapColor } from "@/lib/color";

/**
 * Semantic colours read from the active theme's CSS custom properties.
 *
 * MapLibre paint properties are set imperatively and cannot use Tailwind
 * classes, so the map reads the same design tokens the rest of the app uses.
 *
 * The store snapshot is a *string* rather than an object: `useSyncExternalStore`
 * compares snapshots with `Object.is`, so returning a fresh object each call
 * would loop forever, while returning a joined string is both pure and
 * value-compared.
 */
export interface MapThemeColors {
  riskZone: string;
  floodExtent: string;
  userLocation: string;
  halo: string;
  label: string;
  labelHalo: string;
  shelter: string;
  hospital: string;
  rescue: string;
  water: string;
  food: string;
  other: string;
}

const TOKENS = {
  riskZone: "--severity-critical",
  floodExtent: "--severity-high",
  userLocation: "--primary",
  halo: "--surface",
  label: "--foreground",
  labelHalo: "--surface",
  shelter: "--success",
  hospital: "--info",
  rescue: "--severity-high",
  water: "--info",
  food: "--warning",
  other: "--muted-foreground",
} as const satisfies Record<keyof MapThemeColors, string>;

type TokenName = keyof MapThemeColors;

/**
 * Fallback colours per token, in a form MapLibre can parse directly. Used on
 * the server and before the first client read.
 */
const FALLBACK: Record<TokenName, string> = {
  riskZone: "#cf5d51",
  floodExtent: "#e08a4a",
  userLocation: "#287b70",
  halo: "#ffffff",
  label: "#202a32",
  labelHalo: "#ffffff",
  shelter: "#4b9175",
  hospital: "#5688a8",
  rescue: "#c2703f",
  water: "#3f8fa8",
  food: "#b08a3f",
  other: "#5b6b78",
};

const FALLBACK_SNAPSHOT = Object.values(FALLBACK).join("|");

/**
 * Read the tokens and normalise them to sRGB. The browser serialises the
 * `oklch()` design tokens as `lab()`, which MapLibre cannot parse, so every
 * value is converted here.
 */
function readSnapshot(): string {
  if (typeof window === "undefined") return FALLBACK_SNAPSHOT;

  const style = getComputedStyle(document.documentElement);

  return (Object.keys(TOKENS) as TokenName[])
    .map((key) => toMapColor(style.getPropertyValue(TOKENS[key]), FALLBACK[key]))
    .join("|");
}

let observer: MutationObserver | null = null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  if (!observer) {
    observer = new MutationObserver(onStoreChange);
    // next-themes toggles the `class` attribute on <html>.
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  }

  return () => {
    observer?.disconnect();
    observer = null;
  };
}

function getServerSnapshot(): string {
  return FALLBACK_SNAPSHOT;
}

/**
 * Resolved design-token colours for the current theme. Re-reads automatically
 * whenever the theme class changes.
 */
export function useMapThemeColors(): MapThemeColors {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  return useMemo(() => {
    const values = snapshot.split("|");
    const colors = {} as MapThemeColors;

    (Object.keys(TOKENS) as TokenName[]).forEach((key, index) => {
      colors[key] = values[index] || "";
    });

    return colors;
  }, [snapshot]);
}
