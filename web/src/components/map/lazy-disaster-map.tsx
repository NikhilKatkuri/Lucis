"use client";

import dynamic from "next/dynamic";

import { SkeletonMap } from "@/components/shared/skeleton";
import type { DisasterMapProps } from "@/components/map/disaster-map";

/**
 * MapLibre is ~250 KB of WebGL code, so it is excluded from the initial bundle
 * and loaded only when a map actually scrolls into view.
 */
const DisasterMap = dynamic(
  () => import("@/components/map/disaster-map").then((m) => m.DisasterMap),
  {
    ssr: false,
    loading: () => <SkeletonMap className="h-[320px] w-full sm:h-[380px]" />,
  },
);

export type { DisasterMapProps };

/** Lazy-loaded, SSR-excluded wrapper around the MapLibre component. */
export function LazyDisasterMap(props: DisasterMapProps) {
  return <DisasterMap {...props} />;
}
