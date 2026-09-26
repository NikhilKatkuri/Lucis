import { ShieldCheckIcon } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/**
 * Lucis shield mark. Uses the SSR icon build so it can render inside Server
 * Components without pulling the whole icon set into the client bundle.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-xl border border-sidebar-primary/40 bg-sidebar-accent text-sidebar-primary",
        className,
      )}
      aria-hidden="true"
    >
      <ShieldCheckIcon className="size-5" weight="fill" />
    </span>
  );
}
