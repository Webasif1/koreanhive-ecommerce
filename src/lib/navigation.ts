export type NavItem = {
  href: string;
  label: string;
};

/**
 * Primary desktop header navigation, per the design's second nav row.
 *
 * Skincare and Makeup point at parent categories, which the catalogue sync
 * creates and hangs the sheet's leaf categories off. getCategoryScope resolves
 * a category plus its direct children, so these return every product in the
 * group rather than an empty page.
 */
export const mainNav: NavItem[] = [
  { href: "/category/skincare", label: "Skincare" },
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
