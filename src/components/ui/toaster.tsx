"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Square corners and the system palette — richColors is off on purpose so
 * success and error use our green and sale red rather than sonner's own.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      // Phones: clear the fixed bottom nav (56px + home indicator) instead of
      // landing on top of it. 601-1023px is handled in globals.css.
      mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-none !border !border-border !bg-white !text-ink !font-sans !shadow-[0_18px_40px_rgba(36,26,36,.12)]",
          title: "!text-[13.5px] !font-bold",
          description: "!text-[12.5px] !text-muted-foreground",
          actionButton: "!rounded-none !bg-primary !text-white !font-bold",
          cancelButton: "!rounded-none !bg-hairline !text-muted-foreground",
          success: "!border-success-border",
          error: "!border-sale-border",
        },
      }}
    />
  );
}
