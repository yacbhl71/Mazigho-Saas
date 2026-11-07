import { z } from "zod";
import { router, storeOwnerProcedure, protectedProcedure, publicProcedure } from "./_core/trpc";
import {
  getStoreLoyaltyConfig,
  saveStoreLoyaltyConfig,
  getCustomerLoyaltyAccount,
  redeemPointsForDiscount,
} from "./db/loyaltyProgramStorage";
import { hasStoreSaasFeature } from "./db";

export const loyaltyProgramRouter = router({
  getConfig: storeOwnerProcedure.query(async ({ ctx }) => {
    const config = await getStoreLoyaltyConfig(ctx.store.id);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(ctx.store.id, "loyalty_program")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(
      z.object({
        pointsPerSpentCents: z.number().min(0.1),
        centsPerRedeemedPoint: z.number().min(1),
        minRedeemPoints: z.number().int().min(10),
        referralRewardCents: z.number().int().min(100),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await saveStoreLoyaltyConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "loyalty_program")) });
    }),

  getMyAccount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.store) throw new Error("Boutique introuvable.");
    const account = await getCustomerLoyaltyAccount(ctx.store.id, ctx.user.id, ctx.user.email ?? undefined);
    const config = await getStoreLoyaltyConfig(ctx.store.id);
    return { account, config: { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(ctx.store.id, "loyalty_program")) } };
  }),

  redeemPoints: protectedProcedure
    .input(z.object({ pointsToRedeem: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.store) throw new Error("Boutique introuvable.");
      if (!await hasStoreSaasFeature(ctx.store.id, "loyalty_program")) throw new Error("LOYALTY_FEATURE_NOT_INCLUDED");
      return await redeemPointsForDiscount(
        ctx.store.id,
        ctx.user.id,
        input.pointsToRedeem,
        ctx.user.email ?? undefined
      );
    }),
});
