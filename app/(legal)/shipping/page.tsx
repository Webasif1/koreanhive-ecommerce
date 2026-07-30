import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Delivery charges and timelines for Inside Dhaka and Outside Dhaka, with cash on delivery available nationwide.",
};

export default function ShippingPage() {
  return (
    <>
      <h1>Shipping &amp; Delivery</h1>
      <h2>Inside Dhaka</h2>
      <p>Delivered in 1–2 working days. Charge set per delivery zone.</p>
      <h2>Outside Dhaka</h2>
      <p>Delivered in 2–4 working days. Charge set per delivery zone.</p>
      <p>
        Live rates come from the DeliveryZone table once Step 4 lands; the
        numbers above are indicative only.
      </p>
    </>
  );
}
