import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next 16 renamed the middleware convention to proxy.
// Edge-safe: authConfig has no providers and never touches Prisma. The admin
// layout re-checks the role server-side, so this is a fast redirect rather
// than the only line of defence.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
