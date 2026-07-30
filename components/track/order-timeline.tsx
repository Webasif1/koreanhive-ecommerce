import { Check, CircleDashed, XCircle } from "lucide-react";

import {
  flowIndex,
  isTerminalDetour,
  ORDER_FLOW,
  ORDER_STATUS_HINT,
  ORDER_STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/order-status";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  status: OrderStatusValue;
  note: string | null;
  createdAt: string;
};

export function OrderTimeline({
  status,
  history,
}: {
  status: OrderStatusValue;
  history: HistoryEntry[];
}) {
  // first time each status was reached, for the step timestamps
  const reachedAt = new Map<OrderStatusValue, string>();
  for (const entry of history) {
    if (!reachedAt.has(entry.status)) {
      reachedAt.set(entry.status, entry.createdAt);
    }
  }

  if (isTerminalDetour(status)) {
    const entry = history.findLast((h) => h.status === status);

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <p className="flex items-center gap-2 font-display font-semibold text-destructive">
          <XCircle className="size-5" />
          {ORDER_STATUS_LABEL[status]}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ORDER_STATUS_HINT[status]}
        </p>
        {entry?.note && <p className="mt-2 text-sm">{entry.note}</p>}
        {entry && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(entry.createdAt)}
          </p>
        )}
      </div>
    );
  }

  const currentIndex = flowIndex(status);

  return (
    <ol className="relative space-y-6 border-l pl-6">
      {ORDER_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const timestamp = reachedAt.get(step);

        return (
          <li key={step} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] grid size-6 place-items-center rounded-full border-2 bg-background",
                done && "border-success text-success",
                current && "border-primary text-primary",
                !done && !current && "border-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3.5" />
              ) : current ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : (
                <CircleDashed className="size-3.5" />
              )}
            </span>

            <p
              className={cn(
                "font-medium",
                current && "text-primary",
                !done && !current && "text-muted-foreground",
              )}
            >
              {ORDER_STATUS_LABEL[step]}
            </p>
            <p className="text-sm text-muted-foreground">
              {ORDER_STATUS_HINT[step]}
            </p>
            {timestamp && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateTime(timestamp)}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
