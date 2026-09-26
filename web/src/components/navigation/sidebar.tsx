"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/navigation/brand-mark";
import { useSocket } from "@/providers/socket.provider";
import { NAV_ITEMS } from "@/constants/navigation";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { useAlerts } from "@/hooks/use-live-data";
import { cn } from "@/lib/utils";

/**
 * Primary navigation rail. Sticky and full-height on desktop, icon-only on
 * tablet, and entirely replaced by the bottom bar on mobile.
 */
export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { activeCount } = useAlerts();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex lg:w-[260px] md:w-[76px]",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 md:justify-center md:px-2 lg:justify-start lg:px-5">
        <BrandMark className="size-9 shrink-0" />
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-bold tracking-[0.18em] text-white uppercase">
            {APP_NAME}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium tracking-[0.14em] text-sidebar-muted uppercase">
            {APP_TAGLINE}
          </p>
        </div>
      </div>

      <p className="hidden px-5 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-muted uppercase lg:block">
        Command centre
      </p>
      <p
        aria-hidden="true"
        className="mx-auto mb-2 h-px w-8 bg-sidebar-border md:block lg:hidden"
      />

      <nav
        aria-label="Main"
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4 md:px-2 lg:px-3"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/alerts" && activeCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150 ease-standard",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                "md:justify-center md:px-2 lg:justify-start",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              {isActive ? (
                <motion.span
                  aria-hidden="true"
                  layoutId="sidebar-active-rail"
                  className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sidebar-primary"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              ) : null}

              <Icon
                className="size-6 shrink-0 lg:size-5"
                weight={isActive ? "fill" : "regular"}
                aria-hidden="true"
              />

              <span className="hidden min-w-0 flex-1 truncate lg:block">
                {item.label}
              </span>

              {showBadge ? (
                <span
                  className={cn(
                    "ml-auto hidden min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[10px] font-bold text-danger-foreground tabular-nums lg:block",
                    "md:absolute md:top-1 md:right-1 md:block",
                  )}
                >
                  {activeCount > 99 ? "99+" : activeCount}
                  <span className="sr-only"> active alerts</span>
                </span>
              ) : null}

              {/* Icon-only on tablet: expose the label to assistive tech. */}
              <span className="sr-only lg:hidden">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <SidebarStatus />
    </aside>
  );
}

/** Compact simulation summary pinned to the bottom of the rail. */
function SidebarStatus() {
  const { simulation, isConnected } = useSocket();

  if (!simulation) return null;

  return (
    <div className="hidden border-t border-sidebar-border px-3 py-4 lg:block">
      <p className="text-[10px] font-semibold tracking-[0.13em] text-sidebar-muted uppercase">
        Active operation
      </p>
      <p className="mt-2 truncate text-xs font-semibold text-white">
        {simulation.scenario.replaceAll("_", " ")}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-sidebar-muted">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            isConnected ? "animate-ripple bg-success" : "bg-muted-foreground",
          )}
        />
        {isConnected ? `Tick ${simulation.tick}` : "Reconnecting"}
      </p>
    </div>
  );
}
