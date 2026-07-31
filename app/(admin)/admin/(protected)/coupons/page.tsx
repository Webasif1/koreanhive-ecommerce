import { CouponForm } from "@/components/admin/coupon-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import {
  deleteCouponAction,
  toggleCouponAction,
} from "@/server/actions/admin/coupons";
import { getAdminCoupons } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Coupons
      </h1>

      <CouponForm />

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Conditions</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No coupons yet.
                </td>
              </tr>
            )}

            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-accent/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{coupon.code}</p>
                  {coupon.description && (
                    <p className="text-xs text-muted-foreground">
                      {coupon.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {coupon.type === "PERCENTAGE"
                    ? `${coupon.value}%`
                    : formatBDT(coupon.value)}
                  {coupon.maxDiscount && (
                    <p className="text-xs text-muted-foreground">
                      max {formatBDT(coupon.maxDiscount)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {coupon.minSubtotal
                    ? `Min ${formatBDT(coupon.minSubtotal)}`
                    : "No minimum"}
                  {coupon.endsAt && (
                    <p>Ends {coupon.endsAt.toISOString().slice(0, 10)}</p>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {coupon.usedCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={coupon.isActive ? "success" : "muted"}>
                    {coupon.isActive ? "Active" : "Off"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {coupon.isActive ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    {coupon._count.orders === 0 && (
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
