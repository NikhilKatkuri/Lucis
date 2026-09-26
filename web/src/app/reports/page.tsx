import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SkeletonRows, SkeletonStats } from "@/components/shared/skeleton";
import { ReportsView } from "./reports-view";

export const metadata: Metadata = {
  title: "Community reports",
  description:
    "Live citizen reports from the field, with an optimistic submission form.",
};

export default function ReportsPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<ReportsSkeleton />}>
          <Suspense fallback={<ReportsSkeleton />}>
            <ReportsView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function ReportsSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Field reports"
        title="Community reports"
        description="Observations submitted by residents, newest first."
      />
      <SkeletonStats count={3} />
      <Panel title="Report feed">
        <SkeletonRows rows={4} />
      </Panel>
    </>
  );
}
