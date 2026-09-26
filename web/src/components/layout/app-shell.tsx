"use client";

import { MobileNav } from "@/components/navigation/mobile-nav";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/layout/header";
import { ToastNotifications } from "@/components/shared/toast-notifications";
import { useDeviceRegistration } from "@/hooks/use-live-data";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";

/**
 * The responsive application shell.
 *
 * Desktop  — persistent sidebar rail + sticky app bar.
 * Tablet   — the rail collapses to icons.
 * Mobile   — the rail is replaced by a bottom navigation bar and a drawer.
 *
 * Rendered as a client component because the sidebar, header and bottom bar all
 * depend on live socket and query state.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  // Registers this browser with the backend so it can target us over the socket.
  useDeviceRegistration();

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <MobileNav />
      <ToastNotifications />
      <AiAssistantPanel />
    </div>
  );
}
