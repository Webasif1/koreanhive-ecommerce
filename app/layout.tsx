import type { Metadata } from "next";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { inter, notoSansBengali, poppins } from "@/lib/fonts";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Korean Hive — Authentic Korean Beauty & Skincare in Bangladesh",
    template: "%s | Korean Hive",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // no canonical here on purpose: metadata is inherited, so a canonical set
  // on the root layout would point every page that omits one at "/"
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: "Korean Hive — Authentic Korean Beauty & Skincare in Bangladesh",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Korean Hive — Authentic Korean Beauty & Skincare in Bangladesh",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
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
        {/* site-wide entities; page-level graphs reference these by @id */}
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />

        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
      </body>
    </html>
  );
}
