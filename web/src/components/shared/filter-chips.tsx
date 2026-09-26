"use client";

import { FunnelIcon } from "@phosphor-icons/react";
import { useId } from "react";

import { Chip, type ChipTone } from "@/components/shared/chip";
import { cn } from "@/lib/utils";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Announced as the group label, e.g. "Filter alerts by severity". */
  label: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * A single-select chip group styled as a Material 3 filter row.
 *
 * Implemented as a radiogroup so arrow keys and screen readers behave
 * correctly, while each chip remains an ordinary focusable button.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: FilterChipsProps<T>) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <FunnelIcon
        aria-hidden="true"
        className="hidden size-4 text-muted-foreground sm:block"
      />

      {options.map((option) => {
        const isActive = option.value === value;
        const optionId = `${groupId}-${option.value}`;

        return (
          <Chip
            key={option.value}
            id={optionId}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            tone={isActive ? (option.tone ?? "primary") : "neutral"}
            variant={isActive ? "tonal" : "outline"}
            size={size}
            icon={option.icon}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                onChange(option.value);
              }
            }}
            className="cursor-pointer select-none"
          >
            {option.label}
            {option.count !== undefined ? (
              <span className="ml-0.5 tabular-nums opacity-70">
                {option.count}
              </span>
            ) : null}
          </Chip>
        );
      })}
    </div>
  );
}
