import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The confirmation anyone sees on /success. Deliberately carries no order
 * data: order numbers are guessable, so the details (name, phone, address)
 * only render for the browser that just placed the order.
 */
export function SuccessMessage() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
      <CheckCircle2 className="size-12 text-success" />
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Thank you! Your order has been placed successfully
      </h1>
      <p className="max-w-md text-muted-foreground">
        We will call you to confirm before dispatch. Use your order number and
        phone number to track it.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/track">Track Your Order</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
