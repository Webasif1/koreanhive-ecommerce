"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { emptyAdminFormState } from "@/lib/admin-state";
import { useActionToast } from "@/lib/use-action-toast";
import { saveCouponAction } from "@/server/actions/admin/coupons";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create coupon"}
    </Button>
  );
}

export function CouponForm() {
  const [state, formAction] = useActionState(
    saveCouponAction,
    emptyAdminFormState,
  );

  useActionToast(state);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2"
    >
      <h2 className="font-display font-semibold sm:col-span-2">New coupon</h2>

      {state.message && (
        <p
          role="alert"
          className={`sm:col-span-2 rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-success/40 bg-success/5 text-success"
              : "border-destructive/40 bg-destructive/5 text-destructive"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          className="uppercase"
          placeholder="WELCOME10"
          required
          aria-invalid={Boolean(state.errors.code)}
        />
        <FieldError>{state.errors.code}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <Select id="type" name="type" defaultValue="PERCENTAGE">
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED">Fixed amount off (৳)</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          name="value"
          type="number"
          min={1}
          required
          aria-invalid={Boolean(state.errors.value)}
        />
        <FieldError>{state.errors.value}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxDiscount">Max discount (৳)</Label>
        <Input id="maxDiscount" name="maxDiscount" type="number" min={0} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minSubtotal">Minimum subtotal (৳)</Label>
        <Input id="minSubtotal" name="minSubtotal" type="number" min={0} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="usageLimit">Usage limit</Label>
        <Input id="usageLimit" name="usageLimit" type="number" min={1} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startsAt">Starts</Label>
        <Input id="startsAt" name="startsAt" type="date" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="endsAt">Ends</Label>
        <Input id="endsAt" name="endsAt" type="date" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </div>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isActive" defaultChecked />
        Active
      </label>

      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
