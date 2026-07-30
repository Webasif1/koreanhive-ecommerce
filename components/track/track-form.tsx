"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { TrackedOrder } from "@/components/track/tracked-order";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { emptyTrackState } from "@/lib/track-state";
import { trackOrderAction } from "@/server/actions/track";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Looking up…" : "Track Order"}
    </Button>
  );
}

export function TrackForm({ defaultOrderNumber }: { defaultOrderNumber?: string }) {
  const [state, formAction] = useActionState(
    trackOrderAction,
    emptyTrackState,
  );

  return (
    <>
      <form action={formAction} className="mt-8 max-w-md space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            placeholder="KH-260730-QJNJ"
            defaultValue={defaultOrderNumber}
            autoComplete="off"
            required
            className="uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            required
          />
          <p className="text-xs text-muted-foreground">
            The number you gave at checkout.
          </p>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      {state.order && <TrackedOrder order={state.order} />}
    </>
  );
}
