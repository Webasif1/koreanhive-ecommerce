import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import { hindSiliguri, manrope, prata } from "@/lib/fonts";
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
          manrope.variable,
          prata.variable,
          hindSiliguri.variable,
          "antialiased",
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
