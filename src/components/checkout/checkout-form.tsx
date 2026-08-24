"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/input";
import { BD_DISTRICTS, zoneSlugForDistrict } from "@/lib/bd-districts";
import { emptyCheckoutState } from "@/lib/checkout-state";
import { formatBDT, formatDeliveryWindow } from "@/lib/format";
import { calcShipping } from "@/lib/pricing";
import { placeOrderAction } from "@/server/actions/checkout";

export type CheckoutZone = {
  id: string;
  name: string;
  slug: string;
  charge: number;
  freeShippingThreshold: number | null;
  minDays: number;
  maxDays: number;
};

function PlaceOrderButton({ total }: { total: number }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Placing order…" : `Place Order · ${formatBDT(total)}`}
    </Button>
  );
}

export function CheckoutForm({
  zones,
  subtotal,
  discount,
}: {
  zones: CheckoutZone[];
  subtotal: number;
  discount: number;
}) {
  const [state, formAction] = useActionState(
    placeOrderAction,
    emptyCheckoutState,
  );
  const [district, setDistrict] = useState("");

  // surface the server's message as a toast, not just inline text — on a
  // long form the inline error can be off-screen when it appears
  const lastMessage = useRef<string | null>(null);
  useEffect(() => {
    if (state.message && state.message !== lastMessage.current) {
      lastMessage.current = state.message;
      toast.error(state.message);
    }
    if (!state.message) lastMessage.current = null;
  }, [state.message]);

  // Display only. The server derives the zone from the district itself and
  // never reads one from this form, so nothing here can change what is
  // charged — it only decides what the shopper is shown before submitting.
  const zone = useMemo(() => {
    if (!district) return null;
    const slug = zoneSlugForDistrict(district);
    return zones.find((z) => z.slug === slug) ?? null;
  }, [district, zones]);

  const shipping = calcShipping(subtotal, zone);
  const total = subtotal - discount + shipping;

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {state.message && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {state.message}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">
            Contact
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="customerName">Full name</Label>
            <Input
              id="customerName"
              name="customerName"
              autoComplete="name"
              required
              aria-invalid={Boolean(state.errors.customerName)}
            />
            <FieldError>{state.errors.customerName}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerPhone">Mobile number</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              required
              aria-invalid={Boolean(state.errors.customerPhone)}
            />
            <FieldError>{state.errors.customerPhone}</FieldError>
            <p className="text-xs text-muted-foreground">
              We use this to confirm your order and for tracking.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerEmail">
              Email{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(state.errors.customerEmail)}
            />
            <FieldError>{state.errors.customerEmail}</FieldError>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">
            Delivery address
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="addressLine">Address</Label>
            <Textarea
              id="addressLine"
              name="addressLine"
              placeholder="House 12, Road 5, Block C"
              autoComplete="street-address"
              required
              aria-invalid={Boolean(state.errors.addressLine)}
            />
            <FieldError>{state.errors.addressLine}</FieldError>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              <Select
                id="district"
                name="district"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                aria-invalid={Boolean(state.errors.district)}
              >
                <option value="">Select district</option>
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <FieldError>{state.errors.district}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="area">Area / Thana</Label>
              <Input
                id="area"
                name="area"
                placeholder="Dhanmondi"
                required
                aria-invalid={Boolean(state.errors.area)}
              />
              <FieldError>{state.errors.area}</FieldError>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">
                Postal code{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="postalCode" name="postalCode" inputMode="numeric" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">
              Delivery note{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Landmark, preferred delivery time…"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-display text-lg font-semibold">
            Payment
          </legend>
          <label className="flex items-start gap-3 rounded-lg border border-primary bg-primary/5 p-4">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              defaultChecked
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">
                Cash on Delivery
              </span>
              <span className="block text-xs text-muted-foreground">
                Pay the courier when your parcel arrives.
              </span>
            </span>
          </label>
          <p className="text-xs text-muted-foreground">
            Online payment (SSLCommerz) is coming soon.
          </p>
        </fieldset>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-display font-semibold">Order Summary</h2>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{formatBDT(discount)}</dd>
            </div>
          )}

          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Delivery
              {zone && (
                <span className="block text-xs">
                  {zone.name} ·{" "}
                  {formatDeliveryWindow(zone.minDays, zone.maxDays)}
                </span>
              )}
            </dt>
            <dd className="tabular-nums">
              {!zone ? (
                <span className="text-muted-foreground">Select district</span>
              ) : shipping === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                formatBDT(shipping)
              )}
            </dd>
          </div>

          <div className="flex justify-between border-t pt-2 font-display text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(total)}</dd>
          </div>
        </dl>

        {zone?.freeShippingThreshold && shipping > 0 && (
          <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            Add {formatBDT(zone.freeShippingThreshold - subtotal)} more for free
            delivery.
          </p>
        )}

        <PlaceOrderButton total={total} />

        <p className="text-center text-xs text-muted-foreground">
          No account required. You will get an order number to track with.
        </p>
      </aside>
    </form>
  );
}
