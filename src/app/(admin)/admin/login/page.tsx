import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6">
        <div className="space-y-1 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            K
          </span>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Korean Hive Admin
          </h1>
          <p className="text-sm text-muted-foreground">Staff access only.</p>
        </div>

        <LoginForm />

        <Link
          href="/"
          className="block text-center text-xs text-muted-foreground hover:text-primary"
        >
          Back to the shop
        </Link>
      </div>
    </div>
  );
}
