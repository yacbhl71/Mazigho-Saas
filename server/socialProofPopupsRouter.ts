import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { socialProofConfigSchema } from "../shared/socialProofPopups";
import {
  getSocialProofConfig,
  saveSocialProofConfig,
  getRecentPurchasesForSocialProof,
} from "./db/socialProofPopupsStorage";
import { hasStoreSaasFeature } from "./db";

export const socialProofPopupsRouter = router({
  getFeed: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    if (!await hasStoreSaasFeature(storeId, "social_proof")) return { config: { enabled: false, displayIntervalSeconds: 10, hideOnMobile: false }, notifications: [] };
    const [config, notifications] = await Promise.all([
      getSocialProofConfig(storeId),
      getRecentPurchasesForSocialProof(storeId),
    ]);
    return { config, notifications };
  }),

  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getSocialProofConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "social_proof")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(socialProofConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveSocialProofConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "social_proof")) });
    }),
});
