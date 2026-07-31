import "server-only";

import { auth } from "@/auth";

/** Every admin query and mutation calls this. Middleware already redirects
 *  unauthenticated visitors, but Server Actions are addressable endpoints in
 *  their own right — they must not rely on the middleware having run. */
export async function requireAdmin() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    throw new Error("UNAUTHORISED");
  }

  return session.user;
}
