import Link from "next/link";
import { ArchiveRestore, Pencil, Trash2 } from "lucide-react";

import { adminButton } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { SubmitButton } from "@/components/admin/submit-button";
import { ORDER_ACTION_TONE, quickActionsFor } from "@/lib/admin-order-style";
import type { OrderStatusValue } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import {
  restoreOrderAction,
  trashOrderAction,
  updateOrderStatusAction,
} from "@/server/actions/admin/orders";

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-semibold transition-colors disabled:opacity-60";

/**
 * The everyday order buttons, each step in its own colour: green Confirm,
 * mulberry Start packing, blue Ship, green-outline Delivered, red Cancel,
 * grey Returned. Anything that undoes work asks first.
 */
export function OrderActions({
  orderNumber,
  status,
  deleted,
  size = "sm",
  showEdit = true,
  trashRedirect,
}: {
  orderNumber: string;
  status: OrderStatusValue;
  deleted: boolean;
  size?: "sm" | "md";
  showEdit?: boolean;
  /** send the browser back to the list after trashing (detail page) */
  trashRedirect?: boolean;
}) {
  const sizing = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  if (deleted) {
    return (
      <form action={restoreOrderAction}>
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <SubmitButton className={adminButton("info", size)} pendingLabel="Restoring…">
          <ArchiveRestore />
          Restore
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {quickActionsFor(status).map((action) => {
        const className = cn(BASE, sizing, ORDER_ACTION_TONE[action.tone]);

        // cancelling or returning puts stock back and cannot be undone — confirm it
        if (action.tone === "cancel" || action.tone === "return") {
          return (
            <ConfirmAction
              key={action.to}
              action={updateOrderStatusAction}
              fields={{ orderNumber, status: action.to }}
              trigger={action.label}
              triggerClassName={className}
              title={
                action.to === "CANCELLED"
                  ? `Cancel ${orderNumber}?`
                  : `Mark ${orderNumber} returned?`
              }
              description="The items go back into stock. This is recorded in the order history."
              confirmLabel={action.to === "CANCELLED" ? "Cancel order" : "Mark returned"}
            />
          );
        }

        return (
          <form key={action.to} action={updateOrderStatusAction}>
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <input type="hidden" name="status" value={action.to} />
            <SubmitButton className={className} pendingLabel="Saving…">
              {action.label}
            </SubmitButton>
          </form>
        );
      })}

      {showEdit && (
        <Link
          href={`/admin/orders/${orderNumber}/edit`}
          className={adminButton("outline", size)}
          title="Edit customer details"
        >
          <Pencil />
          <span className={size === "sm" ? "sr-only" : undefined}>Edit</span>
        </Link>
      )}

      <ConfirmAction
        action={trashOrderAction}
        fields={{ orderNumber, ...(trashRedirect ? { redirect: "list" } : {}) }}
        trigger={
          <>
            <Trash2 />
            <span className={size === "sm" ? "sr-only" : undefined}>Delete</span>
          </>
        }
        triggerClassName={adminButton("dangerSoft", size)}
        title={`Move ${orderNumber} to trash?`}
        description="It disappears from the order list, reports and customer tracking, and its items go back into stock. You can restore it from the Trash filter."
        confirmLabel="Move to trash"
      />
    </div>
  );
}
