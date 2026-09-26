"use client";

import type { ReactNode } from "react";

import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Renders its children only after hydration, showing `fallback` until then.
 *
 * Every number in this application comes from a client-side query or the
 * WebSocket, so the server can only ever emit a placeholder for them. Rendering
 * the live view on the server and then re-rendering it on the client is a
 * guaranteed hydration mismatch whenever data changes between the two — which
 * is constant for a realtime feed. Gating the data region here keeps the
 * server HTML and the first client render identical, and gives the skeleton
 * loading experience on every route.
 *
 * Page structure, headings and metadata stay in Server Components and are still
 * streamed as HTML.
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const hydrated = useHydrated();

  return hydrated ? children : fallback;
}
