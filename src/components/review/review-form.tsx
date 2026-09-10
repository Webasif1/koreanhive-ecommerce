"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  emptyReviewableState,
  emptyReviewFormState,
  MAX_REVIEW_BODY,
  type ReviewableItem,
} from "@/lib/review-state";
import { productImage } from "@/lib/product-image";
import {
  findReviewableAction,
  submitReviewAction,
} from "@/server/actions/reviews";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Star picker.
 *
 * Radio inputs rather than buttons with state: a rating is one choice from
 * five, which is what a radio group is, and it arrives in the FormData without
 * any JavaScript having to put it there.
 */
function RatingInput({ name }: { name: string }) {
  const [value, setValue] = useState(0);

  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">Rating</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className="cursor-pointer text-[22px] leading-none"
          onMouseEnter={() => setValue(star)}
          onMouseLeave={() => setValue(0)}
        >
          <input
            type="radio"
            name={name}
            value={star}
            required
            className="peer sr-only"
            onChange={() => setValue(star)}
          />
          <span
            className={
              star <= value
                ? "text-star"
                : "text-hairline peer-checked:text-star"
            }
          >
            ★
          </span>
          <span className="sr-only">
            {star} {star === 1 ? "star" : "stars"}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function ProductReviewForm({
  item,
  orderNumber,
  phone,
}: {
  item: ReviewableItem;
  orderNumber: string;
  phone: string;
}) {
  const [state, formAction] = useActionState(
    submitReviewAction,
    emptyReviewFormState,
  );

  return (
    <li className="border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        {item.imageUrl && (
          <span className="relative size-14 shrink-0 border border-border bg-white">
            <Image
              src={productImage(item.imageUrl)}
              alt=""
              fill
              sizes="56px"
              className="object-contain"
            />
          </span>
        )}
        <span className="text-[14.5px] font-semibold leading-snug">
          {item.productName}
        </span>
      </div>

      {item.reviewed || state.ok ? (
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
          {state.message ??
            "You have reviewed this product. Thank you — it appears once approved."}
        </p>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          {/* Re-sent so the action can verify the order again rather than
              trusting a product id from the page. */}
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="productId" value={item.productId} />

          <div className="space-y-1.5">
            <Label>Your rating</Label>
            <RatingInput name="rating" />
            {state.errors.rating && (
              <p className="text-xs text-sale">{state.errors.rating}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`title-${item.productId}`}>
              Headline <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`title-${item.productId}`}
              name="title"
              maxLength={90}
              placeholder="Worked for my oily skin"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`body-${item.productId}`}>Your review</Label>
            <textarea
              id={`body-${item.productId}`}
              name="body"
              rows={4}
              maxLength={MAX_REVIEW_BODY}
              required
              className="w-full border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="How did it work for you? How long have you used it?"
            />
            {state.errors.body && (
              <p className="text-xs text-sale">{state.errors.body}</p>
            )}
          </div>

          {state.message && !state.ok && (
            <p className="text-[13px] text-sale">{state.message}</p>
          )}

          <Submit label="Send review" pendingLabel="Sending…" />
        </form>
      )}
    </li>
  );
}

/**
 * Order lookup, then a form per product on it.
 *
 * The same two fields as order tracking, for the same reason: no account, no
 * login, and no way to leave a review without an order that was actually
 * delivered. The pair is kept in component state so each product form can send
 * them back for re-verification.
 */
export function ReviewForm() {
  const [state, formAction] = useActionState(
    findReviewableAction,
    emptyReviewableState,
  );
  const [credentials, setCredentials] = useState({ orderNumber: "", phone: "" });

  return (
    <>
      <form
        action={formAction}
        className="mt-8 max-w-md space-y-4"
        onSubmit={(event) => {
          const data = new FormData(event.currentTarget);
          setCredentials({
            orderNumber: String(data.get("orderNumber") ?? ""),
            phone: String(data.get("phone") ?? ""),
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            placeholder="KH-260730-QJNJ"
            autoComplete="off"
            required
            className="uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            required
          />
          <p className="text-xs text-muted-foreground">
            The number you gave at checkout.
          </p>
        </div>

        {state.error && <p className="text-[13px] text-sale">{state.error}</p>}

        <Submit label="Find my order" pendingLabel="Looking up…" />
      </form>

      {state.order && (
        <div className="mt-10">
          <h2 className="font-display text-xl">
            {state.order.items.length === 1
              ? "Your product"
              : "What you ordered"}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Reviews are published under {state.order.customerName.split(" ")[0]}
            {" "}and {state.order.city}, with the surname removed.
          </p>

          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {state.order.items.map((item) => (
              <ProductReviewForm
                key={item.productId}
                item={item}
                orderNumber={credentials.orderNumber}
                phone={credentials.phone}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
