// Shared tracking types for Korean Hive (GA4 + Meta).
// item_id must be the product SKU (e.g. "KH-TNR-005"): the Meta catalogue feed
// uses the same SKU as its id, so pixel/CAPI events match catalogue items.

export type TrackItem = {
  item_id: string; // SKU, e.g. "KH-TNR-005"
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number; // unit selling price in BDT
  quantity: number;
};

export type Ga4EcomEvent =
  | "view_item"
  | "view_item_list"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "purchase";

// Purchase is intentionally not here: only the order action sends it.
export type MetaClientServerEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Search";

export type MetaEventName = MetaClientServerEvent | "Purchase";

export type MetaCustomData = {
  currency?: string;
  value?: number;
  content_ids?: string[];
  contents?: { id: string; quantity: number; item_price?: number }[];
  content_type?: "product";
  content_name?: string;
  content_category?: string;
  num_items?: number;
  order_id?: string;
  search_string?: string;
};

export type MetaUserInput = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null; // district
  zip?: string | null;
  country?: string; // ISO-2, default "bd"
};
