import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korean Hive — Authentic Korean Beauty & Skincare in Bangladesh",
  description:
    "Premium Korean beauty and skincare products delivered across Bangladesh. Guest checkout, cash on delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
