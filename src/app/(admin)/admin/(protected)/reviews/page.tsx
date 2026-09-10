import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveReviewAction,
  deleteReviewAction,
  rejectReviewAction,
} from "@/server/actions/admin/reviews";
import { getAdminReviews } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reviews" };

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();
  const pending = reviews.filter((review) => !review.isApproved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing appears on the shop until you approve it. Every review here
          came from a delivered order — the form will not accept one otherwise.
        </p>
      </div>

      {pending.length > 0 && (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm">
          <strong>{pending.length}</strong>{" "}
          {pending.length === 1 ? "review is" : "reviews are"} waiting for you.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="rounded-xl border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No reviews yet. They arrive as customers submit them from
          /reviews after delivery.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{review.productName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {review.authorName}
                    {review.city ? ` · ${review.city}` : ""} ·{" "}
                    {DATE.format(new Date(review.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-star">
                    {"★".repeat(review.rating)}
                    <span className="text-hairline">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </span>
                  <Badge variant={review.isApproved ? "success" : "muted"}>
                    {review.isApproved ? "Published" : "Pending"}
                  </Badge>
                </div>
              </div>

              {review.title && (
                <p className="mt-3 text-sm font-semibold">{review.title}</p>
              )}
              {review.body && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.body}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {review.isApproved ? (
                  <form action={rejectReviewAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Unpublish
                    </Button>
                  </form>
                ) : (
                  <form action={approveReviewAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                )}

                {/* Deletion is for spam and abuse. Unpublishing keeps the row,
                    which is the right default for a review that is simply not
                    good enough to feature. */}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
