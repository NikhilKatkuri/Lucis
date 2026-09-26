"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Mobile bottom sheet with a drag indicator.
 *
 * Built on Framer Motion rather than a dialog primitive so it can sit above
 * content without trapping focus — these are peek panels, not modal flows.
 */
export function BottomSheet({
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      initial={reduceMotion ? false : { y: "100%" }}
      animate={{ y: 0 }}
      exit={reduceMotion ? undefined : { y: "100%" }}
      transition={{ duration: 0.25, ease: [0.05, 0.7, 0.1, 1] }}
      className={cn(
        "safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg",
        "rounded-t-sheet border-t border-border bg-surface shadow-elevation-5",
        className,
      )}
    >
      {/* Drag indicator */}
      <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
        <span className="h-1 w-10 rounded-full bg-outline" />
      </div>

      <header className="px-5 pt-1 pb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <div className="scrollbar-slim max-h-[65dvh] overflow-y-auto px-5 pb-6">
        {children}
      </div>

      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="Close"
        tabIndex={-1}
      />
    </motion.div>
  );
}
