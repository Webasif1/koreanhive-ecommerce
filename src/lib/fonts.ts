import { Hind_Siliguri, Manrope, Prata } from "next/font/google";

/**
 * Three typefaces, fixed roles — see the design system.
 * Prata for display, Manrope for interface, Hind Siliguri for Bangla.
 */

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const prata = Prata({
  subsets: ["latin"],
  // Prata ships a single weight
  weight: ["400"],
  variable: "--font-prata",
  display: "swap",
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "600"],
  variable: "--font-hind-siliguri",
  display: "swap",
});
