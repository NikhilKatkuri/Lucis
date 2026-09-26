import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell } from "@/components/layout/page-shell";
import { SkeletonMap, SkeletonStats } from "@/components/shared/skeleton";
import { MapView } from "./map-view";

export const metadata: Metadata = {
  title: "Live map",
  description:
    "Fullscreen interactive hazard map with your location, danger radius, flood extent, shelters, hospitals and resources.",
};

export default function MapPage() {
  return (
    <AppShell>
      <PageShell className="pb-0">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <MapView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function MapSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Live situation"
        title="Live map"
        description="Your position, the active danger radius and nearby emergency resources."
      />
      <SkeletonStats count={4} />
      <SkeletonMap className="h-[60dvh] w-full" />
    </>
  );
}
