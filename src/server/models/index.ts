// No "server-only" here on purpose: the seed and admin scripts import these
// schemas from plain Node, where that guard throws. server/db.ts keeps it.
import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Money is stored as a whole-taka integer everywhere, as it was under
 * Postgres. BDT retail does not price in poisha.
 *
 * Documents that are always read together are embedded rather than
 * referenced: product images and variants live inside Product, order items
 * and status history inside Order. That removes four collections and the
 * joins that went with them.
 */

const money = { type: Number, required: true, min: 0 };
const optionalMoney = { type: Number, default: null, min: 0 };

// ------------------------------------------------------------ people

export type UserDoc = {
  _id: Types.ObjectId;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN";
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, default: null },
    // sparse so many guest records can share a missing email
    email: { type: String, unique: true, sparse: true, lowercase: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    phone: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" },
    /** scrypt hash, "salt:key" hex. Staff only — customers stay guest-first. */
    passwordHash: { type: String, default: null },
  },
  { timestamps: true },
);

export type AddressDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label?: string | null;
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  district: string;
  postalCode?: string | null;
  isDefault: boolean;
  deliveryZoneId?: Types.ObjectId | null;
};

const addressSchema = new Schema<AddressDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: null },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    area: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String, default: null },
    isDefault: { type: Boolean, default: false },
    deliveryZoneId: { type: Schema.Types.ObjectId, ref: "DeliveryZone", default: null },
  },
  { timestamps: true },
);

// ----------------------------------------------------------- catalog

export type BrandDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  countryOfOrigin?: string | null;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const brandSchema = new Schema<BrandDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    countryOfOrigin: { type: String, default: "South Korea" },
    isActive: { type: Boolean, default: true },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
  },
  { timestamps: true },
);

export type CategoryDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  position: number;
  isActive: boolean;
  parentId?: Types.ObjectId | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // self-reference: Skincare > Cleansers > Oil Cleansers
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
  },
  { timestamps: true },
);

export type ProductImageSub = {
  _id: Types.ObjectId;
  url: string;
  alt?: string | null;
  position: number;
};

const productImageSchema = new Schema<ProductImageSub>({
  url: { type: String, required: true },
  alt: { type: String, default: null },
  position: { type: Number, default: 0 },
});

export type ProductVariantSub = {
  _id: Types.ObjectId;
  name: string;
  sku?: string | null;
  /** overrides the product price when set */
  price?: number | null;
  stock: number;
  position: number;
  isDefault: boolean;
};

const productVariantSchema = new Schema<ProductVariantSub>({
  name: { type: String, required: true },
  sku: { type: String, default: null },
  price: { type: Number, default: null, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  position: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
});

export type ProductDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  ingredients?: string | null;
  howToUse?: string | null;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  brandId?: Types.ObjectId | null;
  categoryId?: Types.ObjectId | null;
  images: ProductImageSub[];
  variants: ProductVariantSub[];
  concerns: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const productSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    ingredients: { type: String, default: null },
    howToUse: { type: String, default: null },
    price: money,
    comparePrice: optionalMoney,
    sku: { type: String, default: null },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    /** denormalised review aggregates, refreshed when a review is approved */
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: null, index: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    images: { type: [productImageSchema], default: [] },
    variants: { type: [productVariantSchema], default: [] },
    /**
     * Taxonomy concerns this product targets, imported from the sheet's
     * "Skin Concerns Targeted" column. Drives the chat advisor's
     * recommendations — see data/chatbot/concern-map.ts for the mapping.
     */
    concerns: { type: [String], default: [] },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
// the advisor's main query: active products targeting a given concern
productSchema.index({ isActive: 1, concerns: 1 });

// ---------------------------------------------------------- commerce

export type DeliveryZoneDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  charge: number;
  freeShippingThreshold?: number | null;
  minDays: number;
  maxDays: number;
  position: number;
  isActive: boolean;
};

