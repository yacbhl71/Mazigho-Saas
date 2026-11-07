import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, storeOwnerProcedure } from "./_core/trpc";
import {
  getStoreSupplierConnections,
  saveStoreSupplierConnection,
  removeStoreSupplierConnection,
  testStoreSupplierConnection,
  getSupplierProductDrafts,
  createSupplierProductDraft,
  updateSupplierProductDraft,
  deleteSupplierProductDraft,
  publishSupplierProductDraft,
  searchSupplierCatalog,
  importSupplierProductByUrl,
} from "./db/supplierHubStorage";
import type { SupplierProvider } from "../shared/supplierHub";

const providerEnum = z.enum(["cjdropshipping", "aliexpress", "printful", "printify"]);

export const supplierHubRouter = router({
  // 1. GESTION DES CONNEXIONS FOURNISSEURS (MULTI-TENANT)
  getConnections: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
    return await getStoreSupplierConnections(ctx.store.id);
  }),

  saveConnection: storeOwnerProcedure
    .input(
      z.object({
        provider: providerEnum,
        apiKey: z.string().trim().min(4, "La clé est requise."),
        accountLabel: z.string().trim().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await saveStoreSupplierConnection(
        ctx.store.id,
        input.provider as SupplierProvider,
        input.apiKey,
        input.accountLabel
      );
    }),

  removeConnection: storeOwnerProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await removeStoreSupplierConnection(
        ctx.store.id,
        input.provider as SupplierProvider
      );
    }),

  testConnection: storeOwnerProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await testStoreSupplierConnection(
        ctx.store.id,
        input.provider as SupplierProvider
      );
    }),

  // 2. RECHERCHE DE CATALOGUE & SOURCING
  searchCatalog: storeOwnerProcedure
    .input(
      z.object({
        query: z.string().default(""),
        provider: providerEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await searchSupplierCatalog(
        ctx.store.id,
        input.query,
        input.provider as SupplierProvider | undefined
      );
    }),

  importUrl: storeOwnerProcedure
    .input(z.object({ url: z.string().trim().url("Indiquez une URL valide.") }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await importSupplierProductByUrl(ctx.store.id, input.url);
    }),

  // 3. FILE DE BROUILLONS & ATELIER D'ÉDITION
  getDrafts: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
    return await getSupplierProductDrafts(ctx.store.id);
  }),

  stageCatalogItemToDraft: storeOwnerProcedure
    .input(
      z.object({
        provider: providerEnum,
        supplierProductId: z.string(),
        supplierUrl: z.string(),
        title: z.string(),
        thumbnail: z.string(),
        sourcePriceCents: z.number(),
        supplierShippingEstimateCents: z.number(),
        stock: z.number(),
        supplierName: z.string(),
        originCountry: z.string(),
        estimatedDeliveryDays: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      const defaultSellingPrice = Math.round((input.sourcePriceCents + input.supplierShippingEstimateCents) * 2.2);
      const profit = defaultSellingPrice - (input.sourcePriceCents + input.supplierShippingEstimateCents);
      const marginPercent = Math.round((profit / (input.sourcePriceCents + input.supplierShippingEstimateCents)) * 100);

      return await createSupplierProductDraft(ctx.store.id, {
        provider: input.provider as SupplierProvider,
        supplierProductId: input.supplierProductId,
        supplierUrl: input.supplierUrl,
        title: input.title,
        description: `Produit approvisionné depuis ${input.supplierName} (${input.originCountry}). Délai de livraison estimé : ${input.estimatedDeliveryDays} jours ouvrés.`,
        categoryName: "Catalogue Sourcing",
        sourcePriceCents: input.sourcePriceCents,
        sourceCurrency: "CHF",
        shippingCostCents: input.supplierShippingEstimateCents,
        sellingPriceCents: defaultSellingPrice,
        marginPercent,
        profitCents: profit,
        stock: input.stock,
        images: [input.thumbnail],
        selectedImages: [input.thumbnail],
        variants: [
          {
            id: `var-${Date.now()}`,
            name: "Modèle Standard",
            sku: `${input.provider.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            sourcePriceCents: input.sourcePriceCents,
            stock: input.stock,
            options: {},
          },
        ],
        deliveryDaysMin: Math.max(2, input.estimatedDeliveryDays - 2),
        deliveryDaysMax: input.estimatedDeliveryDays + 3,
        shippingCountry: "Europe",
        status: "draft",
      });
    }),

  updateDraft: storeOwnerProcedure
    .input(
      z.object({
        draftId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        categoryName: z.string().optional(),
        sellingPriceCents: z.number().int().min(0).optional(),
        sourcePriceCents: z.number().int().min(0).optional(),
        shippingCostCents: z.number().int().min(0).optional(),
        selectedImages: z.array(z.string()).optional(),
        status: z.enum(["draft", "ready", "published", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      const { draftId, ...changes } = input;

      // Calcul dynamique de marge
      if (changes.sellingPriceCents != null || changes.sourcePriceCents != null || changes.shippingCostCents != null) {
        const drafts = await getSupplierProductDrafts(ctx.store.id);
        const current = drafts.find(d => d.id === draftId);
        if (current) {
          const selling = changes.sellingPriceCents ?? current.sellingPriceCents;
          const cost = changes.sourcePriceCents ?? current.sourcePriceCents;
          const shipping = changes.shippingCostCents ?? current.shippingCostCents;
          const totalCost = cost + shipping;
          const profit = selling - totalCost;
          const margin = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
          (changes as any).profitCents = profit;
          (changes as any).marginPercent = margin;
        }
      }

      return await updateSupplierProductDraft(ctx.store.id, draftId, changes);
    }),

  deleteDraft: storeOwnerProcedure
    .input(z.object({ draftId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      return await deleteSupplierProductDraft(ctx.store.id, input.draftId);
    }),

  // 4. PUBLICATION AU CATALOGUE DE LA BOUTIQUE
  publishDraft: storeOwnerProcedure
    .input(
      z.object({
        draftId: z.string(),
        categoryId: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "supplier_hub");
      try {
        return await publishSupplierProductDraft(ctx.store.id, input.draftId, input.categoryId);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Impossible de publier ce produit.",
        });
      }
    }),
});
