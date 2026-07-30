import type { Metadata } from "next";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { inter, notoSansBengali, poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Korean Hive — Authentic Korean Beauty & Skincare in Bangladesh",
    template: "%s | Korean Hive",
  },
  description:
    "Shop 100% authentic Korean beauty and skincare in Bangladesh. Guest checkout, cash on delivery, fast nationwide shipping.",
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Korean Hive",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          poppins.variable,
          notoSansBengali.variable,
          "flex min-h-screen flex-col pb-14 md:pb-0",
        )}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
      </body>
    </html>
  );
}
