"use server";

import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Banner } from "@/server/models";

function dateOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveBannerAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Title is required.";
  if (!imageUrl) errors.imageUrl = "Image URL is required.";

  // next/image only loads hosts allowed in next.config.ts, so a banner
  // pointing anywhere else would render as a broken box
  if (imageUrl && !/^https:\/\//.test(imageUrl)) {
    errors.imageUrl = "Use a full https:// URL.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const position = Number(formData.get("position") ?? 0);

  const data = {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    imageUrl,
    linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
    position: Number.isFinite(position) ? Math.round(position) : 0,
    startsAt: dateOrNull(formData.get("startsAt")),
    endsAt: dateOrNull(formData.get("endsAt")),
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    await Banner.updateOne({ _id: id }, { $set: data });
  } else {
    await Banner.create(data);
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");

  return { ok: true, message: `Banner "${title}" saved.`, errors: {} };
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  const banner = await Banner.findById(id).select("isActive").lean();
  if (!banner) return;

  await Banner.updateOne({ _id: id }, { $set: { isActive: !banner.isActive } });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  await Banner.deleteOne({ _id: id });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}
