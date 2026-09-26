"use client";

import { useEffect, useMemo, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { FALLBACK_COORDINATES } from "@/constants/app";
import type { LatLng } from "@/lib/format";

export type LocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable";

export interface UseUserLocationResult {
  /** Null until a fix is obtained; consumers should handle the null case. */
  coordinates: LatLng | null;
  status: LocationStatus;
  /** Metres, as reported by the browser. */
  accuracy: number | null;
  error: string | null;
  isUsingFallback: boolean;
  requestPermission: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 30_000,
};

function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Wraps the browser Geolocation API.
 *
 * Initial state is deliberately environment-independent: `navigator` exists on
 * the client but not the server, so seeding state from a support check would
 * make the first client render disagree with the server HTML and trip a
 * hydration mismatch. Instead every consumer starts at `idle` — which reads as
 * "locating" — and the real support check runs in the effect, after hydration.
 *
 * Until a fix arrives, `coordinates` is null and callers should fall back to
 * `FALLBACK_COORDINATES`, the same centre the backend defaults to.
 */
export function useUserLocation(): UseUserLocationResult {
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [state, setState] = useState<{
    status: LocationStatus;
    error: string | null;
    attempt: number;
  }>({ status: "idle", error: null, attempt: 0 });

  const { status, error, attempt } = state;

  // Support is a client-only fact, so it is read during render but kept out of
  // the pre-hydration output. `hydrated` gates it, so the first client render
  // still matches the server HTML.
  const hydrated = useHydrated();
  const isSupported = useMemo(() => isGeolocationSupported(), []);

  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setState((previous) => ({ ...previous, status: "granted", error: null }));
      },
      (geoError) => {
        if (cancelled) return;
        const denied = geoError.code === geoError.PERMISSION_DENIED;
        setState((previous) => ({
          ...previous,
          status: denied ? "denied" : "unavailable",
          error: denied
            ? "Location permission was denied. Using the default regional centre."
            : "Your location could not be determined. Using the default regional centre.",
        }));
      },
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
    };
  }, [isSupported, attempt]);

  /** Re-requests a fix. Called from an event handler, not an effect. */
  const requestPermission = () =>
    setState((previous) => ({
      ...previous,
      status: "locating",
      error: null,
      attempt: previous.attempt + 1,
    }));

  const unsupported = hydrated && !isSupported;

  return {
    coordinates,
    // `idle` means a request is in flight, which is what the UI should show.
    status: unsupported ? "unavailable" : status === "idle" ? "locating" : status,
    accuracy,
    error: unsupported
      ? "This browser does not expose a location API."
      : error,
    isUsingFallback: coordinates === null,
    requestPermission,
  };
}

/**
 * The centre to render maps and distance calculations around.
 * Never null, so it is safe to use in calculations and format helpers.
 */
export function useEffectiveCoordinates(): {
  coordinates: LatLng;
  isFallback: boolean;
} {
  const { coordinates, isUsingFallback } = useUserLocation();

  return {
    coordinates: coordinates ?? { ...FALLBACK_COORDINATES },
    isFallback: isUsingFallback,
  };
}
