"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import type { AdminFormState } from "@/lib/admin-state";

export async function loginAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (error) {
    // signIn throws a redirect on success — let that through
    if (error instanceof AuthError) {
      return {
        ok: false,
        // one message for both cases: never reveal whether the account exists
        message: "Wrong email or password.",
        errors: {},
      };
    }
    throw error;
  }

  return { ok: true, message: null, errors: {} };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
