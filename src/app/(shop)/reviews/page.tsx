import type { Metadata } from "next";

import { ReviewCard } from "@/components/review/review-card";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewSummaryPanel } from "@/components/review/review-summary";
import { getRecentReviews, getSiteReviewSummary } from "@/server/queries/reviews";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Reviews from Korean Hive customers across Bangladesh. Every review comes from a delivered order.",
  alternates: { canonical: "/reviews" },
};

export const revalidate = 300;

export default async function ReviewsPage() {
  const [summary, reviews] = await Promise.all([
    getSiteReviewSummary(),
    getRecentReviews(60),
  ]);

  return (
    <div className="container-page py-10 md:py-14">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl tracking-tight">
          Customer Reviews
        </h1>
        <p className="text-muted-foreground">
          Every review here comes from an order we delivered. There is no way to
          leave one without a delivered order number, which is why each carries
          a verified badge.
        </p>
      </header>

      {reviews.length > 0 ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
          <ReviewSummaryPanel
            summary={summary}
            heading="Overall rating"
            className="h-fit border border-border bg-card p-6"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        </div>
      ) : (
        /* An honest empty state. The alternative — a page of invented
           testimonials — is the thing this whole feature exists to avoid. */
        <p className="mt-10 border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No reviews published yet. If you have received an order, yours can be
          the first.
        </p>
      )}

      <section className="mt-16 border-t border-border pt-10">
        <p className="eyebrow">Leave a review</p>
        <h2 className="mt-3 font-display text-[26px] tracking-[-0.01em]">
          Received your order? Tell the next shopper.
        </h2>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
          Enter your order number and the phone number you used at checkout. No
          account, no login — the same two details as order tracking.
        </p>

        <ReviewForm />
      </section>
    </div>
  );
}
