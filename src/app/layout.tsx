import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Toaster } from "@/components/ui/toaster";
import { hindSiliguri, poppins } from "@/lib/fonts";
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
  // Google Search Console ownership check
  verification: { google: "yotugleZDgNxkag75qQVa6FGm9uEecjTLfTh0vxkHU4" },
  // Meta domain verification (Business portfolio → Brand safety → Domains)
  other: {
    "facebook-domain-verification": "l4txv5xvcxu5tb8e8vm5ddo09t07de",
  },
};

/** viewport-fit=cover is what makes env(safe-area-inset-*) non-zero on
 *  iPhones, which the bottom nav, chat button and toasts rely on to clear the
 *  home indicator. No maximum-scale: shoppers must still be able to zoom. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Every product image is served from ImageKit, and the first of them
            is the LCP element on most pages. Opening the TLS connection while
            the HTML is still parsing takes the handshake off the critical
            path — worth ~100-300ms on a Bangladeshi mobile connection. */}
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        {/* Create the dataLayer before GTM loads so early pushes aren't lost */}
        <Script id="gtm-datalayer" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];`}
        </Script>
        {/* Google Tag Manager */}
        {/* lazyOnload: GTM (and the GA4 + Meta tags inside it) waits for the
            page to finish loading instead of competing with hydration on a
            phone. Nothing is lost — every event is queued in the dataLayer
            above, and GTM replays the queue when it starts. */}
        <Script id="gtm" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TVQKLMGJ');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body
        className={cn(
          poppins.variable,
          hindSiliguri.variable,
          "antialiased",
        )}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TVQKLMGJ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
