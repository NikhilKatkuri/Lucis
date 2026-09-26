"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Boolean/string preferences persisted in `localStorage`.
 *
 * Exposed as an external store rather than component state plus an effect:
 * `useSyncExternalStore` reads the stored value during render (with a stable
 * server snapshot), so preferences hydrate without a cascading setState.
 */

const PREFIX = "lucis.";

const listeners = new Set<() => void>();

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    // Storage blocked (private browsing, strict cookies).
    return null;
  }
}

function writeRaw(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Non-fatal: the preference simply will not persist this session.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Keep multiple tabs in step.
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREFIX)) listener();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

export type PreferenceKey = "notifications" | "language";

/**
 * Read a preference, falling back to `defaultValue` when unset.
 *
 * Overloaded so the stored value is typed from the default: a `true` default
 * yields `boolean`, a string default yields `string`.
 */
export function usePreference(
  key: PreferenceKey,
  defaultValue: boolean,
): [boolean, (value: boolean) => void];
export function usePreference(
  key: PreferenceKey,
  defaultValue: string,
): [string, (value: string) => void];
export function usePreference(
  key: PreferenceKey,
  defaultValue: boolean | string,
): [boolean | string, (value: never) => void] {
  const isBoolean = typeof defaultValue === "boolean";

  const getSnapshot = useCallback(() => {
    const raw = readRaw(key);
    if (raw === null) return defaultValue;
    return isBoolean ? raw === "true" : raw;
  }, [key, defaultValue, isBoolean]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultValue,
  );

  const setValue = useCallback(
    (next: boolean | string) => {
      writeRaw(key, String(next));
      emit();
    },
    [key],
  );

  return [value, setValue];
}
