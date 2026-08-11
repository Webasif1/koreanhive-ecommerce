"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCouponAction, clearCouponAction } from "@/server/actions/cart";

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
              toast.success(result.message);
            })
          }
          className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
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
          className="uppercase"
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
