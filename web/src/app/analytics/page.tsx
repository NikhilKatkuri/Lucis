import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SkeletonChart, SkeletonStats } from "@/components/shared/skeleton";
import { AnalyticsView } from "./analytics-view";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Risk, rainfall, alert severity and resource availability metrics for your area.",
};

export default function AnalyticsPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<AnalyticsSkeleton />}>
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Metrics"
        title="Analytics"
        description="Trends across risk, rainfall, alerts and available resources."
      />
      <SkeletonStats count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risk timeline">
          <SkeletonChart />
        </Panel>
        <Panel title="Rainfall">
          <SkeletonChart />
        </Panel>
      </div>
    </>
  );
}
