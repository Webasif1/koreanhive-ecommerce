import Link from "next/link";

/**
 * Sits under the filters on listing pages. Bangla carries the delivery offer,
 * per the design system's voice rule — English for interface, Bangla for
 * offers, delivery and trust.
 */
export function SidebarPromos({ brandCount }: { brandCount: number }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="border border-border bg-white p-5">
        <h3 className="font-display text-base">Browse by Korean brand</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {brandCount} brands, each with its own page and full product list.
        </p>
        <Link
          href="/brands"
          className="mt-3 inline-block border-b border-chip-border pb-1 text-[13px] font-semibold text-primary"
        >
          Open brand directory →
        </Link>
      </div>

      <div className="border border-border bg-blush p-5">
        <p lang="bn" className="text-[13px] font-bold leading-relaxed">
          ৳২৫০০+ অর্ডারে সারা বাংলাদেশে FREE DELIVERY
        </p>
        <p
          lang="bn"
          className="mt-2 text-[12px] leading-relaxed text-muted-foreground"
        >
          ঢাকায় ২৪ ঘণ্টা · ঢাকার বাইরে ২–৩ দিন · Cash on Delivery
        </p>
      </div>
    </div>
  );
}
