import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { slideOutCartConfigSchema } from "../shared/slideOutCartConfig";
import {
  getSlideOutCartConfig,
  saveSlideOutCartConfig,
} from "./db/slideOutCartStorage";
import { hasStoreSaasFeature } from "./db";

export const slideOutCartRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getSlideOutCartConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "slide_out_cart")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(slideOutCartConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveSlideOutCartConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "slide_out_cart")) });
    }),
});
