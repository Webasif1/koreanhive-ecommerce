import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms you agree to when ordering from Korean Hive — pricing in BDT, cash on delivery, order acceptance and refusal of delivery.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms &amp; Conditions</h1>
      <p>
        These terms apply to every order placed with Korean Hive. Placing an
        order means you accept them.
      </p>

      <h2>Ordering</h2>
      <p>
        No account is needed. You place an order as a guest with your name,
        mobile number and delivery address. Please give a number you can be
        reached on — we call to confirm every order before it is dispatched.
      </p>
      <p>
        Submitting the checkout form is an offer to buy, not a completed
        contract. The order is accepted when we confirm it by phone. Until
        then we may decline it — most often because an item has just sold out,
        the address is outside our delivery range, or we cannot reach you.
      </p>

      <h2>Prices and payment</h2>
      <p>
        All prices are in Bangladeshi Taka and include any applicable taxes.
        Delivery is charged separately and is calculated at checkout from your
        district; the amount shown on the checkout page before you place the
        order is the amount you pay.
      </p>
      <p>
        Payment is cash on delivery. You pay the courier the full order total
        when the parcel reaches you. We do not take card, bKash or Nagad
        payments at this time, and we will never ask you for a PIN or an OTP.
      </p>
      <p>
        We try to keep prices and stock accurate. If a product is listed at a
        clearly incorrect price, or is unavailable after you order, we will
        contact you and you may cancel rather than proceed.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery charges and timelines are set out on our{" "}
        <Link href="/shipping">Shipping &amp; Delivery</Link> page. Timelines
        are estimates from the day we dispatch, and can be affected by weather,
        holidays and courier delays.
      </p>
      <p>
        Someone must be available at the address to receive the parcel and pay
        the courier. If nobody is reachable, the courier will normally attempt
        delivery again before returning the parcel to us.
      </p>

      <h2>Refusing delivery</h2>
      <p>
        You may inspect the outside of the parcel before paying. If it is
        visibly damaged or is clearly not what you ordered, you may refuse it
        and pay nothing.
      </p>
      <p>
        Refusing a correct, undamaged order without contacting us first means
        we carry the delivery and return cost. We may decline to serve an
        address with repeated unexplained refusals.
      </p>

      <h2>Returns</h2>
      <p>
        Our <Link href="/returns">Returns &amp; Refunds</Link> policy forms part
        of these terms.
      </p>

      <h2>Product information</h2>
      <p>
        Every product is imported from Korea and sold sealed. Ingredient lists,
        sizes and usage notes come from the manufacturer. Colours can look
        different between screens.
      </p>
      <p>
        Nothing on this site — including anything the shop assistant says — is
        medical advice, and no product is offered as a treatment or cure for
        any condition. If you have a skin condition, are pregnant or
        breastfeeding, or are using prescribed treatment, speak to a doctor or
        dermatologist first. Patch test anything new.
      </p>

      <h2>Your account with us</h2>
      <p>
        You agree not to interfere with the site, attempt to access data that
        is not yours, or place orders you do not intend to accept. We may
        cancel orders and refuse service where we reasonably believe this is
        happening.
      </p>

      <h2>Liability</h2>
      <p>
        We are responsible for delivering the products you ordered in the
        condition described. We are not responsible for a reaction to a product
        used contrary to its instructions, or for delays outside our control.
        Nothing here limits any right you have under Bangladeshi consumer law.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of Bangladesh, and the courts of
        Bangladesh have jurisdiction over any dispute arising from them.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version published here when you place an
        order is the version that applies to it.
      </p>
    </>
  );
}
