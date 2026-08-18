import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Design system, section 04. Red appears exclusively on savings and
 * discounts, green only on stock and verification.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-none font-sans font-bold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        sale: "bg-sale text-white",
        saleSoft: "bg-sale-bg text-sale",
        ink: "bg-ink text-white uppercase tracking-[0.08em] font-semibold",
        verified:
          "bg-success-bg text-success uppercase tracking-[0.04em] text-[10.5px]",
        secondary: "bg-blush text-primary",
        outline: "border border-border text-foreground font-semibold",
        muted: "bg-hairline text-faint font-semibold",
        success: "bg-success text-success-foreground",
      },
      size: {
        default: "px-2.5 py-1 text-[11px]",
        sm: "px-2 py-0.5 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
