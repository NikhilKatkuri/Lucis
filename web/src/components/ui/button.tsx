import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Material 3 button metrics: 40px default height, fully-rounded shape,
 * label-large typography, with explicit hover / active / focus-visible /
 * disabled states and a 0.98 press scale.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center border border-transparent",
    "whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-standard",
    "outline-none select-none",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/25",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        /** Filled — the primary call to action. */
        default:
          "rounded-full bg-primary text-primary-foreground shadow-elevation-1 hover:bg-primary/90",
        /** Tonal — a lower-emphasis filled alternative. */
        secondary:
          "rounded-full bg-secondary-container text-secondary-container-foreground hover:bg-secondary-container/80",
        /** Outlined — medium emphasis. */
        outline:
          "rounded-full border-outline bg-transparent text-foreground hover:bg-muted",
        /** Text — no container. */
        ghost: "rounded-full bg-transparent text-foreground hover:bg-muted",
        /** Filled tonal danger. */
        destructive:
          "rounded-full bg-danger text-danger-foreground hover:bg-danger/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-6 text-sm font-medium has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        lg: "h-11 gap-2 px-7 text-sm font-medium",
        sm: "h-8 gap-1.5 rounded-full px-4 text-sm font-medium [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 px-2.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-10 rounded-full",
        "icon-lg": "size-11 rounded-full",
        "icon-sm": "size-8 rounded-full [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
