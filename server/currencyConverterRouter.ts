import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { currencyConverterConfigSchema } from "../shared/currencyConverter";
import {
  getCurrencyConverterConfig,
  saveCurrencyConverterConfig,
} from "./db/currencyConverterStorage";
import { storeSaasFeatureEnabled, requireStoreSaasFeature } from "./featureAccess";

export const currencyConverterRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getCurrencyConverterConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await storeSaasFeatureEnabled(storeId, "currency_converter")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(currencyConverterConfigSchema)
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "currency_converter");
      return await saveCurrencyConverterConfig(ctx.store.id, input);
    }),
});
