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
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/5 px-3 py-2">
        <p className="text-sm">
          Coupon <span className="font-semibold">{appliedCode}</span> applied.
        </p>
        <form action={clearCouponAction}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={applyCouponAction} className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          name="code"
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="uppercase"
        />
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
