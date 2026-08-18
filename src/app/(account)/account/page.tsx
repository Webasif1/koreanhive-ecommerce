import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <PageShell
      title="Account"
      description="Accounts are optional at Korean Hive. You can order and track without one."
      step="a later step (Auth.js phone OTP)"
    >
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href="/track">Track an order instead</Link>
        </Button>
      </div>
    </PageShell>
  );
}
