const DEVICE_ID_KEY = "lucis.device-id";

/** In-memory fallback for private browsing, where storage throws. */
let memoryDeviceId: string | null = null;

/**
 * Stable per-browser identifier sent with reports and preferences.
 *
 * Persisted in `localStorage` so a returning visitor keeps the same identity.
 * Falls back to a per-session id when storage is unavailable.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server-render";

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const generated = `web-${crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    memoryDeviceId ??= `web-${Math.random().toString(36).slice(2, 12)}`;
    return memoryDeviceId;
  }
}
