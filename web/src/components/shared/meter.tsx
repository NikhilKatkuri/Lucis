import { cn } from "@/lib/utils";

/**
 * Static width utilities so Tailwind's scanner can emit them. Values outside the
 * list clamp to the nearest step, which is imperceptible at 5% granularity.
 */
const WIDTH_CLASSES = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-1/2",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

export type MeterTone = "primary" | "success" | "warning" | "danger" | "neutral";

const FILL_TONE: Record<MeterTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

/**
 * Resolve a 0..1 fraction to a static width class. Avoids inline styles, which
 * the project forbids, while staying within 2.5% of the true value.
 */
export function widthClassFor(fraction: number): string {
  if (!Number.isFinite(fraction)) return WIDTH_CLASSES[0];

  const clamped = Math.min(1, Math.max(0, fraction));
  const index = Math.round(clamped * (WIDTH_CLASSES.length - 1));

  return WIDTH_CLASSES[index];
}

export interface MeterProps extends React.ComponentProps<"div"> {
  /** 0..1 */
  value: number;
  tone?: MeterTone;
  label?: string;
  size?: "sm" | "md";
  /** Hide the numeric readout next to the bar. */
  hideValue?: boolean;
  valueClassName?: string;
}

/**
 * A thin determinate progress bar used for confidence, risk and utilisation
 * readouts. The value is exposed to assistive tech via `role="progressbar"`.
 */
export function Meter({
  value,
  tone = "primary",
  label,
  size = "sm",
  hideValue = false,
  valueClassName,
  className,
  ...props
}: MeterProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {!hideValue ? (
        <span
          className={cn(
            "w-9 shrink-0 text-xs font-medium text-muted-foreground tabular-nums",
            valueClassName,
          )}
        >
          {percent}%
        </span>
      ) : null}

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-standard",
            FILL_TONE[tone],
            widthClassFor(value),
          )}
        />
      </div>
    </div>
  );
}
