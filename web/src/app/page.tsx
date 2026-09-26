import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SkeletonStats } from "@/components/shared/skeleton";
import { DashboardView } from "@/app/dashboard-view";

export const metadata = {
  title: "Dashboard",
  description:
    "Your current disaster situation: active alerts, live weather, risk score and nearby resources.",
};

/**
 * Dashboard.
 *
 * A Server Component so the shell, headings and page structure stream first.
 * Everything that depends on live socket or query data lives in
 * `<DashboardView/>` behind a Suspense boundary.
 */
export default function DashboardPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<DashboardSkeleton />}>
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Regional operations"
        title="Situation overview"
        description="A clear picture of what is changing, and where a closer look matters."
      />

      <SkeletonStats />

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Panel title="Impact and evidence map">
          <div className="h-[320px] w-full rounded-xl bg-muted sm:h-[380px]" />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="h-44 rounded-xl bg-muted" />
          </Panel>
          <Panel title="Live weather">
            <div className="h-36 rounded-xl bg-muted" />
          </Panel>
        </div>
      </div>
    </>
  );
}
