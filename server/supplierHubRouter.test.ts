import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
  categories: [{ id: 10, name: "Maison & Décoration" }],
  createdProducts: [] as Array<any>,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getAllCategories: vi.fn(async () => state.categories),
  createProduct: vi.fn(async (productData: any) => {
    const created = { id: 888, ...productData };
    state.createdProducts.push(created);
    return created;
  }),
}));

import { supplierHubRouter } from "./supplierHubRouter";

function makeOwnerCaller(storeId: number = 77, role: string = "owner") {
  state.membership = role === "none" ? null : { role, status: "active" };
  return supplierHubRouter.createCaller({
    user: { id: 42, role: "user", name: "Propriétaire Test", email: "owner@test.mazigho" },
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

describe("supplierHubRouter - Multi-Tenant Supplier Hub", () => {
  beforeEach(() => {
    state.membership = { role: "owner", status: "active" };
    state.createdProducts = [];
  });

  describe("1. Gestion des connexions fournisseurs & isolation multi-tenant", () => {
    it("retourne les 4 fournisseurs pris en charge (CJdropshipping, AliExpress, Printful, Printify)", async () => {
      const caller = makeOwnerCaller(101);
      const connections = await caller.getConnections();

      expect(connections).toHaveLength(4);
      const providers = connections.map(c => c.provider);
      expect(providers).toContain("cjdropshipping");
      expect(providers).toContain("aliexpress");
      expect(providers).toContain("printful");
      expect(providers).toContain("printify");
    });

    it("enregistre une clé API, masque la valeur et active le statut de connexion", async () => {
      const caller = makeOwnerCaller(102);
      const saved = await caller.saveConnection({
        provider: "cjdropshipping",
        apiKey: "CJ_SECRET_KEY_123456789",
        accountLabel: "Compte Pro CJ Suisse",
      });

      expect(saved.provider).toBe("cjdropshipping");
      expect(saved.status).toBe("connected");
      expect(saved.accountLabel).toBe("Compte Pro CJ Suisse");
      expect(saved.apiKeyMasked).toContain("••••");
      // La clé brute ne doit JAMAIS fuiter dans la réponse
      expect(saved.apiKeyMasked).not.toBe("CJ_SECRET_KEY_123456789");
    });

    it("garantit l'isolation stricte entre boutiques : la boutique B ne voit pas les clés de la boutique A", async () => {
      const callerA = makeOwnerCaller(201);
      const callerB = makeOwnerCaller(202);

      await callerA.saveConnection({
        provider: "printful",
        apiKey: "PF_API_KEY_SUPER_SECRET_STORE_A",
        accountLabel: "Printful Boutique A",
      });

      const listA = await callerA.getConnections();
      const pfA = listA.find(c => c.provider === "printful");
      expect(pfA?.status).toBe("connected");
      expect(pfA?.accountLabel).toBe("Printful Boutique A");

      const listB = await callerB.getConnections();
      const pfB = listB.find(c => c.provider === "printful");
      // Pour la boutique B, Printful reste déconnecté
      expect(pfB?.status).toBe("disconnected");
      expect(pfB?.accountLabel).toBe("");
    });

    it("permet de tester en temps réel une connexion active", async () => {
      const caller = makeOwnerCaller(103);
      await caller.saveConnection({
        provider: "aliexpress",
        apiKey: "ALI_APP_KEY_555777888",
      });

      const testResult = await caller.testConnection({ provider: "aliexpress" });
      expect(testResult.success).toBe(true);
      expect(testResult.message).toContain("AliExpress");
    });

    it("permet de révoquer/supprimer une connexion", async () => {
      const caller = makeOwnerCaller(104);
      await caller.saveConnection({
        provider: "printify",
        apiKey: "PRINTIFY_PROD_TOKEN_9999",
      });

      const removal = await caller.removeConnection({ provider: "printify" });
      expect(removal.success).toBe(true);
      expect(removal.status).toBe("disconnected");

      const connections = await caller.getConnections();
      const printifyConn = connections.find(c => c.provider === "printify");
      expect(printifyConn?.status).toBe("disconnected");
      expect(printifyConn?.apiKeyMasked).toBeNull();
    });
  });

  describe("2. Recherche multi-fournisseurs & import direct d'URL", () => {
    it("permet de rechercher dans le catalogue agrégé avec ou sans filtre fournisseur", async () => {
      const caller = makeOwnerCaller(301);

      const allResults = await caller.searchCatalog({ query: "" });
      expect(allResults.length).toBeGreaterThan(0);

      const cjOnly = await caller.searchCatalog({ query: "", provider: "cjdropshipping" });
      expect(cjOnly.every(item => item.provider === "cjdropshipping")).toBe(true);

      const searchKeyword = await caller.searchCatalog({ query: "coton" });
      expect(searchKeyword.length).toBeGreaterThan(0);
      expect(searchKeyword.some(item => item.title.toLowerCase().includes("coton"))).toBe(true);
    });

    it("importe et extrait les données produit à partir d'une URL AliExpress ou CJ", async () => {
      const caller = makeOwnerCaller(302);

      const draftFromUrl = await caller.importUrl({
        url: "https://fr.aliexpress.com/item/1005006428192831.html",
      });

      expect(draftFromUrl).toBeDefined();
      expect(draftFromUrl.provider).toBe("aliexpress");
      expect(draftFromUrl.supplierProductId).toBe("1005006428192831");
      expect(draftFromUrl.sourcePriceCents).toBeGreaterThan(0);
      expect(draftFromUrl.sellingPriceCents).toBeGreaterThan(draftFromUrl.sourcePriceCents);
    });
  });

  describe("3. File d'attente des brouillons & calcul dynamique des marges", () => {
    it("fournit une liste de brouillons prête à l'édition", async () => {
      const caller = makeOwnerCaller(401);
      const drafts = await caller.getDrafts();

      expect(Array.isArray(drafts)).toBe(true);
      expect(drafts).toEqual([]);
    });

    it("permet d'ajouter un article du catalogue sourcing à la file de brouillons", async () => {
      const caller = makeOwnerCaller(402);
      const newDraft = await caller.stageCatalogItemToDraft({
        provider: "printful",
        supplierProductId: "PF-TEST-MUG-1",
        supplierUrl: "https://printful.com/custom/mugs/ceramic",
        title: "Tasse Céramique Artisanale MAZIGHO",
        thumbnail: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800",
        sourcePriceCents: 650,
        supplierShippingEstimateCents: 350,
        stock: 500,
        supplierName: "Printful",
        originCountry: "Europe (Lettonie)",
        estimatedDeliveryDays: 4,
      });

      expect(newDraft.id).toBeDefined();
      expect(newDraft.title).toBe("Tasse Céramique Artisanale MAZIGHO");
      expect(newDraft.sellingPriceCents).toBeGreaterThan(newDraft.sourcePriceCents + newDraft.shippingCostCents);
      expect(newDraft.profitCents).toBeGreaterThan(0);
      expect(newDraft.marginPercent).toBeGreaterThan(0);
    });

    it("recalcule instantanément la marge et le profit net lors de la modification du prix de vente", async () => {
      const caller = makeOwnerCaller(403);
      await caller.stageCatalogItemToDraft({
        provider: "printful",
        supplierProductId: "PF-TEST-MARGIN-1",
        supplierUrl: "https://printful.com/custom/mugs/margin",
        title: "Produit de test marge",
        thumbnail: "https://example.com/margin.jpg",
        sourcePriceCents: 650,
        supplierShippingEstimateCents: 350,
        stock: 10,
        supplierName: "Printful",
        originCountry: "Europe",
        estimatedDeliveryDays: 4,
      });
      const drafts = await caller.getDrafts();
      const firstDraft = drafts[0];

      // Coût total de départ = sourcePriceCents + shippingCostCents
      const totalCost = firstDraft.sourcePriceCents + firstDraft.shippingCostCents;
      const targetSellingPrice = totalCost + 2000; // 20.00 CHF de marge nette

      const updated = await caller.updateDraft({
        draftId: firstDraft.id,
        sellingPriceCents: targetSellingPrice,
      });

      expect(updated.sellingPriceCents).toBe(targetSellingPrice);
      expect(updated.profitCents).toBe(2000);
      expect(updated.marginPercent).toBe(Math.round((2000 / totalCost) * 100));
    });

    it("permet de supprimer un brouillon", async () => {
      const caller = makeOwnerCaller(404);
      await caller.stageCatalogItemToDraft({
        provider: "printful",
        supplierProductId: "PF-TEST-DELETE-1",
        supplierUrl: "https://printful.com/custom/mugs/delete",
        title: "Produit de test suppression",
        thumbnail: "https://example.com/delete.jpg",
        sourcePriceCents: 650,
        supplierShippingEstimateCents: 350,
        stock: 10,
        supplierName: "Printful",
        originCountry: "Europe",
        estimatedDeliveryDays: 4,
      });
      const drafts = await caller.getDrafts();
      const draftToDelete = drafts[0];

      const res = await caller.deleteDraft({ draftId: draftToDelete.id });
      expect(res).toBe(true);

      const refreshed = await caller.getDrafts();
      expect(refreshed.some(d => d.id === draftToDelete.id)).toBe(false);
    });
  });

  describe("4. Publication 1-clic au catalogue réel de la boutique", () => {
    it("publie un brouillon vers les produits réels et renseigne les métadonnées fournisseur", async () => {
      const caller = makeOwnerCaller(501);
      await caller.stageCatalogItemToDraft({
        provider: "printful",
        supplierProductId: "PF-TEST-PUBLISH-1",
        supplierUrl: "https://printful.com/custom/mugs/publish",
        title: "Produit de test publication",
        thumbnail: "https://example.com/publish.jpg",
        sourcePriceCents: 650,
        supplierShippingEstimateCents: 350,
        stock: 10,
        supplierName: "Printful",
        originCountry: "Europe",
        estimatedDeliveryDays: 4,
      });
      const drafts = await caller.getDrafts();
      const draft = drafts[0];

      const published = await caller.publishDraft({
        draftId: draft.id,
      });

      expect(published.productId).toBe(888);
      expect(published.slug).toBeDefined();

      // Vérifier que createProduct a été appelé avec les données du brouillon et l'isolation storeId
      expect(state.createdProducts).toHaveLength(1);
      const p = state.createdProducts[0];
      expect(p.name).toBe(draft.title);
      expect(p.price).toBe(draft.sellingPriceCents);
      expect(p.supplier).toBeDefined();
      expect(p.supplierProductId).toBe(draft.supplierProductId);
      expect(p.supplierUrl).toBe(draft.supplierUrl);
      expect(p.supplierPrice).toBe(draft.sourcePriceCents);
      expect(p.status).toBe("active");
    });
  });
});
