import type { ReactNode } from "react";

import {
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
  type PaymentStatusValue,
} from "@/lib/admin-order-style";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";
import { cn } from "@/lib/utils";

/**
 * Admin-only building blocks. The storefront keeps its square 2px corners;
 * the back office uses the softer dashboard look, set explicitly here so the
 * shop's radius tokens stay untouched.
 */

const BUTTON_TONES = {
  primary: "bg-primary text-primary-foreground hover:bg-mulberry-hover",
  dark: "bg-ink text-white hover:bg-ink/90",
  outline: "border border-border bg-card text-foreground hover:bg-blush hover:text-primary",
  success: "bg-success text-white hover:bg-success/90",
  info: "bg-admin-info text-white hover:bg-admin-info/90",
  danger: "bg-sale text-white hover:bg-sale/90",
  dangerSoft:
    "border border-sale-border bg-sale-bg text-sale hover:bg-sale hover:text-white",
  ghost: "text-muted-foreground hover:bg-blush hover:text-primary",
} as const;

export type AdminButtonTone = keyof typeof BUTTON_TONES;

export function adminButton(
  tone: AdminButtonTone = "primary",
  size: "sm" | "md" = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    BUTTON_TONES[tone],
    className,
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card", className)}>{children}</section>
  );
}

function Pill({
  badge,
  dot,
  children,
  className,
}: {
  badge: string;
  dot: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
        badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatusValue;
  className?: string;
}) {
  const style = ORDER_STATUS_STYLE[status];
  return (
    <Pill badge={style.badge} dot={style.dot} className={className}>
      {ORDER_STATUS_LABEL[status]}
    </Pill>
  );
}

const PAYMENT_LABEL: Record<PaymentStatusValue, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export function PaymentBadge({
  status,
  className,
}: {
  status: PaymentStatusValue;
  className?: string;
}) {
  const style = PAYMENT_STATUS_STYLE[status];
  return (
    <Pill badge={style.badge} dot={style.dot} className={className}>
      {PAYMENT_LABEL[status]}
    </Pill>
  );
}

/** Filter chip used above the order and product tables. */
export function chipClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-ink bg-ink text-white"
      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
  );
}
