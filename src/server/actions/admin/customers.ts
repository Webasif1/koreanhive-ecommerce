"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import { isBdDistrict } from "@/lib/bd-districts";
import { requireAdmin } from "@/server/admin-guard";
import { syncCustomersFromOrders } from "@/server/customer-sync";
import { connectDb } from "@/server/db";
import { Customer } from "@/server/models";

const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  email: 160,
  addressLine: 300,
  area: 120,
  district: 40,
  postalCode: 10,
  note: 1000,
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim().slice(0, MAX_LENGTHS[name] ?? 200);
}

/** Phone is the customer's key and is not editable here — a different phone
 *  is a different customer, filed by their next order. */
export async function updateCustomerAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const values = {
    name: field(formData, "name"),
    email: field(formData, "email").toLowerCase(),
    addressLine: field(formData, "addressLine"),
    area: field(formData, "area"),
    district: field(formData, "district"),
    postalCode: field(formData, "postalCode"),
    note: field(formData, "note"),
  };

  const errors: Record<string, string> = {};
  if (!isValidObjectId(id)) {
    return { ok: false, message: "That customer could not be found.", errors };
  }
  if (values.name.length < 2) errors.name = "Enter the customer's name.";
  if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = "That email address does not look right.";
  }
  if (values.district && !isBdDistrict(values.district)) {
    errors.district = "Select a district.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await connectDb();

  const result = await Customer.updateOne(
    { _id: id },
    {
      $set: {
        name: values.name,
        email: values.email || null,
        addressLine: values.addressLine || null,
        area: values.area || null,
        district: values.district || null,
        postalCode: values.postalCode || null,
        note: values.note || null,
      },
    },
  );

  if (result.matchedCount === 0) {
    return { ok: false, message: "That customer could not be found.", errors: {} };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  redirect(`/admin/customers/${id}`);
}

/** Removes the customer record only. Their orders are untouched, and their
 *  next order will file them again. */
export async function deleteCustomerAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  await Customer.deleteOne({ _id: id });

  revalidatePath("/admin/customers");
  if (formData.get("redirect") === "list") redirect("/admin/customers");
}

export async function syncCustomersAction() {
  await requireAdmin();
  await connectDb();

  await syncCustomersFromOrders();

  revalidatePath("/admin/customers");
}
