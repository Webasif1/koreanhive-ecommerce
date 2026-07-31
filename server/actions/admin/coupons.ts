"use server";

import { revalidatePath } from "next/cache";

import type { AdminFormState } from "@/lib/admin-state";
import { requireAdmin } from "@/server/admin-guard";
import { db } from "@/server/db";

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

  const clash = await db.coupon.findFirst({
    where: { code, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
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
    await db.coupon.update({ where: { id }, data });
  } else {
    await db.coupon.create({ data });
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${code} saved.`, errors: {} };
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const coupon = await db.coupon.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!coupon) return;

  await db.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });

  revalidatePath("/admin/coupons");
}

/** Orders keep couponCode as a snapshot, so deleting a coupon never
 *  rewrites what a customer was actually charged. */
export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();

  await db.coupon.delete({ where: { id: String(formData.get("id") ?? "") } });

  revalidatePath("/admin/coupons");
}
