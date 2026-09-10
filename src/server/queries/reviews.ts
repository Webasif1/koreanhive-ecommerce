import "server-only";

import { unstable_cache } from "next/cache";

import { normalizeBdPhone } from "@/lib/bd-districts";
import type { ReviewableItem } from "@/lib/review-state";
import {
  displayAuthorName,
  EMPTY_REVIEW_SUMMARY,
  summariseReviews,
  type ReviewSummary,
} from "@/lib/reviews";
import { connectDb } from "@/server/db";
import { normalizeOrderNumber } from "@/server/queries/order";
import { Order, Product, Review } from "@/server/models";

export type PublicReview = {
  id: string;
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  productName: string | null;
  productSlug: string | null;
};

/**
 * Only ever `{ isApproved: true }`.
 *
 * Every public read in this module goes through this constant rather than
 * spelling the filter out, because the failure mode of forgetting it is a
 * customer's unmoderated words appearing on the home page.
 */
const PUBLIC = { isApproved: true } as const;

async function siteReviewSummary(): Promise<ReviewSummary> {
  await connectDb();

  // Ratings only — the summary needs the distribution, not the prose, and
  // pulling review bodies to count stars would grow with the review table.
  const rows = await Review.find(PUBLIC).select("rating").lean();

  return summariseReviews(rows.map((row) => row.rating));
}

/** Shop-wide score for the home page block. */
export const getSiteReviewSummary = unstable_cache(
  siteReviewSummary,
  ["site-review-summary"],
  { revalidate: 300, tags: ["reviews"] },
);

async function recentReviews(take: number): Promise<PublicReview[]> {
  await connectDb();

  const reviews = await Review.find(PUBLIC)
    .sort({ createdAt: -1, _id: -1 })
    .limit(take)
    .lean();

  if (reviews.length === 0) return [];

  // One extra query for the product names rather than a populate per review.
  const products = await Product.find({
    _id: { $in: reviews.map((review) => review.productId) },
  })
    .select("name slug")
    .lean();

  const byId = new Map(
    products.map((product) => [
      product._id.toString(),
      { name: product.name, slug: product.slug },
    ]),
  );

  return reviews.map((review) => {
    const product = byId.get(review.productId.toString());

    return {
      id: review._id.toString(),
      // masked here, at the boundary, so no caller can render the full name
      authorName: displayAuthorName(review.authorName),
      city: review.city ?? null,
      rating: review.rating,
      title: review.title ?? null,
      body: review.body ?? null,
      createdAt: review.createdAt.toISOString(),
      // a review outlives the product it was left on; the words still stand
      productName: product?.name ?? null,
      productSlug: product?.slug ?? null,
    };
  });
}

export const getRecentReviews = unstable_cache(
  recentReviews,
  ["recent-reviews"],
  { revalidate: 300, tags: ["reviews"] },
);

async function productReviews(productId: string) {
  await connectDb();

  const reviews = await Review.find({ ...PUBLIC, productId })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return {
    summary: summariseReviews(reviews.map((review) => review.rating)),
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      authorName: displayAuthorName(review.authorName),
      city: review.city ?? null,
      rating: review.rating,
      title: review.title ?? null,
      body: review.body ?? null,
      createdAt: review.createdAt.toISOString(),
      productName: null,
      productSlug: null,
    })) satisfies PublicReview[],
  };
}

export const getProductReviews = unstable_cache(
  productReviews,
  ["product-reviews"],
  { revalidate: 300, tags: ["reviews"] },
);

/**
 * What this order is allowed to review.
 *
 * The gate for the whole feature. A review is only accepted for a DELIVERED
 * order whose number and phone both match and which actually contains the
 * product — which is what makes "Verified purchase" a fact rather than a
 * badge. Returning null for every failure means the caller cannot use this to
 * discover which order numbers exist.
 */
export async function getReviewableItems(
  orderNumberInput: string,
  phoneInput: string,
): Promise<{ orderId: string; customerName: string; city: string; items: ReviewableItem[] } | null> {
  const orderNumber = normalizeOrderNumber(orderNumberInput);
  const phone = normalizeBdPhone(phoneInput);

  if (!orderNumber || !phone) return null;

  await connectDb();

  const order = await Order.findOne({
    orderNumber,
    customerPhone: phone,
    status: "DELIVERED",
  }).lean();

  if (!order) return null;

  const existing = await Review.find({ orderId: order._id })
    .select("productId")
    .lean();

  const reviewed = new Set(
    existing.map((review) => review.productId.toString()),
  );

  // An order item keeps a snapshot of what was bought, but only items still
  // linked to a catalogue product can be reviewed — a review has to hang off
  // a product page to be worth anything.
  const items: ReviewableItem[] = [];
  const seen = new Set<string>();

  for (const item of order.items) {
    if (!item.productId) continue;

    const productId = item.productId.toString();
    if (seen.has(productId)) continue;
    seen.add(productId);

    items.push({
      productId,
      productName: item.productName,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl ?? null,
      reviewed: reviewed.has(productId),
    });
  }

  return {
    orderId: order._id.toString(),
    customerName: order.customerName,
    city: order.district,
    items,
  };
}

export { EMPTY_REVIEW_SUMMARY };
