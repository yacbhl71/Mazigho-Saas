import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { flashSaleCampaignSchema } from "../shared/flashSaleTimer";
import { requireStoreSaasFeature } from "./featureAccess";
import {
  getStoreFlashSales,
  saveStoreFlashSale,
  toggleStoreFlashSale,
  getActiveFlashSaleForStore,
} from "./db/flashSaleStorage";

export const flashSaleRouter = router({
  getActive: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    return await getActiveFlashSaleForStore(storeId);
  }),

  getSales: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "flash_sales");
    return await getStoreFlashSales(ctx.store.id);
  }),

  saveSale: storeOwnerProcedure
    .input(flashSaleCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "flash_sales");
      return await saveStoreFlashSale(ctx.store.id, input);
    }),

  toggleSale: storeOwnerProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "flash_sales");
      return await toggleStoreFlashSale(ctx.store.id, input.id, input.enabled);
    }),
});
