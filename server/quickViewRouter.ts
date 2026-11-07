import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { quickViewConfigSchema } from "../shared/quickViewConfig";
import {
  getQuickViewConfig,
  saveQuickViewConfig,
} from "./db/quickViewStorage";
import { hasStoreSaasFeature } from "./db";

export const quickViewRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getQuickViewConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "quick_view")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(quickViewConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveQuickViewConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "quick_view")) });
    }),
});
