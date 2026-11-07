import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { liveSalesChatConfigSchema } from "../shared/liveSalesChat";
import { requireStoreSaasFeature, storeSaasFeatureEnabled } from "./featureAccess";
import {
  getLiveSalesChatConfig,
  saveLiveSalesChatConfig,
} from "./db/liveSalesChatStorage";

export const liveSalesChatRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getLiveSalesChatConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await storeSaasFeatureEnabled(storeId, "live_sales_chat")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(liveSalesChatConfigSchema)
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "live_sales_chat");
      return await saveLiveSalesChatConfig(ctx.store.id, input);
    }),
});
