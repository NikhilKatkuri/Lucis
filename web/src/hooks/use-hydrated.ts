"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True once the client has hydrated.
 *
 * Use this for values that cannot be known on the server — resolved theme,
 * `localStorage` contents — so the first client render still matches the server
 * HTML and React does not warn about a mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
