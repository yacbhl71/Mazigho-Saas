import type { Express, Request } from "express";
import { timingSafeEqual } from "node:crypto";
import { getStudioStoreInventory, getStudioStoreOwnershipAudit } from "./db";

function bearerToken(req: Request) {
  const value = req.header("authorization") ?? "";
  return value.replace(/^Bearer\s+/i, "").trim();
}

export function isInventorySyncTokenValid(provided: string, expected: string) {
  const actual = Buffer.from(provided);
  const configured = Buffer.from(expected);
  return actual.length > 0 && actual.length === configured.length && timingSafeEqual(actual, configured);
}

/** Read-only, server-to-server projection for the private inventory dashboard. */
export function registerInventorySyncRoute(targetApp: Express) {
  targetApp.get("/api/internal/studio/inventory", async (req, res) => {
    const expectedToken = process.env.MAZIGHO_INVENTORY_SYNC_TOKEN?.trim() ?? "";
    if (!expectedToken || !isInventorySyncTokenValid(bearerToken(req), expectedToken)) {
      return res.status(401).json({ code: "INVENTORY_SYNC_UNAUTHORIZED", message: "Accès non autorisé." });
    }

    try {
      const [inventory, ownership] = await Promise.all([
        getStudioStoreInventory({ includeAllForInternalProjection: true, page: 1, pageSize: 100 }),
        getStudioStoreOwnershipAudit(),
      ]);
      const ownersByStore = new Map(ownership.stores.map(store => [store.id, store]));
      const stores = inventory.stores.map(store => {
        const ownershipStore = ownersByStore.get(store.id);
        return {
          id: store.id,
          displayName: store.displayName,
          primaryDomain: store.primaryDomain,
          slug: store.slug,
          status: store.status,
          isPlatformStore: store.isPlatformStore,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
          productCount: store.productCount,
          activeProductCount: store.activeProductCount,
          activeMembers: store.activeMembers,
          activeOwners: store.activeOwners,
          orderCount: store.orderCount,
          paidOrderCount: store.paidOrderCount,
          commercialOfferMode: store.commercialOfferMode,
          setupCompleted: store.setupCompleted,
          ownerEmails: ownershipStore?.owners ?? [],
          ownerEmailStatus: ownershipStore?.owners?.length ? "E-mail privé Studio" : "Aucune adresse propriétaire active",
          likelyRecipe: ownershipStore?.likelyRecipe ?? false,
          recipeReasons: ownershipStore?.recipeReasons ?? [],
          recommendation: ownershipStore?.recommendation ?? "conserver",
          familyHint: ownershipStore?.family ?? store.displayName,
        };
      });
      res.setHeader("Cache-Control", "private, no-store");
      return res.json({ source: "studio", fetchedAt: new Date().toISOString(), stores });
    } catch (error) {
      console.error("[inventory-sync] projection failed", error);
      return res.status(500).json({ code: "INVENTORY_SYNC_FAILED", message: "La projection Studio est indisponible." });
    }
  });
}
