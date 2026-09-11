import { Types } from "mongoose";

import { summariseReviews } from "@/lib/reviews";
import { Product, Review } from "@/server/models";

/**
 * A product's star rating, recomputed from its approved reviews.
 *
 * `Product.ratingAvg` and `ratingCount` are what every card, product page,
 * JSON-LD block and the chatbot read. They used to come from the catalogue
 * sheet — the same placeholder on all 345 products — and sat behind a feature
 * flag because of it. This is now the only thing that writes them, so a
 * star on the storefront means a delivered customer gave it.
 *
 * Recomputed from source rather than incremented: running it twice gives the
 * same answer, a missed call is fixed by the next one, and it cannot drift
 * from the Review collection. `catalogue:verify` checks that they agree.
 *
 * Arithmetic goes through `summariseReviews`, the same function behind the
 * summary panel, so a card and the panel beside it can never disagree on
 * rounding.
 *
 * No `server-only`, no connectDb (which is server-only) and no cache
 * revalidation here, because `scripts/rebuild-ratings.ts` calls this outside
 * Next. The caller opens the connection first — every server action already
 * has by the time it gets here — and server actions revalidate the "products"
 * tag themselves afterwards.
 */
export async function recomputeProductRating(
  productId: string | Types.ObjectId,
): Promise<{ ratingAvg: number; ratingCount: number }> {
  const rows = await Review.find({ productId, isApproved: true })
    .select("rating")
    .lean();

  const summary = summariseReviews(rows.map((row) => row.rating));

  const rating = {
    // 0 rather than null when unrated: the schema field is a number and every
    // reader already treats `ratingCount > 0` as "has a rating"
    ratingAvg: summary.average ?? 0,
    ratingCount: summary.count,
  };

  await Product.updateOne({ _id: productId }, { $set: rating });

  return rating;
}
