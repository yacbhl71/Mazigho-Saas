import type { ShopifyParsedProduct } from "./shopifyMigration";

export interface MazighoShopSupabaseSnapshot {
  products?: Array<Record<string, unknown>>;
  product_variants?: Array<Record<string, unknown>>;
  collections?: Array<Record<string, unknown>>;
  collection_products?: Array<Record<string, unknown>>;
}

export interface MazighoShopSupabaseImportReport {
  products: ShopifyParsedProduct[];
  skippedUnavailable: number;
  skippedWithoutTitle: number;
  categoriesFound: string[];
  variantsFound: number;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cents(value: unknown): number {
  const amount = numberValue(value);
  return amount > 0 && amount < 100000 ? Math.round(amount * 100) : Math.round(amount);
}

function moneyCents(value: unknown, alreadyCents = false): number {
  return alreadyCents ? Math.max(0, Math.round(numberValue(value))) : cents(value);
}

function booleanValue(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = text(value).toLowerCase();
  if (!normalized) return fallback;
  return !["false", "0", "no", "non", "unavailable", "draft"].includes(normalized);
}

function arrayOfText(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean);
    } catch {
      // Some historical exports store tags as comma-separated text.
    }
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function imagesOf(product: Record<string, unknown>): string[] {
  const values = [product.images, product.image_urls, product.imageUrls, product.image_url, product.imageUrl];
  return values.flatMap(arrayOfText).filter(value => /^https?:\/\//i.test(value) || value.startsWith("/"));
}

function productId(row: Record<string, unknown>): string {
  return text(row.id || row.product_id || row.productId || row.handle);
}

export function normalizeMazighoShopSupabaseSnapshot(snapshot: MazighoShopSupabaseSnapshot): MazighoShopSupabaseImportReport {
  const variantsByProduct = new Map<string, Array<Record<string, unknown>>>();
  for (const variant of snapshot.product_variants || []) {
    const id = productId(variant);
    if (!id) continue;
    const productIdValue = text(variant.product_id || variant.productId || id);
    const current = variantsByProduct.get(productIdValue) || [];
    current.push(variant);
    variantsByProduct.set(productIdValue, current);
  }

  const collectionsById = new Map<string, string>();
  for (const collection of snapshot.collections || []) {
    const id = productId(collection);
    const title = text(collection.title || collection.name || collection.handle);
    if (id && title) collectionsById.set(id, title);
  }

  const collectionNamesByProduct = new Map<string, string>();
  for (const link of snapshot.collection_products || []) {
    const product = text(link.product_id || link.productId);
    const collection = collectionsById.get(text(link.collection_id || link.collectionId));
    if (product && collection && !collectionNamesByProduct.has(product)) collectionNamesByProduct.set(product, collection);
  }

  const products: ShopifyParsedProduct[] = [];
  const categories = new Set<string>();
  let skippedUnavailable = 0;
  let skippedWithoutTitle = 0;
  let variantsFound = 0;

  for (const row of snapshot.products || []) {
    const title = text(row.title || row.name);
    if (!title) {
      skippedWithoutTitle++;
      continue;
    }
    if (!booleanValue(row.available_for_sale ?? row.availableForSale, true)) {
      skippedUnavailable++;
      continue;
    }

    const id = productId(row);
    const variants = variantsByProduct.get(id) || [];
    variantsFound += variants.length;
    const firstVariant = variants[0] || {};
    const categoryName = text(row.product_type || row.productType || collectionNamesByProduct.get(id) || "Catalogue Général");
    const priceValue = row.price ?? row.price_cents ?? row.priceCents ?? firstVariant.price ?? firstVariant.price_cents;
    const priceAlreadyCents = row.price == null && (row.price_cents != null || row.priceCents != null) || firstVariant.price == null && firstVariant.price_cents != null;
    const compareValue = row.compare_at_price ?? row.compareAtPrice ?? row.compare_at_price_cents ?? firstVariant.compare_at_price ?? firstVariant.compareAtPrice ?? firstVariant.compare_at_price_cents;
    const compareAlreadyCents = row.compare_at_price == null && row.compareAtPrice == null && row.compare_at_price_cents != null || firstVariant.compare_at_price == null && firstVariant.compareAtPrice == null && firstVariant.compare_at_price_cents != null;
    const stockValue = variants.length
      ? variants.reduce((sum, variant) => sum + Math.max(0, numberValue(variant.inventory_quantity ?? variant.inventoryQuantity ?? variant.stock)), 0)
      : numberValue(row.inventory_quantity ?? row.inventoryQuantity ?? row.stock, 0);
    const handle = text(row.handle || row.slug || `product-${id || products.length + 1}`);
    const product: ShopifyParsedProduct = {
      handle,
      title,
      bodyHtml: text(row.description || row.body_html || row.bodyHtml || title),
      vendor: text(row.vendor || "MAZIGOSHOP"),
      categoryName,
      tags: arrayOfText(row.tags),
      priceCents: moneyCents(priceValue, priceAlreadyCents),
      originalPriceCents: compareValue == null ? null : moneyCents(compareValue, compareAlreadyCents),
      stock: stockValue,
      images: imagesOf(row),
      variants: variants.map((variant, index) => ({
        name: text(variant.title || variant.name || `Variante ${index + 1}`),
        sku: text(variant.sku || `${handle}-${index + 1}`),
        priceCents: moneyCents(variant.price ?? variant.price_cents ?? priceValue, variant.price == null && variant.price_cents != null || priceAlreadyCents),
        stock: Math.max(0, numberValue(variant.inventory_quantity ?? variant.inventoryQuantity ?? variant.stock, 0)),
      })),
    };
    products.push(product);
    categories.add(categoryName);
  }

  return {
    products,
    skippedUnavailable,
    skippedWithoutTitle,
    categoriesFound: Array.from(categories),
    variantsFound,
  };
}
