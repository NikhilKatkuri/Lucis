"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useId, useRef } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  /** Rendered when the field is empty, e.g. result counts. */
  hint?: string;
  containerClassName?: string;
}

/**
 * Material 3 search field: 56px tall, 12px radius, outline border, and a
 * primary focus ring. Clearing returns focus to the input.
 */
export function SearchBar({
  value,
  onValueChange,
  label = "Search",
  hint,
  placeholder = "Search",
  className,
  containerClassName,
  ...props
}: SearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative w-full", containerClassName)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          "h-14 rounded-field pr-24 pl-12 text-sm",
          " [&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />

      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}

        {hint ? (
          <span className="pr-1 text-xs whitespace-nowrap text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
