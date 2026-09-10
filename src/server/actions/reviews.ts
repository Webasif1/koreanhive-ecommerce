"use server";

import { revalidateTag } from "next/cache";
import { isValidObjectId } from "mongoose";

import { isValidBdPhone } from "@/lib/bd-districts";
import {
  MAX_REVIEW_BODY,
  MIN_REVIEW_BODY,
  type ReviewableState,
  type ReviewFormState,
} from "@/lib/review-state";
import { connectDb } from "@/server/db";
import { Review } from "@/server/models";
import { getReviewableItems } from "@/server/queries/reviews";
import { callerIp, rateLimitByCaller } from "@/server/rate-limit";

const WINDOW_MS = 60_000;

/**
 * Look up what an order may review.
 *
 * Same shape and same throttle as trackOrderAction, and deliberately the same
 * vague failure message: this endpoint would otherwise be a second way to
 * probe which order numbers exist, one that also reveals delivery status.
 */
export async function findReviewableAction(
  _prev: ReviewableState,
  formData: FormData,
): Promise<ReviewableState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!orderNumber || !phone) {
    return { error: "Enter both your order number and phone number.", order: null };
  }

  if (!isValidBdPhone(phone)) {
    return { error: "Enter a valid Bangladeshi mobile number.", order: null };
  }

  const ip = await callerIp();

  if (!rateLimitByCaller("review-lookup", ip, 8, WINDOW_MS)) {
    return { error: "Too many attempts. Please wait a minute and try again.", order: null };
  }

  const order = await getReviewableItems(orderNumber, phone);

  if (!order) {
    return {
      error:
        "We could not find a delivered order with that number and phone. Reviews open once your order is delivered.",
      order: null,
    };
  }

  return { error: null, order };
}

/**
 * Write a review, pending moderation.
 *
 * The order is re-checked here rather than trusted from the form. The client
 * sends an orderId, and a hidden field is the easiest thing in the world to
 * edit — so the number and phone are verified again, and the product must
 * still be one this order actually contains. Without that, "Verified
 * purchase" would mean "the browser said so".
 */
export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const errors: Record<string, string> = {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Choose a rating from 1 to 5 stars.";
  }

  if (body.length < MIN_REVIEW_BODY) {
    errors.body = `Please write at least ${MIN_REVIEW_BODY} characters.`;
  }

  if (body.length > MAX_REVIEW_BODY) {
    errors.body = `Please keep it under ${MAX_REVIEW_BODY} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  if (!isValidObjectId(productId)) {
    return { ok: false, message: "Something went wrong. Please reload and try again.", errors: {} };
  }

  const ip = await callerIp();

  if (!rateLimitByCaller("review-submit", ip, 5, WINDOW_MS)) {
    return {
      ok: false,
      message: "Too many reviews at once. Please wait a minute.",
      errors: {},
    };
  }

  // re-verified server side, not taken from the form
  const order = await getReviewableItems(orderNumber, phone);

  if (!order) {
    return {
      ok: false,
      message: "We could not verify that order. Reviews open once it is delivered.",
      errors: {},
    };
  }

  const item = order.items.find((entry) => entry.productId === productId);

  if (!item) {
    return {
      ok: false,
      message: "That product is not on this order.",
      errors: {},
    };
  }

  if (item.reviewed) {
    return {
      ok: false,
      message: "You have already reviewed this product on this order.",
      errors: {},
    };
  }

  await connectDb();

  try {
    await Review.create({
      productId,
      orderId: order.orderId,
      authorName: order.customerName,
      // from the order, never from the form — see the model's note
      city: order.city,
      rating,
      title: title || null,
      body,
      isApproved: false,
    });
  } catch {
    // the unique (orderId, productId) index is the real guard; the check
    // above only makes the common case a friendly message rather than a race
    return {
      ok: false,
      message: "You have already reviewed this product on this order.",
      errors: {},
    };
  }

  // nothing public changed yet — it is pending — but the admin queue counts
  revalidateTag("reviews", "max");

  return {
    ok: true,
    message:
      "Thank you. Your review has been sent for checking and will appear once approved.",
    errors: {},
  };
}
