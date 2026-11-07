import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import {
  createAffiliateSchema,
  affiliateConfigSchema,
} from "../shared/affiliateProgram";
import {
  getAffiliateConfig,
  saveAffiliateConfig,
  createAffiliateAmbassador,
  getStoreAffiliates,
  recordAffiliateSale,
} from "./db/affiliateProgramStorage";

export const affiliateProgramRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    return await getAffiliateConfig(storeId);
  }),

  saveConfig: storeOwnerProcedure
    .input(affiliateConfigSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "affiliate_program");
      return await saveAffiliateConfig(ctx.store.id, input);
    }),

  createAffiliate: storeOwnerProcedure
    .input(createAffiliateSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "affiliate_program");
      return await createAffiliateAmbassador(ctx.store.id, input);
    }),

  getStoreAffiliates: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "affiliate_program");
    return await getStoreAffiliates(ctx.store.id);
  }),

  recordSale: publicProcedure
    .input(
      z.object({
        affiliateCode: z.string(),
        saleAmountCents: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.store?.id || 1;
      return await recordAffiliateSale(
        storeId,
        input.affiliateCode,
        input.saleAmountCents
      );
    }),
});
