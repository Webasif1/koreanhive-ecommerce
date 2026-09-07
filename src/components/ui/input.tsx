import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Design system, section 06. Cream fill on a rose border; the border turns
 * mulberry once a field is focused or filled.
 *
 * Two accessibility details are load-bearing:
 *  - `text-base` below md. iOS Safari zooms the page whenever a focused input
 *    is under 16px, which threw the checkout layout around mid-form on the
 *    device most of this shop's customers use.
 *  - a focus ring, not only a border colour change. A recoloured border is a
 *    non-text contrast judgement call at best; a ring is unambiguous.
 */
const fieldBase =
  "w-full rounded-none border border-input bg-cream px-3.5 py-3 font-sans text-base text-foreground md:text-sm placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24", className)} {...props} />;
}

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-12", className)} {...props} />;
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "block text-xs font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-xs text-destructive">{children}</p>;
}

export { Input, Textarea, Select, Label, FieldError };
