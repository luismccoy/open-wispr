import * as React from "react"

import { cn } from "../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-9 w-full min-w-0 rounded-lg px-3 py-1 text-base md:text-sm",
        "bg-[#FAFAFA] dark:bg-[var(--aws-squid-ink)]",
        "border border-[var(--color-border)]",
        "text-[var(--color-foreground)]",
        "placeholder:text-[var(--color-muted-foreground)]",
        "shadow-[inset_0_1px_3px_rgba(35,47,62,0.1)]",
        "transition-all duration-200 ease-in-out",
        "outline-none",
        // Focus styles - AWS Orange ring
        "focus:border-[var(--aws-orange)]",
        "focus:bg-white dark:focus:bg-[var(--aws-squid-ink)]",
        "focus:shadow-[0_0_0_2px_rgba(255,153,0,0.2),inset_0_1px_3px_rgba(35,47,62,0.1)]",
        "dark:focus:shadow-[0_0_0_2px_rgba(255,153,0,0.3)]",
        // File input styles
        "file:text-[var(--color-foreground)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Selection styles
        "selection:bg-[var(--aws-orange)] selection:text-[var(--color-primary-foreground)]",
        // Disabled styles
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid/error styles
        "aria-invalid:border-[var(--color-destructive)] aria-invalid:ring-[var(--color-destructive)]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
