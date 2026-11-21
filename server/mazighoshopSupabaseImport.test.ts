import { describe, expect, it } from "vitest";
import { normalizeMazighoShopSupabaseSnapshot } from "../shared/mazighoshopSupabaseImport";

describe("normalizeMazighoShopSupabaseSnapshot", () => {
  it("converts products, variants and collection links without writing anywhere", () => {
    const report = normalizeMazighoShopSupabaseSnapshot({
      products: [{ id: "p1", handle: "lampe-led", title: "Lampe LED", description: "Une lampe", product_type: "High-Tech", tags: ["led"], available_for_sale: true, image_url: "https://example.test/lampe.webp", price: 19.9 }],
      product_variants: [{ id: "v1", product_id: "p1", title: "Blanc", sku: "LED-BLANC", price: 21.5, inventory_quantity: 3 }],
      collections: [{ id: "c1", handle: "high-tech", title: "High-Tech" }],
      collection_products: [{ collection_id: "c1", product_id: "p1", position: 1 }],
    });

    expect(report.products).toHaveLength(1);
    expect(report.products[0]).toMatchObject({
      handle: "lampe-led",
      title: "Lampe LED",
      categoryName: "High-Tech",
      priceCents: 1990,
      stock: 3,
      images: ["https://example.test/lampe.webp"],
    });
    expect(report.products[0].variants[0]).toMatchObject({ name: "Blanc", sku: "LED-BLANC", priceCents: 2150, stock: 3 });
    expect(report.variantsFound).toBe(1);
  });

  it("skips unavailable or malformed rows and preserves explicit centimes fields", () => {
    const report = normalizeMazighoShopSupabaseSnapshot({
      products: [
        { id: "p1", title: "Brouillon", available_for_sale: false },
        { id: "p2", title: "Produit", price_cents: 18900, inventory_quantity: 4 },
        { id: "p3", available_for_sale: true },
      ],
    });

    expect(report.products).toHaveLength(1);
    expect(report.products[0].priceCents).toBe(18900);
    expect(report.skippedUnavailable).toBe(1);
    expect(report.skippedWithoutTitle).toBe(1);
  });
});
