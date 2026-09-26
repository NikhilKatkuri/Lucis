import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SkeletonRows, SkeletonStats } from "@/components/shared/skeleton";
import { ResourcesView } from "./resources-view";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Nearby shelters, hospitals, water points and aid stations sorted by distance.",
};

export default function ResourcesPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<ResourcesSkeleton />}>
          <Suspense fallback={<ResourcesSkeleton />}>
            <ResourcesView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function ResourcesSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Nearby"
        title="Emergency resources"
        description="Shelters, hospitals and essential services, closest first."
      />
      <SkeletonStats count={4} />
      <Panel title="Resources">
        <SkeletonRows rows={5} />
      </Panel>
    </>
  );
}
