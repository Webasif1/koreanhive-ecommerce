"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { emptyAdminFormState } from "@/lib/admin-state";
import { useActionToast } from "@/lib/use-action-toast";
import { saveBannerAction } from "@/server/actions/admin/banners";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Add banner"}
    </Button>
  );
}

export function BannerForm() {
  const [state, formAction] = useActionState(
    saveBannerAction,
    emptyAdminFormState,
  );

  useActionToast(state);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2"
    >
      <h2 className="font-display font-semibold sm:col-span-2">New banner</h2>

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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          aria-invalid={Boolean(state.errors.title)}
        />
        <FieldError>{state.errors.title}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input id="subtitle" name="subtitle" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://…"
          required
          aria-invalid={Boolean(state.errors.imageUrl)}
        />
        <FieldError>{state.errors.imageUrl}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkUrl">Link</Label>
        <Input id="linkUrl" name="linkUrl" placeholder="/shop" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ctaLabel">Button label</Label>
        <Input id="ctaLabel" name="ctaLabel" placeholder="Shop now" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="position">Position</Label>
        <Input id="position" name="position" type="number" defaultValue={0} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startsAt">Starts</Label>
        <Input id="startsAt" name="startsAt" type="date" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="endsAt">Ends</Label>
        <Input id="endsAt" name="endsAt" type="date" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked />
        Active
      </label>

      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
