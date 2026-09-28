"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { adminButton, type AdminButtonTone } from "@/components/admin/admin-ui";

function ConfirmButton({
  tone,
  label,
  onDone,
}: {
  tone: AdminButtonTone;
  label: string;
  onDone: () => void;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  // close once the action has finished, so the page behind shows the result
  useEffect(() => {
    if (wasPending.current && !pending) onDone();
    wasPending.current = pending;
  }, [pending, onDone]);

  return (
    <button type="submit" className={adminButton(tone)} disabled={pending}>
      {pending ? "Working…" : label}
    </button>
  );
}

/**
 * A button that asks before it acts. Used for anything destructive — deleting
 * a product, trashing or cancelling an order — so one stray click cannot do it.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  triggerClassName,
  title,
  description,
  confirmLabel,
  tone = "danger",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  trigger: ReactNode;
  triggerClassName: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: AdminButtonTone;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => dialog.current?.showModal()}
      >
        {trigger}
      </button>

      <dialog
        ref={dialog}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-ink/40"
        // a click on the backdrop lands on the dialog element itself
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <form action={action} className="space-y-4 p-6">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <div className="mt-1.5 text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={adminButton("outline")}
              onClick={() => dialog.current?.close()}
            >
              Keep it
            </button>
            <ConfirmButton
              tone={tone}
              label={confirmLabel}
              onDone={() => dialog.current?.close()}
            />
          </div>
        </form>
      </dialog>
    </>
  );
}
