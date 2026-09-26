"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/constants/navigation";
import { useAlerts } from "@/hooks/use-live-data";
import { cn } from "@/lib/utils";

/** Primary navigation for phones. The first five routes; the rest live in the drawer. */
const MOBILE_ITEMS = NAV_ITEMS.slice(0, 5);

/**
 * Mobile bottom navigation with safe-area padding. Active items use the
 * Phosphor *fill* weight; inactive items stay regular.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { activeCount } = useAlerts();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border bg-sidebar md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/alerts" && activeCount > 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[10px] font-medium",
                  "transition-colors duration-150 ease-standard",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground hover:text-white",
                )}
              >
                {isActive ? (
                  <motion.span
                    aria-hidden="true"
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-sidebar-primary"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                ) : null}

                <span className="relative">
                  <Icon
                    className="size-6"
                    weight={isActive ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  {showBadge ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1.5 min-w-4 rounded-full bg-danger px-1 text-[9px] font-bold text-danger-foreground"
                    >
                      {activeCount > 9 ? "9+" : activeCount}
                    </span>
                  ) : null}
                </span>

                {item.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
