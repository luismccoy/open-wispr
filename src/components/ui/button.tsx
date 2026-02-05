import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-orange)]/40 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: AWS Orange background - main call-to-action
        default:
          "bg-[var(--aws-orange)] text-[var(--aws-squid-ink)] font-semibold shadow-sm hover:bg-[var(--aws-orange-dark)] hover:shadow-md active:bg-[var(--aws-orange-dark)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--aws-orange)]/40 focus:ring-offset-2",
        // Destructive: AWS Red for dangerous actions
        destructive:
          "bg-[var(--aws-red)] text-white shadow-sm hover:bg-[#B42912] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--aws-red)]/40 focus:ring-offset-2",
        // Outline: AWS Squid Ink border - secondary actions
        outline:
          "border-2 border-[var(--aws-squid-ink)] bg-transparent text-[var(--aws-squid-ink)] shadow-sm hover:bg-[var(--aws-squid-ink)] hover:text-white hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--aws-orange)]/40 focus:ring-offset-2 dark:border-[var(--aws-squid-ink-light)] dark:text-[var(--color-foreground)] dark:hover:bg-[var(--aws-squid-ink-light)]",
        // Secondary: Subtle background with AWS styling
        secondary:
          "bg-[var(--color-secondary)] text-[var(--aws-squid-ink)] shadow-sm hover:bg-[var(--color-border)] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--aws-orange)]/40 focus:ring-offset-2 dark:text-[var(--color-foreground)]",
        // Ghost: Minimal styling for tertiary actions
        ghost:
          "text-[var(--aws-squid-ink)] hover:bg-[var(--color-muted)] hover:text-[var(--aws-squid-ink)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--aws-orange)]/40 focus:ring-offset-2 dark:text-[var(--color-foreground)] dark:hover:bg-[var(--color-muted)]",
        // Link: AWS Blue for inline links
        link: "text-[var(--color-link)] underline-offset-4 hover:text-[var(--aws-orange)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--aws-orange)]/40 focus:ring-offset-2",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
