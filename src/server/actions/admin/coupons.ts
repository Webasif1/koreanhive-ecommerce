"use server";

import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Coupon } from "@/server/models";

function intOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function dateOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveCouponAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "") || null;
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "PERCENTAGE") as
    | "PERCENTAGE"
    | "FIXED";
  const value = intOrNull(formData.get("value"));

  const errors: Record<string, string> = {};
  if (code.length < 3) errors.code = "Code must be at least 3 characters.";
  if (value === null || value <= 0) errors.value = "Enter a positive value.";
  if (type === "PERCENTAGE" && value !== null && value > 100) {
    errors.value = "A percentage cannot exceed 100.";
  }

  const clash = await Coupon.findOne({
    code,
    ...(id ? { _id: { $ne: id } } : {}),
  })
    .select("_id")
    .lean();
  if (clash) errors.code = "That code already exists.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const data = {
    code,
    description: String(formData.get("description") ?? "").trim() || null,
    type,
    value: value!,
    minSubtotal: intOrNull(formData.get("minSubtotal")),
    maxDiscount: intOrNull(formData.get("maxDiscount")),
    usageLimit: intOrNull(formData.get("usageLimit")),
    startsAt: dateOrNull(formData.get("startsAt")),
    endsAt: dateOrNull(formData.get("endsAt")),
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    await Coupon.updateOne({ _id: id }, { $set: data });
  } else {
    await Coupon.create(data);
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${code} saved.`, errors: {} };
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  const coupon = await Coupon.findById(id).select("isActive").lean();
  if (!coupon) return;

  await Coupon.updateOne({ _id: id }, { $set: { isActive: !coupon.isActive } });

  revalidatePath("/admin/coupons");
}

/** Orders keep couponCode as a snapshot, so deleting a coupon never
 *  rewrites what a customer was actually charged. */
export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  await Coupon.deleteOne({ _id: id });

  revalidatePath("/admin/coupons");
}
