export type NavItem = {
  href: string;
  label: string;
};

/** Primary desktop header navigation. */
export const mainNav: NavItem[] = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/brands", label: "Brands" },
  { href: "/blog", label: "Blog" },
  { href: "/track", label: "Track Order" },
];

/** Footer link groups. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Shop",
    items: [
      { href: "/shop", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/brands", label: "Brands" },
      { href: "/shop?sort=newest", label: "New Arrivals" },
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
      { href: "/blog", label: "Beauty Journal" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];
