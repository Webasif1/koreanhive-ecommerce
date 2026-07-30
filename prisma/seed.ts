import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

// Seed runs outside Next.js, so it builds its own client rather than
// importing server/db.ts (which is marked server-only).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/900`;

async function main() {
  // ---------------------------------------------------------- zones
  const [insideDhaka, outsideDhaka] = await Promise.all([
    db.deliveryZone.upsert({
      where: { slug: "inside-dhaka" },
      update: {},
      create: {
        name: "Inside Dhaka",
        slug: "inside-dhaka",
        charge: 60,
        freeShippingThreshold: 2000,
        minDays: 1,
        maxDays: 2,
        position: 0,
      },
    }),
    db.deliveryZone.upsert({
      where: { slug: "outside-dhaka" },
      update: {},
      create: {
        name: "Outside Dhaka",
        slug: "outside-dhaka",
        charge: 120,
        freeShippingThreshold: 3000,
        minDays: 2,
        maxDays: 4,
        position: 1,
      },
    }),
  ]);

  // --------------------------------------------------------- brands
  const brands = await Promise.all(
    [
      {
        name: "Beauty of Joseon",
        slug: "beauty-of-joseon",
        description:
          "Hanbang skincare that blends traditional Korean herbal medicine with modern formulation.",
      },
      {
        name: "COSRX",
        slug: "cosrx",
        description:
          "Minimal ingredient lists built around one hero active per product.",
      },
      {
        name: "Anua",
        slug: "anua",
        description:
          "Gentle, barrier-first skincare centred on heartleaf and peach ingredients.",
      },
    ].map((brand) =>
      db.brand.upsert({
        where: { slug: brand.slug },
        update: {},
        create: { ...brand, logoUrl: img(`brand-${brand.slug}`) },
      }),
    ),
  );

  const brandBySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));

  // ----------------------------------------------------- categories
  const skincare = await db.category.upsert({
    where: { slug: "skincare" },
    update: {},
    create: {
      name: "Skincare",
      slug: "skincare",
      description: "Every step of the Korean skincare routine.",
      imageUrl: img("cat-skincare"),
      position: 0,
    },
  });

  const children = await Promise.all(
    [
      { name: "Cleansers", slug: "cleansers", position: 0 },
      { name: "Toners", slug: "toners", position: 1 },
      { name: "Serums & Essences", slug: "serums-essences", position: 2 },
      { name: "Sunscreen", slug: "sunscreen", position: 3 },
    ].map((child) =>
      db.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          ...child,
          parentId: skincare.id,
          imageUrl: img(`cat-${child.slug}`),
        },
      }),
    ),
  );

  const categoryBySlug = Object.fromEntries(children.map((c) => [c.slug, c]));

  // ------------------------------------------------------- products
  const products = [
    {
      name: "Relief Sun: Rice + Probiotics SPF50+ PA++++",
      slug: "relief-sun-rice-probiotics-spf50",
      brand: "beauty-of-joseon",
      category: "sunscreen",
      price: 1450,
      comparePrice: 1700,
      stock: 40,
      isFeatured: true,
      shortDescription:
        "A lightweight organic sunscreen that finishes dewy and leaves no white cast.",
      ingredients:
        "Water, Dibutyl Adipate, Glycerin, Niacinamide, Rice Extract, Probiotics Complex.",
      howToUse:
        "As the last step of your morning routine, apply evenly to face and neck. Reapply every 2 hours outdoors.",
      variants: [{ name: "50ml", stock: 40, isDefault: true }],
    },
    {
      name: "Ginseng Essence Water",
      slug: "ginseng-essence-water",
      brand: "beauty-of-joseon",
      category: "toners",
      price: 1650,
      stock: 25,
      isFeatured: true,
      shortDescription:
        "A hydrating first essence with ginseng root water for tired, dull skin.",
      ingredients: "Ginseng Root Water, Glycerin, Panthenol, Sodium Hyaluronate.",
      howToUse:
        "After cleansing, pat a small amount over the face until absorbed.",
      variants: [{ name: "150ml", stock: 25, isDefault: true }],
    },
    {
      name: "Advanced Snail 96 Mucin Power Essence",
      slug: "advanced-snail-96-mucin-power-essence",
      brand: "cosrx",
      category: "serums-essences",
      price: 1750,
      comparePrice: 2000,
      stock: 60,
      isFeatured: true,
      shortDescription:
        "96% snail secretion filtrate for repair, bounce and long-lasting hydration.",
      ingredients: "Snail Secretion Filtrate 96%, Betaine, Sodium Hyaluronate.",
      howToUse:
        "Apply to cleansed skin before heavier creams. Safe for morning and night.",
      variants: [
        { name: "100ml", stock: 45, isDefault: true },
        { name: "20ml Travel", price: 550, stock: 15 },
      ],
    },
    {
      name: "Low pH Good Morning Gel Cleanser",
      slug: "low-ph-good-morning-gel-cleanser",
      brand: "cosrx",
      category: "cleansers",
      price: 950,
      stock: 35,
      shortDescription:
        "A mildly acidic gel cleanser that respects the skin barrier.",
      ingredients: "Water, Cocamidopropyl Betaine, Tea Tree Leaf Oil, BHA.",
      howToUse:
        "Lather with water, massage over damp skin, rinse thoroughly.",
      variants: [{ name: "150ml", stock: 35, isDefault: true }],
    },
    {
      name: "Heartleaf 77% Soothing Toner",
      slug: "heartleaf-77-soothing-toner",
      brand: "anua",
      category: "toners",
      price: 1550,
      stock: 30,
      isFeatured: true,
      shortDescription:
        "77% heartleaf extract to calm redness and irritated, reactive skin.",
      ingredients: "Houttuynia Cordata Extract 77%, Panthenol, Allantoin.",
      howToUse:
        "Soak a cotton pad and sweep across the face, or pat in with clean hands.",
      variants: [{ name: "250ml", stock: 30, isDefault: true }],
    },
    {
      name: "Heartleaf Pore Control Cleansing Oil",
      slug: "heartleaf-pore-control-cleansing-oil",
      brand: "anua",
      category: "cleansers",
      price: 1850,
      stock: 20,
      shortDescription:
        "First-step cleansing oil that melts sunscreen and sebum without stripping.",
      ingredients:
        "Houttuynia Cordata Extract, Polyglyceryl-10 Oleate, Salicylic Acid.",
      howToUse:
        "Massage onto dry skin, emulsify with water, then follow with a water-based cleanser.",
      variants: [{ name: "200ml", stock: 20, isDefault: true }],
    },
  ];

  for (const p of products) {
    const { variants, brand, category, ...rest } = p;

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...rest,
        brandId: brandBySlug[brand].id,
        categoryId: categoryBySlug[category].id,
        metaTitle: `${p.name} | Korean Hive`,
        metaDescription: p.shortDescription,
      },
    });

    // images and variants are children, so only create them on first seed
    const existingImages = await db.productImage.count({
      where: { productId: product.id },
    });

    if (existingImages === 0) {
      await db.productImage.createMany({
        data: [0, 1].map((i) => ({
          productId: product.id,
          url: img(`${p.slug}-${i}`),
          alt: `${p.name} — image ${i + 1}`,
          position: i,
        })),
      });

      await db.productVariant.createMany({
        data: variants.map((v, i) => ({
          productId: product.id,
          name: v.name,
          price: "price" in v ? v.price : null,
          stock: v.stock,
          position: i,
          isDefault: "isDefault" in v ? Boolean(v.isDefault) : false,
        })),
      });
    }
  }

  // --------------------------------------------------------- coupon
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "10% off your first order, up to ৳200.",
      type: "PERCENTAGE",
      value: 10,
      minSubtotal: 1000,
      maxDiscount: 200,
    },
  });

  console.log("Seeded:");
  console.log(`  zones     ${insideDhaka.name}, ${outsideDhaka.name}`);
  console.log(`  brands    ${brands.length}`);
  console.log(`  categories ${children.length + 1}`);
  console.log(`  products  ${products.length}`);
  console.log("  coupon    WELCOME10");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
