"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";

import { adminButton } from "@/components/admin/admin-ui";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { emptyAdminFormState } from "@/lib/admin-state";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { useActionToast } from "@/lib/use-action-toast";
import { updateCustomerAction } from "@/server/actions/admin/customers";

export type CustomerFormValues = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  addressLine: string | null;
  area: string | null;
  district: string | null;
  postalCode: string | null;
  note: string | null;
};

const FIELD = "h-11 rounded-[10px] bg-card";

/** Submitted via startTransition, like the order form, so a validation error
 *  does not reset what was typed. */
export function CustomerForm({ customer }: { customer: CustomerFormValues }) {
  const [state, formAction, pending] = useActionState(
    updateCustomerAction,
    emptyAdminFormState,
  );
  useActionToast(state);
  const err = state.errors;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={customer.id} />

      <section className="admin-glass admin-shadow grid gap-4 rounded-2xl border p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={customer.name}
            required
            className={FIELD}
            aria-invalid={Boolean(err.name)}
          />
          <FieldError>{err.name}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={customer.phone} readOnly disabled className={FIELD} />
          <p className="text-xs text-muted-foreground">
            The phone identifies the customer and cannot be changed.
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer.email ?? ""}
            className={FIELD}
            aria-invalid={Boolean(err.email)}
          />
          <FieldError>{err.email}</FieldError>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="addressLine">Address</Label>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={customer.addressLine ?? ""}
            className={FIELD}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area">Area / thana</Label>
          <Input id="area" name="area" defaultValue={customer.area ?? ""} className={FIELD} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="district">District</Label>
          <Select
            id="district"
            name="district"
            defaultValue={customer.district ?? ""}
            className={FIELD}
            aria-invalid={Boolean(err.district)}
          >
            <option value="">—</option>
            {BD_DISTRICTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <FieldError>{err.district}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={customer.postalCode ?? ""}
            className={FIELD}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="note">Staff note</Label>
          <Textarea
            id="note"
            name="note"
            defaultValue={customer.note ?? ""}
            placeholder="Prefers evening delivery, skin type, allergies… Only staff see this."
            className="rounded-[10px] bg-card"
          />
        </div>
      </section>

      <div className="flex gap-2">
        <Link href={`/admin/customers/${customer.id}`} className={adminButton("outline")}>
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={adminButton("primary")}>
          {pending ? "Saving…" : "Save customer"}
        </button>
      </div>
    </form>
  );
}
