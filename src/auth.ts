import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/password";
import { connectDb } from "@/server/db";
import { User } from "@/server/models";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        await connectDb();

        const user = await User.findOne({ email }).lean();

        // Staff only. Customers never get a password, so this route cannot
        // be used to enumerate or hijack a shopper's record.
        if (!user?.passwordHash || user.role !== "ADMIN") return null;

        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
