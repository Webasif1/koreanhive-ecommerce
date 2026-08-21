import { Badge } from "@/components/ui/badge";
import type { ImportPreview } from "@/lib/import/types";

/**
 * What the import would do, row by row.
 *
 * The whole safety argument of this feature rests on an operator reading this
 * table before pressing Apply, so it leads with the errors: a wrong price is
 * only cheap to fix while it is still in a spreadsheet.
 */
export function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  const errors = preview.rows.filter((row) => row.status === "error");
  const writes = preview.rows.filter((row) => row.status !== "error");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">{preview.counts.create} new</Badge>
        <Badge>{preview.counts.update} updated</Badge>
        <Badge variant="muted">{preview.counts.unchanged} unchanged</Badge>
        {preview.counts.error > 0 && (
          // outline rather than a red fill: the design system keeps solid red
          // for discounts, so errors borrow the destructive border instead
          <Badge variant="outline" className="border-destructive text-destructive">
            {preview.counts.error} with errors
          </Badge>
        )}
      </div>

      {errors.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-destructive/40 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-destructive/5 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Row</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Problem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {errors.map((row) => (
                <tr key={`error-${row.line}`}>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{row.line}</td>
                  <td className="px-4 py-2.5">{row.name ?? row.slug ?? "—"}</td>
                  <td className="px-4 py-2.5 text-destructive">
                    {row.status === "error" ? row.errors.join("; ") : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {writes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Row</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {writes.map((row) => (
                <tr key={`write-${row.line}`} className="hover:bg-accent/40">
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{row.line}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-xs text-muted-foreground">{row.slug}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {row.status === "create" ? (
                      <Badge variant="success">New</Badge>
                    ) : row.changes.length > 0 ? (
                      <Badge>Update</Badge>
                    ) : (
                      <Badge variant="muted">No change</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.status === "update" && row.changes.length > 0
                      ? row.changes.join(", ")
                      : row.status === "create"
                        ? "creates the product"
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
