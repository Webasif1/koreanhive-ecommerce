"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import type { AdminFormState } from "@/lib/admin-state";
import { callerIp, rateLimit } from "@/server/rate-limit";

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

export async function loginAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // Keyed on IP *and* email: the IP bucket stops one host grinding through
  // passwords, the email bucket stops a distributed attempt at a single known
  // account. A real admin never trips five failures in a quarter of an hour.
  const ip = await callerIp();
  const allowed =
    rateLimit(`login:ip:${ip}`, MAX_ATTEMPTS, WINDOW_MS) &&
    rateLimit(`login:email:${email.toLowerCase()}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!allowed) {
    return {
      ok: false,
      message: "Too many sign-in attempts. Please wait 15 minutes.",
      errors: {},
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
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
