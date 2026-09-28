"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { adminButton } from "@/components/admin/admin-ui";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { emptyAdminFormState } from "@/lib/admin-state";
import { BD_DISTRICTS, zoneSlugForDistrict } from "@/lib/bd-districts";
import { formatBDT } from "@/lib/format";
import { calcShipping } from "@/lib/pricing";
import { useActionToast } from "@/lib/use-action-toast";
import {
  createAdminOrderAction,
  updateOrderDetailsAction,
} from "@/server/actions/admin/orders";

export type OrderFormCustomer = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  addressLine: string;
  area: string;
  district: string;
  postalCode: string | null;
  note: string | null;
};

type ProductOption = { value: string; label: string; price: number; stock: number };
type Zone = { slug: string; charge: number; freeShippingThreshold: number | null };

type Line = { key: number; value: string; qty: number };

const FIELD = "h-11 rounded-[10px] bg-card";

/**
 * Create a manual order (products + customer), or edit an existing order's
 * customer details. Submitted through startTransition rather than the form's
 * `action` prop: React resets a form after an action, which would wipe
 * everything staff typed whenever the server sends back a validation error.
 */
export function OrderForm(
  props:
    | { mode: "create"; products: ProductOption[]; zones: Zone[] }
    | { mode: "edit"; order: OrderFormCustomer },
) {
  const isCreate = props.mode === "create";
  const [state, formAction, pending] = useActionState(
    isCreate ? createAdminOrderAction : updateOrderDetailsAction,
    emptyAdminFormState,
  );
  useActionToast(state);

  const order = props.mode === "edit" ? props.order : null;
  const products = useMemo(
    () => (props.mode === "create" ? props.products : []),
    [props],
  );
  const zones = props.mode === "create" ? props.zones : [];

  const [district, setDistrict] = useState(order?.district ?? "Dhaka");
  const [lines, setLines] = useState<Line[]>([{ key: 1, value: "", qty: 1 }]);
  const [discount, setDiscount] = useState(0);

  const byValue = useMemo(
    () => new Map(products.map((product) => [product.value, product])),
    [products],
  );

  // an estimate for staff; the server re-prices everything on save
  const subtotal = lines.reduce(
    (sum, line) => sum + (byValue.get(line.value)?.price ?? 0) * line.qty,
    0,
  );
  const zone = zones.find((z) => z.slug === zoneSlugForDistrict(district)) ?? null;
  const shipping = subtotal > 0 ? calcShipping(subtotal, zone) : 0;
  const appliedDiscount = Math.min(Math.max(0, discount), subtotal);
  const total = subtotal - appliedDiscount + shipping;

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  const err = state.errors;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {order && <input type="hidden" name="orderNumber" value={order.orderNumber} />}

      <div className="space-y-6">
        {state.message && !state.ok && (
          <p
            role="alert"
            className="rounded-xl border border-sale-border bg-sale-bg px-4 py-3 text-sm text-sale"
          >
            {state.message}
          </p>
        )}

        {isCreate && (
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold">Products</h2>
              <button
                type="button"
                className={adminButton("outline", "sm")}
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    { key: Math.max(0, ...current.map((l) => l.key)) + 1, value: "", qty: 1 },
                  ])
                }
              >
                <Plus />
                Add product
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {lines.map((line) => {
                const picked = byValue.get(line.value);
                return (
                  <div
                    key={line.key}
                    className="grid gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-[1fr_90px_110px_auto] sm:items-center"
                  >
                    <Select
                      name="line"
                      value={line.value}
                      onChange={(event) => updateLine(line.key, { value: event.target.value })}
                      className={FIELD}
                      aria-label="Product"
                    >
                      <option value="">Choose a product…</option>
                      {products.map((product) => (
                        <option
                          key={product.value}
                          value={product.value}
                          disabled={product.stock <= 0}
                        >
                          {product.label} — {formatBDT(product.price)} ({product.stock} in stock)
                        </option>
                      ))}
                    </Select>
                    <Input
                      name="qty"
                      type="number"
                      min={1}
                      max={picked?.stock ?? 999}
                      value={line.qty}
                      onChange={(event) =>
                        updateLine(line.key, {
                          qty: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                        })
                      }
                      className={FIELD}
                      aria-label="Quantity"
                    />
                    <p className="text-right text-sm font-medium tabular-nums">
                      {picked ? formatBDT(picked.price * line.qty) : "—"}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setLines((current) =>
                          current.length === 1
                            ? [{ key: line.key + 1, value: "", qty: 1 }]
                            : current.filter((l) => l.key !== line.key),
                        )
                      }
                      className={adminButton("ghost", "sm", "justify-self-end")}
                      aria-label="Remove line"
                    >
                      <Trash2 />
                    </button>
                  </div>
                );
              })}
            </div>
            <FieldError>{err.lines}</FieldError>
          </section>
        )}

        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <h2 className="font-display font-semibold sm:col-span-2">Customer</h2>

          <div className="space-y-1.5">
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              name="customerName"
              defaultValue={order?.customerName}
              required
              className={FIELD}
              aria-invalid={Boolean(err.customerName)}
            />
            <FieldError>{err.customerName}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              placeholder="01XXXXXXXXX"
              defaultValue={order?.customerPhone}
              required
              className={FIELD}
              aria-invalid={Boolean(err.customerPhone)}
            />
            <FieldError>{err.customerPhone}</FieldError>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="customerEmail">
              Email <span className="font-normal">(optional — order emails go here)</span>
            </Label>
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              defaultValue={order?.customerEmail ?? ""}
              className={FIELD}
              aria-invalid={Boolean(err.customerEmail)}
            />
            <FieldError>{err.customerEmail}</FieldError>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addressLine">Address</Label>
            <Input
              id="addressLine"
              name="addressLine"
              placeholder="House, road, block"
              defaultValue={order?.addressLine}
              required
              className={FIELD}
              aria-invalid={Boolean(err.addressLine)}
            />
            <FieldError>{err.addressLine}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area">Area / thana</Label>
            <Input
              id="area"
              name="area"
              defaultValue={order?.area}
              required
              className={FIELD}
              aria-invalid={Boolean(err.area)}
            />
            <FieldError>{err.area}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Select
              id="district"
              name="district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className={FIELD}
              aria-invalid={Boolean(err.district)}
            >
              {BD_DISTRICTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <FieldError>{err.district}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postalCode">
              Postal code <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={order?.postalCode ?? ""}
              className={FIELD}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="note">
              Order note <span className="font-normal">(optional)</span>
            </Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={order?.note ?? ""}
              className="rounded-[10px] bg-card"
              placeholder="Delivery instructions, call before coming…"
            />
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        {isCreate ? (
          <section className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
            <h2 className="font-display font-semibold">Summary</h2>

            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount (৳)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min={0}
                value={discount || ""}
                placeholder="0"
                onChange={(event) => setDiscount(Math.floor(Number(event.target.value) || 0))}
                className={FIELD}
              />
            </div>

            <dl className="space-y-2 border-t pt-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatBDT(appliedDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">
                  {subtotal > 0 && shipping === 0 ? "Free" : formatBDT(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-display text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBDT(total)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Cash on delivery. Stock is taken out when you save, and the
              customer gets the order email if an address is given.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Items and prices are what the customer bought and cannot be changed
            here. To change them, cancel this order and create a new one.
          </section>
        )}

        <div className="flex gap-2">
          <Link
            href={order ? `/admin/orders/${order.orderNumber}` : "/admin/orders"}
            className={adminButton("outline", "md", "flex-1")}
          >
            Cancel
          </Link>
          <button type="submit" disabled={pending} className={adminButton("primary", "md", "flex-1")}>
            {pending ? "Saving…" : isCreate ? "Create order" : "Save changes"}
          </button>
        </div>
      </aside>
    </form>
  );
}