const deliveryZoneSchema = new Schema<DeliveryZoneDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    charge: money,
    /** subtotal above which delivery is free; null = never free */
    freeShippingThreshold: optionalMoney,
    minDays: { type: Number, default: 1 },
    maxDays: { type: Number, default: 3 },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CouponDoc = {
  _id: Types.ObjectId;
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const couponSchema = new Schema<CouponDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: null },
    type: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    /** PERCENTAGE: 0-100. FIXED: whole BDT off. */
    value: { type: Number, required: true, min: 0 },
    minSubtotal: optionalMoney,
    maxDiscount: optionalMoney,
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type OrderItemSub = {
  _id: Types.ObjectId;
  productId?: Types.ObjectId | null;
  variantId?: Types.ObjectId | null;
  productName: string;
  productSlug: string;
  variantName?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

// The snapshot fields are what the customer actually bought and must never
// change, even if the catalogue entry is edited or removed later.
const orderItemSchema = new Schema<OrderItemSub>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
  variantId: { type: Schema.Types.ObjectId, default: null },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  variantName: { type: String, default: null },
  imageUrl: { type: String, default: null },
  unitPrice: money,
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: money,
});

export type OrderStatusHistorySub = {
  _id: Types.ObjectId;
  status: OrderStatus;
  note?: string | null;
  createdBy?: string | null;
  createdAt: Date;
};

const orderStatusHistorySchema = new Schema<OrderStatusHistorySub>({
  status: { type: String, required: true },
  note: { type: String, default: null },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export type OrderDoc = {
  _id: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  area: string;
  district: string;
  postalCode?: string | null;
  note?: string | null;
  deliveryZoneId: Types.ObjectId;
  couponId?: Types.ObjectId | null;
  couponCode?: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "COD" | "SSLCOMMERZ";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
  placedAt: Date;
  items: OrderItemSub[];
  statusHistory: OrderStatusHistorySub[];
  createdAt: Date;
  updatedAt: Date;
};

const orderSchema = new Schema<OrderDoc>(
  {
    /** human-facing, e.g. KH-260730-8FQ2 */
    orderNumber: { type: String, required: true, unique: true },
    // guest-first: stays null for guest checkout
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, required: true },
    // /track looks up orderNumber + phone
    customerPhone: { type: String, required: true, index: true },
    customerEmail: { type: String, default: null },
    addressLine: { type: String, required: true },
    area: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String, default: null },
    note: { type: String, default: null },
    deliveryZoneId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryZone",
      required: true,
    },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    /** snapshot, survives coupon deletion */
    couponCode: { type: String, default: null },
    subtotal: money,
    discount: { type: Number, default: 0, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    total: money,
    status: { type: String, default: "PENDING" },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "UNPAID" },
    placedAt: { type: Date, default: Date.now },
    items: { type: [orderItemSchema], default: [] },
    statusHistory: { type: [orderStatusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });

// -------------------------------------------------- social & saved

export type ReviewDoc = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  authorName: string;
  phone?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const reviewSchema = new Schema<ReviewDoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // guest reviews allowed
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, required: true },
    phone: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: null },
    body: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, isApproved: 1 });

export type WishlistItemDoc = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  guestToken?: string | null;
  createdAt: Date;
};

const wishlistItemSchema = new Schema<WishlistItemDoc>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    /** cookie value for guests who have not signed in */
    guestToken: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

wishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
wishlistItemSchema.index({ guestToken: 1, productId: 1 }, { unique: true, sparse: true });

export type BannerDoc = {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  position: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const bannerSchema = new Schema<BannerDoc>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: null },
    ctaLabel: { type: String, default: null },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, position: 1 });

export type ComboDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  concern?: string | null;
  imageUrl?: string | null;
  /** bundle price and the sum it replaces, both whole BDT */
  price: number;
  comparePrice?: number | null;
  /** members are referenced by slug so a re-seed cannot orphan them */
  productSlugs: string[];
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const comboSchema = new Schema<ComboDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    /** what the bundle is for, shown under the name */
    concern: { type: String, default: null },
    imageUrl: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: null, min: 0 },
    productSlugs: { type: [String], default: [] },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

comboSchema.index({ isActive: 1, position: 1 });

// Reuse the compiled model across hot reloads, otherwise Mongoose throws
// OverwriteModelError on the second evaluation of this module.
function compile<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T>) ?? model<T>(name, schema);
}

export const User = compile("User", userSchema);
export const Address = compile("Address", addressSchema);
export const Brand = compile("Brand", brandSchema);
export const Category = compile("Category", categorySchema);
export const Product = compile("Product", productSchema);
export const DeliveryZone = compile("DeliveryZone", deliveryZoneSchema);
export const Coupon = compile("Coupon", couponSchema);
export const Order = compile("Order", orderSchema);
export const Review = compile("Review", reviewSchema);
export const WishlistItem = compile("WishlistItem", wishlistItemSchema);
export const Banner = compile("Banner", bannerSchema);
export const Combo = compile("Combo", comboSchema);
