"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { ImportPreviewTable } from "@/components/admin/import-preview";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { emptyImportState } from "@/lib/import/types";
import { useActionToast } from "@/lib/use-action-toast";
import { importAction } from "@/server/actions/admin/import";

const SHEET_URL_KEY = "kh:import:sheet-url";

function Buttons({ canApply }: { canApply: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" name="intent" value="preview" variant="outline" disabled={pending}>
        {pending ? "Reading…" : "Preview changes"}
      </Button>

      <Button type="submit" name="intent" value="apply" disabled={pending || !canApply}>
        Apply to catalogue
      </Button>

      {!canApply && (
        <p className="text-xs text-muted-foreground">
          Preview first — nothing is written until you apply.
        </p>
      )}
    </div>
  );
}

/**
 * Import screen.
 *
 * One form, two submit buttons. The file stays in the input between preview
 * and apply, so applying re-submits the same bytes and the server re-decides
 * from the file rather than trusting a payload it handed out earlier.
 */
export function ImportForm() {
  const [state, formAction] = useActionState(importAction, emptyImportState);
  const sheetRef = useRef<HTMLInputElement>(null);

  useActionToast(state);

  // The remembered sheet URL is one operator's convenience, not shop
  // configuration, so it lives in the browser rather than earning a
  // collection. The input stays uncontrolled and the effect writes to the DOM
  // — restoring it through React state would mean a setState on mount, and a
  // cascading render for a value that never changes after it lands.
  useEffect(() => {
    const remembered = window.localStorage.getItem(SHEET_URL_KEY);
    if (remembered && sheetRef.current) sheetRef.current.value = remembered;
  }, []);

  const canApply = (state.preview?.counts.create ?? 0) + (state.preview?.counts.update ?? 0) > 0;

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-6 rounded-xl border bg-card p-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="file">CSV or JSON file</Label>
          <Input id="file" name="file" type="file" accept=".csv,.json,text/csv,application/json" />
          <p className="text-xs text-muted-foreground">
            One row per product. Only the columns present are changed, so a sheet of just
            <code className="mx-1">slug,price</code> updates prices and leaves everything else
            alone.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sheetUrl">…or a Google Sheets link</Label>
          <Input
            ref={sheetRef}
            id="sheetUrl"
            name="sheetUrl"
            onChange={(event) =>
              window.localStorage.setItem(SHEET_URL_KEY, event.target.value)
            }
            placeholder="https://docs.google.com/spreadsheets/d/…"
          />
          <p className="text-xs text-muted-foreground">
            Share the sheet as “Anyone with the link can view”. A link takes priority over a
            chosen file.
          </p>
        </div>
      </div>

      <Buttons canApply={canApply} />

      {state.message && (
        <p className={state.ok ? "text-sm" : "text-sm text-destructive"}>{state.message}</p>
      )}

      {state.preview && <ImportPreviewTable preview={state.preview} />}
    </form>
  );
}
