import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { stickyAddToCartConfigSchema } from "../shared/stickyAddToCart";
import {
  getStickyAddToCartConfig,
  saveStickyAddToCartConfig,
} from "./db/stickyAddToCartStorage";
import { hasStoreSaasFeature } from "./db";

export const stickyAddToCartRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getStickyAddToCartConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "sticky_add_to_cart")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(stickyAddToCartConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveStickyAddToCartConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "sticky_add_to_cart")) });
    }),
});
