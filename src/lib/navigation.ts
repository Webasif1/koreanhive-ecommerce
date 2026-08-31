export type NavItem = {
  href: string;
  label: string;
};

/**
 * Primary desktop header navigation, per the design's second nav row.
 *
 * Every href here must resolve against the real catalogue. "Skincare" and
 * "Makeup" used to point at /category/skincare and /category/cosmetics, which
 * were slugs from the old demo seed — the live taxonomy is one flat level of
 * twelve categories, so both had been silently serving the 404 page.
 *
 * They now point at destinations that cannot rot: the category index lists
 * whatever categories exist, and /category/makeup is a real category. Adding a
 * category to the sheet needs no change here.
 */
export const mainNav: NavItem[] = [
  { href: "/categories", label: "Skincare" },
  { href: "/category/makeup", label: "Makeup" },
  { href: "/concerns", label: "Skin Concerns" },
  { href: "/brands", label: "Korean Brands" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/blog", label: "Journal" },
];

/** Footer link groups. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Shop",
    items: [
      { href: "/shop", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/brands", label: "Brands" },
      { href: "/combos", label: "Combo Offers" },
      { href: "/deals", label: "Hot Deals" },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "/track", label: "Track Order" },
      { href: "/shipping", label: "Shipping & Delivery" },
      { href: "/returns", label: "Returns" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About Korean Hive" },
      { href: "/blog", label: "The Hive Journal" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];
