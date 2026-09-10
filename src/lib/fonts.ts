import { Hind_Siliguri, Poppins } from "next/font/google";

/**
 * Two typefaces, split by script rather than by role.
 *
 * Poppins carries everything Latin — headings and interface alike. It
 * replaced Prata (display) and Manrope (interface); the site now reads as
 * one voice rather than a serif/sans pairing.
 *
 * Hind Siliguri stays, and is not optional. Poppins ships no Bengali
 * glyphs at all, so without it every Bangla string on the site — the
 * delivery banner, the offer copy, the FAQ answers — would fall through to
 * whatever the device happens to have. That is Nirmala UI on Windows, a
 * different face on Android, something else again on iOS, and frequently
 * a mismatched weight next to the Latin text beside it. The font stacks in
 * globals.css put Hind Siliguri directly after Poppins so the browser
 * resolves Bengali to it per glyph, whether or not the element is tagged
 * lang="bn".
 *
 * Only the four weights the codebase uses are requested: 400, 500 (54
 * uses), 600 (116) and 700 (40). Poppins is not a variable font, so each
 * weight is a separate file — asking for the two that nothing renders
 * would be two more downloads on a Bangladeshi mobile connection for
 * nothing.
 */

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "600"],
  variable: "--font-hind-siliguri",
  display: "swap",
});
