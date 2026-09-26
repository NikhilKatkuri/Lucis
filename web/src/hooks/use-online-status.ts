"use client";

import { useSyncExternalStore } from "react";

/* Module-level subscription set, shared by every consumer. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Tracks browser connectivity.
 *
 * Modelled as an external store rather than component state: the online flag is
 * owned by the browser, and `useSyncExternalStore` reads it without an effect
 * that would set state on every mount.
 *
 * Note that browsers only update `navigator.onLine` when a network interface
 * changes, so a server outage while the interface is still up will not flip this
 * flag. The socket status indicator covers that case.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
