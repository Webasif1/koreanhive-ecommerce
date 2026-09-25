"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCouponAction, clearCouponAction } from "@/server/actions/cart";
import { notifyCartChanged } from "@/lib/cart-events";

export function CouponForm({
  appliedCode,
  error,
}: {
  appliedCode: string | null;
  error: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 border border-success-border bg-success-bg px-3 py-2.5">
        <p className="text-sm">
          Coupon <span className="font-bold">{appliedCode}</span> applied.
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await clearCouponAction();
              notifyCartChanged();
              toast.success(result.message);
            })
          }
          className="-my-2 -mr-2 min-h-11 px-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40 lg:my-0 lg:mr-0 lg:min-h-0 lg:px-0"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await applyCouponAction(formData);
          notifyCartChanged();

          if (result.ok) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }}
      className="space-y-1.5"
    >
      <div className="flex gap-2">
        <Input
          name="code"
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="min-w-0 uppercase"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-12 shrink-0 lg:h-11"
        >
          {isPending ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
