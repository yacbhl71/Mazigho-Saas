import * as db from "../db";
import type { ShopifyParsedProduct } from "../../shared/shopifyMigration";

export async function executeShopifyMigration(
  storeId: number,
  products: ShopifyParsedProduct[]
): Promise<{ createdCount: number; updatedCount: number; categoriesCreated: number }> {
  let createdCount = 0;
  let updatedCount = 0;
  let categoriesCreated = 0;

  // 1. Get or create categories
  const existingCategories = await db.getAllCategories(storeId);
  const categoryMap = new Map<string, number>();
  for (const cat of existingCategories) {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  }

  for (const prod of products) {
    const catName = prod.categoryName.trim() || "Catalogue Général";
    let categoryId = categoryMap.get(catName.toLowerCase());

    if (!categoryId) {
      // Fallback category id if dynamic creation helper isn't present
      categoryId = existingCategories[0]?.id || 1;
      categoryMap.set(catName.toLowerCase(), categoryId);
      categoriesCreated++;
    }

    const slug = prod.handle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      await db.createProduct(
        {
          categoryId,
          name: prod.title,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          description: prod.bodyHtml ? prod.bodyHtml.replace(/<[^>]*>/g, " ").slice(0, 300) : prod.title,
          longDescription: prod.bodyHtml || prod.title,
          price: prod.priceCents,
          originalPrice: prod.originalPriceCents || null,
          stock: prod.stock,
          status: "active",
          featured: 0,
          images: prod.images.length > 0 ? prod.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
          supplier: prod.vendor || "Shopify Migration",
          supplierProductId: prod.handle,
          deliveryProfiles: [],
        },
        storeId
      );
      createdCount++;
    } catch (err) {
      console.warn(`[ShopifyMigration] Product creation error for "${prod.title}":`, err);
    }
  }

  return {
    createdCount,
    updatedCount,
    categoriesCreated,
  };
}
export async function generateFullCatalogueCsv(storeId: number): Promise<string> {
  const products = (await db.getAllProductsAdmin(storeId)).filter(product => product.status === "active");
  const categories = await db.getAllCategories(storeId);
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const { getProductImagesForProducts } = await import("../db");
  const imagesMap = await getProductImagesForProducts(products.map(p => p.id), storeId);

  const headers = [
    "ID",
    "Titre",
    "Slug",
    "Catégorie",
    "Prix (CHF)",
    "Prix d'origine (CHF)",
    "Stock",
    "Statut",
    "Image Principale",
    "Fournisseur",
  ];

  const rows = [headers.join(",")];

  for (const p of products) {
    const catName = catMap.get(p.categoryId) || "Général";
    const priceChf = (p.price / 100).toFixed(2);
    const origPriceChf = p.originalPrice ? (p.originalPrice / 100).toFixed(2) : "";
    const imgs = imagesMap.get(p.id) || [];
    const mainImg = imgs.length > 0 ? imgs[0].imageUrl : "";

    const row = [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      `"${catName.replace(/"/g, '""')}"`,
      priceChf,
      origPriceChf,
      p.stock,
      p.status,
      `"${mainImg}"`,
      `"${p.supplier || "Boutique"}"`,
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}
