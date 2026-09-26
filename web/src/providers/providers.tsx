"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query.provider";
import { SocketProvider } from "@/providers/socket.provider";
import { ThemeProvider } from "@/providers/theme.provider";

/**
 * Client-side provider stack.
 *
 * Order matters: theming wraps everything so tokens resolve during the first
 * paint; the socket must sit inside React Query because socket events are what
 * invalidate queries.
 */
export function Providers({
  children,
  apiBaseUrl,
}: {
  children: ReactNode;
  /** Surfaced in the UI so a misconfigured API URL is obvious. */
  apiBaseUrl: string;
}) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SocketProvider>
          <AppShellProviders apiBaseUrl={apiBaseUrl}>
            {children}
          </AppShellProviders>
        </SocketProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

function AppShellProviders({
  children,
  apiBaseUrl,
}: {
  children: ReactNode;
  apiBaseUrl: string;
}) {
  return (
    <>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster position="bottom-right" closeButton richColors />
      <span className="sr-only" data-api-base-url={apiBaseUrl} />
    </>
  );
}
