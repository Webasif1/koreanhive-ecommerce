/**
 * The free-delivery line shown in the header banner, the footer and the
 * listing sidebar.
 *
 * Built from the same DeliveryZone rows checkout charges from. It used to be
 * a hardcoded "৳2500+ সারা বাংলাদেশে FREE DELIVERY", which was wrong in both
 * directions: Inside Dhaka is free from ৳2,000 (so the banner undersold it)
 * and Outside Dhaka only from ৳3,000 (so a ৳2,500 order outside Dhaka was
 * promised free delivery and then charged ৳120 at checkout). On cash on
 * delivery that mismatch is a refused parcel, not an abandoned cart.
 */

export type DeliveryPromiseZone = {
  name: string;
  charge: number;
  freeShippingThreshold: number | null;
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 2000 → "২০০০". Bangla carries the offer, per the voice rule. */
export function toBanglaDigits(value: number) {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

const BN_ZONE: Record<string, string> = {
  "Inside Dhaka": "ঢাকায়",
  "Outside Dhaka": "ঢাকার বাইরে",
};

function bnZoneName(name: string) {
  return BN_ZONE[name] ?? name;
}

export type DeliveryPromise = {
  /** Bangla, for the banner and footer. */
  bn: string;
  /** English, for anywhere the interface language applies. */
  en: string;
};

/**
 * Collapses to one sentence when every zone shares a threshold, and lists the
 * zones when they differ. Zones with no threshold never get a free-delivery
 * claim at all.
 */
export function deliveryPromise(zones: DeliveryPromiseZone[]): DeliveryPromise {
  const withThreshold = zones.filter(
    (zone): zone is DeliveryPromiseZone & { freeShippingThreshold: number } =>
      typeof zone.freeShippingThreshold === "number" &&
      zone.freeShippingThreshold > 0,
  );

  if (withThreshold.length === 0) {
    return {
      bn: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
      en: "Cash on delivery nationwide",
    };
  }

  const thresholds = [
    ...new Set(withThreshold.map((zone) => zone.freeShippingThreshold)),
  ];

  // one number for the whole country — the simple, and strongest, case
  if (thresholds.length === 1 && withThreshold.length === zones.length) {
    const amount = thresholds[0];
    return {
      bn: `৳${toBanglaDigits(amount)}+ অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি`,
      en: `Free delivery nationwide over ৳${amount.toLocaleString("en-US")}`,
    };
  }

  const bn = withThreshold
    .map(
      (zone) =>
        `${bnZoneName(zone.name)} ৳${toBanglaDigits(zone.freeShippingThreshold)}+`,
    )
    .join(" · ");

  const en = withThreshold
    .map(
      (zone) =>
        `${zone.name} over ৳${zone.freeShippingThreshold.toLocaleString("en-US")}`,
    )
    .join(" · ");

  return {
    bn: `${bn} অর্ডারে ফ্রি ডেলিভারি`,
    en: `Free delivery — ${en}`,
  };
}

/** "১–২ দিন" / "২–৪ দিন" style windows for the sidebar promo. */
export function deliveryWindowsBn(
  zones: { name: string; minDays: number; maxDays: number }[],
) {
  return zones
    .map((zone) => {
      const window =
        zone.minDays === zone.maxDays
          ? `${toBanglaDigits(zone.minDays)}`
          : `${toBanglaDigits(zone.minDays)}–${toBanglaDigits(zone.maxDays)}`;
      return `${bnZoneName(zone.name)} ${window} দিন`;
    })
    .join(" · ");
}
