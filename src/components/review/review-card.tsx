import Link from "next/link";

import { Stars } from "@/components/review/stars";
import { Badge } from "@/components/ui/badge";
import type { PublicReview } from "@/server/queries/reviews";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * One published review.
 *
 * "Verified purchase" is unconditional because it cannot be otherwise: a
 * review only exists if submitReviewAction matched a DELIVERED order carrying
 * that product. There is no path that writes a review without one.
 *
 * The design put a photograph beside each name. Real reviewers have not given
 * us one, and filling that circle with a stock face would undo the point of
 * the whole feature, so it holds an initial instead.
 */
export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <li className="flex flex-col border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Stars value={review.rating} />
        <Badge variant="verified">Verified purchase</Badge>
      </div>

      {review.title && (
        <p className="mt-3 text-[14px] font-semibold leading-snug">
          {review.title}
        </p>
      )}

      {review.body && (
        <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">
          {review.body}
        </p>
      )}

      <div className="flex-1" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-hairline pt-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-[13px] font-semibold text-primary"
          >
            {review.authorName.slice(0, 1).toUpperCase()}
          </span>
          <span className="block">
            <span className="block text-[13.5px] font-semibold leading-snug">
              {review.authorName}
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {review.city ? `${review.city} · ` : ""}
              {DATE.format(new Date(review.createdAt))}
            </span>
          </span>
        </div>

        {review.productName && review.productSlug && (
          <Link
            href={`/product/${review.productSlug}`}
            className="text-[12px] text-primary hover:underline"
          >
            {review.productName}
          </Link>
        )}
      </div>
    </li>
  );
}
