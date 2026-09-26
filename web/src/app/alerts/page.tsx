import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SkeletonRows, SkeletonStats } from "@/components/shared/skeleton";
import { AlertsView } from "./alerts-view";

export const metadata: Metadata = {
  title: "Alerts",
  description:
    "Live alert feed with severity and proximity filters, evidence breakdowns and expiry tracking.",
};

export default function AlertsPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<AlertsSkeleton />}>
          <Suspense fallback={<AlertsSkeleton />}>
            <AlertsView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function AlertsSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Live feed"
        title="Alerts"
        description="Warnings raised by the risk model, newest and most severe first."
      />
      <SkeletonStats count={4} />
      <Panel title="Alert feed">
        <SkeletonRows rows={5} />
      </Panel>
    </>
  );
}
