import { publicProcedure, router, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { shoppableStoriesConfigSchema } from "../shared/shoppableVideoStories";
import { hasStoreSaasFeature } from "./db";

export const shoppableStoriesRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await db.getShoppableStoriesConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "shoppable_stories")) };
  }),

  saveConfig: storeOwnerProcedure.input(shoppableStoriesConfigSchema).mutation(async ({ ctx, input }) => {
    return db.saveShoppableStoriesConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "shoppable_stories")) });
  }),
});
