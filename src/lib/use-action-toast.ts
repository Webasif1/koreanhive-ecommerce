"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ToastableState = {
  ok: boolean;
  message: string | null;
};

/**
 * Fires a toast whenever a useActionState result changes. Tracks the last
 * result so a re-render does not re-toast, while still notifying when the
 * same error is produced by a second submit.
 */
export function useActionToast(state: ToastableState) {
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!state.message) {
      seen.current = null;
      return;
    }

    const key = `${state.ok}:${state.message}`;
    if (key === seen.current) return;
    seen.current = key;

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state.ok, state.message]);
}
