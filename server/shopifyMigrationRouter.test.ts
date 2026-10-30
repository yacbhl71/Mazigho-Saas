import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
  categories: [{ id: 1, name: "Catalogue Général" }],
  createdProducts: [] as any[],
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getAllCategories: vi.fn(async () => state.categories),
  getAllProductsAdmin: vi.fn(async () => [
    {
      id: 10,
      categoryId: 1,
      name: "Sweat Coton Bio",
      slug: "sweat-coton-bio",
      price: 5900,
      originalPrice: 7900,
      stock: 25,
      status: "active",
      supplier: "Shopify Import",
    },
  ]),
  getProductImagesForProducts: vi.fn(async () => new Map([[10, [{ imageUrl: "https://example.com/sweat.jpg" }]]])),
  createProduct: vi.fn(async (prodData: any) => {
    const created = { id: 99, ...prodData };
    state.createdProducts.push(created);
    return created;
  }),
}));

import { shopifyMigrationRouter } from "./shopifyMigrationRouter";
import { parseShopifyCsv } from "../shared/shopifyMigration";

function makeOwnerCaller(storeId: number = 77) {
  state.membership = { role: "owner", status: "active" };
  return shopifyMigrationRouter.createCaller({
    user: { id: 10, role: "user", name: "Propriétaire Test", email: "owner@test.mazigho" },
    store: {
      id: storeId,
      slug: `boutique-${storeId}`,
      displayName: `Boutique Test ${storeId}`,
      primaryDomain: `boutique${storeId}.test`,
      status: "active",
      isPlatformStore: 0,
    },
  } as any);
}

const sampleShopifyCsv = `Handle,Title,Body (HTML),Vendor,Custom Product Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Qty,Variant Price,Variant Compare At Price,Image Src
t-shirt-bio,T-Shirt Coton Bio,<p>Un t-shirt bio très doux.</p>,MAZIGHO,Vêtements,Bio,true,Size,M,TSHIRT-M,15,29.90,39.90,https://example.com/tshirt.jpg
t-shirt-bio,T-Shirt Coton Bio,<p>Un t-shirt bio très doux.</p>,MAZIGHO,Vêtements,Bio,true,Size,L,TSHIRT-L,10,29.90,39.90,https://example.com/tshirt.jpg
`;

describe("shopifyMigrationRouter - Migration 1-Clic Shopify & Export CSV", () => {
  beforeEach(() => {
    state.membership = { role: "owner", status: "active" };
    state.createdProducts = [];
  });

  it("analyse et regroupe un fichier CSV d'exportation Shopify", () => {
    const report = parseShopifyCsv(sampleShopifyCsv);

    expect(report.totalProducts).toBe(1);
    expect(report.totalVariants).toBe(2);
    expect(report.categoriesFound).toContain("Vêtements");
    expect(report.sampleProducts[0].title).toBe("T-Shirt Coton Bio");
    expect(report.sampleProducts[0].priceCents).toBe(2990);
  });

  it("prévisualise le rapport d'importation Shopify via tRPC", async () => {
    const caller = makeOwnerCaller(601);
    const report = await caller.previewShopifyImport({ csvText: sampleShopifyCsv });

    expect(report.totalProducts).toBe(1);
    expect(report.sampleProducts[0].vendor).toBe("MAZIGHO");
  });

  it("exécute la migration complète et crée les fiches au catalogue", async () => {
    const caller = makeOwnerCaller(602);
    const res = await caller.confirmShopifyImport({ csvText: sampleShopifyCsv });

    expect(res.success).toBe(true);
    expect(res.createdCount).toBe(1);
    expect(state.createdProducts).toHaveLength(1);
    expect(state.createdProducts[0].name).toBe("T-Shirt Coton Bio");
    expect(state.createdProducts[0].price).toBe(2990);
  });

  it("génère l'exportation CSV complète du catalogue", async () => {
    const caller = makeOwnerCaller(603);
    const exp = await caller.exportFullCatalogueCsv();

    expect(exp.filename).toContain(".csv");
    expect(exp.csvContent).toContain("Sweat Coton Bio");
    expect(exp.csvContent).toContain("59.00");
  });
});
