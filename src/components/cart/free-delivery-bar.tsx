import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Design system, section 06. Bangla carries the offer, because delivery cost
 * is one of the two places a customer reads carefully.
 *
 * Threshold comes from DeliveryZone.freeShippingThreshold and is measured
 * against the pre-discount subtotal — the same rule lib/pricing.ts applies
 * when it actually charges for delivery.
 */
export function FreeDeliveryBar({
  subtotal,
  threshold,
  className,
}: {
  subtotal: number;
  threshold: number | null;
  className?: string;
}) {
  if (!threshold) return null;

  const achieved = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  if (achieved) {
    return (
      <div
        className={cn(
          "border border-success-border bg-success-bg p-4",
          className,
        )}
      >
        <p lang="bn" className="text-[13px] font-bold text-success">
          🎉 আপনি FREE DELIVERY পেয়ে গেছেন!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border border-border bg-blush p-4", className)}>
      <p lang="bn" className="text-[13px] font-bold">
        আর মাত্র {formatBDT(remaining)} অর্ডার করলেই FREE DELIVERY
      </p>
      <div
        className="mt-2.5 h-[7px] bg-white"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <span
          className="block h-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
