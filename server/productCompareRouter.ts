import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { defaultProductCompareConfig, productCompareConfigSchema } from "../shared/productCompareConfig";
import { hasStoreSaasFeature } from "./db";

const storeProductCompareConfig = new Map<number, typeof defaultProductCompareConfig>();

export const productCompareRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = storeProductCompareConfig.get(storeId) || defaultProductCompareConfig;
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "product_compare")) };
  }),

  saveConfig: protectedProcedure.input(productCompareConfigSchema).mutation(async ({ ctx, input }) => {
    const storeId = ctx.store?.id || 1;
    const next = { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(storeId, "product_compare")) };
    storeProductCompareConfig.set(storeId, next);
    return next;
  }),
});
