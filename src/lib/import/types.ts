/**
 * Contracts for the product importer.
 *
 * The parse-and-validate half is pure: it takes text plus a set of lookups and
 * returns outcomes. Nothing here imports mongoose, so the whole pipeline is
 * testable from a fixture string.
 */

export type ImageInput = { url: string; alt: string | null; position: number };

export type VariantInput = {
  name: string;
  sku: string | null;
  price: number | null;
  stock: number;
  position: number;
  isDefault: boolean;
};

/**
 * The writable half of a product.
 *
 * Every field is optional because a file only updates the columns it actually
 * contains — a sheet of just `slug,price` must not blank out descriptions.
 * `brand` and `category` are resolved to ids later, so they stay as the raw
 * text here.
 */
export type ProductFields = {
  name: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  howToUse: string | null;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ImageInput[];
  variants: VariantInput[];
  brandId: string | null;
  categoryId: string | null;
  ratingAvg: number;
  ratingCount: number;
};

export type RowOutcome =
  | {
      status: "create";
      line: number;
      slug: string;
      name: string;
      fields: Partial<ProductFields>;
    }
  | {
      status: "update";
      line: number;
      slug: string;
      name: string;
      fields: Partial<ProductFields>;
      /** Human-readable "price 1200 → 1350" lines, empty when nothing differs. */
      changes: string[];
    }
  | {
      status: "error";
      line: number;
      slug: string | null;
      name: string | null;
      errors: string[];
    };

export type ImportPreview = {
  rows: RowOutcome[];
  counts: { create: number; update: number; unchanged: number; error: number };
};

/** What the pure validator needs to know about the database. */
export type ExistingProduct = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  brandId: string | null;
  categoryId: string | null;
  /** In position order, so a re-import of the same sheet compares equal. */
  imageUrls: string[];
  /** Compared, not displayed. Without these the importer cannot tell a
   *  description that changed from one that was merely present in the file,
   *  and rewrites the whole catalogue on every run. */
  text: {
    shortDescription: string | null;
    description: string | null;
    ingredients: string | null;
    howToUse: string | null;
  };
};

export type ImportLookups = {
  /** Lowercased brand name AND slug both map to the id, so either works. */
  brandIds: Map<string, string>;
  categoryIds: Map<string, string>;
  existing: Map<string, ExistingProduct>;
};

export type ImportFormat = "csv" | "json";

/** Server Action state for the import screen. */
export type ImportState = {
  ok: boolean;
  message: string | null;
  preview: ImportPreview | null;
  applied: { created: number; updated: number } | null;
};

export const emptyImportState: ImportState = {
  ok: false,
  message: null,
  preview: null,
  applied: null,
};
