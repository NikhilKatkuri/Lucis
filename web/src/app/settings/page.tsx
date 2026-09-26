import { Suspense } from "react";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ClientOnly } from "@/components/shared/client-only";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Theme, language, notification preferences and simulation controls.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <PageShell>
        <ClientOnly fallback={<SettingsSkeleton />}>
          <Suspense fallback={<SettingsSkeleton />}>
            <SettingsView />
          </Suspense>
        </ClientOnly>
      </PageShell>
    </AppShell>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <PageHeader
        kicker="Preferences"
        title="Settings"
        description="Theme, language, notifications and the simulation harness."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Appearance">
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </Panel>
        <Panel title="Simulation">
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </Panel>
      </div>
    </>
  );
}
