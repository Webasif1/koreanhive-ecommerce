import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Design system, section 03. One primary action per screen area, square
 * corners throughout, 44px minimum touch height on mobile.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // mulberry carries every primary action
        default:
          "bg-primary font-bold text-primary-foreground hover:bg-mulberry-hover disabled:bg-hairline disabled:text-faint",
        // ink is reserved for Buy Now
        dark: "bg-ink font-bold text-white hover:bg-ink/90 disabled:bg-hairline disabled:text-faint",
        outline:
          "border border-ink bg-white font-semibold text-ink hover:bg-blush",
        // outlined mulberry, used for the small Add on bundle rows
        accent:
          "border border-primary bg-white font-bold text-primary hover:bg-blush",
        chip: "border border-chip-border bg-blush font-semibold text-primary hover:border-primary",
        ghost: "font-semibold hover:bg-blush hover:text-primary",
        destructive:
          "bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-success font-bold text-success-foreground hover:bg-success/90",
        link: "font-semibold text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-[54px] px-8 text-[14.5px]",
        chip: "h-9 px-4 text-xs",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
