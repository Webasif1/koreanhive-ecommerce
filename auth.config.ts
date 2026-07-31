import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js setup. Middleware imports only this file, so
 * nothing here may touch Prisma, node:crypto or any Node-only API — the
 * Credentials provider that does lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // carry the database id and role into the token so the admin guard can
    // check a role without a database round-trip on every request
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
      const isLoginPage = request.nextUrl.pathname === "/admin/login";

      if (!isAdminArea) return true;
      if (isLoginPage) return true;

      return auth?.user?.role === "ADMIN";
    },
  },
} satisfies NextAuthConfig;
