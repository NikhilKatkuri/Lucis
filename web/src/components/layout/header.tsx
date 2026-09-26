"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  BellIcon,
  ListIcon,
  MoonIcon,
  NavigationArrowIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { SocketStatusBadge } from "@/components/navigation/socket-status";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAlerts } from "@/hooks/use-live-data";
import { useUserLocation } from "@/hooks/use-user-location";
import { useHydrated } from "@/hooks/use-hydrated";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSocket } from "@/providers/socket.provider";
import { NAV_ITEMS, ROUTE_TITLES } from "@/constants/navigation";
import { formatLocation } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Matches the current path to a breadcrumb title. */
function useRouteTitle() {
  const pathname = usePathname();
  return ROUTE_TITLES[pathname] ?? "Lucis";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is unknown during SSR, so render a stable placeholder
  // until hydration rather than risking a mismatch.
  const hydrated = useHydrated();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {hydrated && isDark ? (
        <SunIcon className="size-4" aria-hidden="true" />
      ) : (
        <MoonIcon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

/** Sticky top app bar: breadcrumb, location, status and quick actions. */
export function Header() {
  const title = useRouteTitle();
  const { activeCount } = useAlerts();
  const { coordinates, isUsingFallback, requestPermission, status } =
    useUserLocation();
  const isOnline = useOnlineStatus();
  const { safeMessage, dismissSafeMessage } = useSocket();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="safe-top mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Mobile navigation drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <ListIcon className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <li className="hidden sm:block">Operations</li>
              <li aria-hidden="true" className="hidden sm:block">
                /
              </li>
              <li>
                <span
                  aria-current="page"
                  className="font-medium text-foreground"
                >
                  {title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <SocketStatusBadge className="hidden sm:flex" />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={requestPermission}
              disabled={status === "locating"}
              aria-label={
                coordinates
                  ? `Location: ${formatLocation(coordinates)}`
                  : "Detect my location"
              }
              title={
                isUsingFallback
                  ? "Using the default regional centre — tap to detect your location"
                  : formatLocation(coordinates ?? { latitude: 0, longitude: 0 })
              }
            >
              <NavigationArrowIcon
                className={cn(
                  "size-4",
                  isUsingFallback ? "text-muted-foreground" : "text-primary",
                  isUsingFallback && "fill-current",
                )}
                weight={isUsingFallback ? "regular" : "fill"}
                aria-hidden="true"
              />
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon-sm"
              className="relative"
              aria-label={
                activeCount > 0
                  ? `Notifications: ${activeCount} active alerts`
                  : "Notifications: no active alerts"
              }
            >
              <BellIcon className="size-4" aria-hidden="true" />
              {activeCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-background"
                />
              ) : null}
            </Button>
          </div>
        </div>

        {!isOnline ? <OfflineBanner /> : null}
      </header>

      {/* Targeted "outside the risk zone" acknowledgement from the backend. */}
      {safeMessage ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="mx-auto mt-3 flex max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8"
        >
          <div
            role="status"
            className="flex w-full items-center justify-between gap-3 rounded-card border border-success/30 bg-success-container px-4 py-3"
          >
            <p className="text-sm text-success-container-foreground">
              {safeMessage.message}
            </p>
            <Button variant="ghost" size="xs" onClick={dismissSafeMessage}>
              Dismiss
            </Button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}

/** Persistent banner shown whenever the browser reports no connectivity. */
export function OfflineBanner() {
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 border-t border-warning/30 bg-warning-container px-4 py-1.5"
    >
      <p className="text-xs font-medium text-warning-container-foreground">
        You are offline — showing the last known alerts and weather.
      </p>
    </div>
  );
}
