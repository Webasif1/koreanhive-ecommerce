"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button that disables itself while its form's action runs. */
export function SubmitButton({
  className,
  children,
  pendingLabel,
  title,
}: {
  className: string;
  children: ReactNode;
  pendingLabel?: ReactNode;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending} title={title}>
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
