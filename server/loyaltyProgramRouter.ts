import { z } from "zod";
import { router, storeOwnerProcedure, protectedProcedure, publicProcedure } from "./_core/trpc";
import {
  getStoreLoyaltyConfig,
  saveStoreLoyaltyConfig,
  getCustomerLoyaltyAccount,
  redeemPointsForDiscount,
} from "./db/loyaltyProgramStorage";

export const loyaltyProgramRouter = router({
  getConfig: storeOwnerProcedure.query(async ({ ctx }) => {
    return await getStoreLoyaltyConfig(ctx.store.id);
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
      return await saveStoreLoyaltyConfig(ctx.store.id, input);
    }),

  getMyAccount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.store) throw new Error("Boutique introuvable.");
    const account = await getCustomerLoyaltyAccount(ctx.store.id, ctx.user.id, ctx.user.email ?? undefined);
    const config = await getStoreLoyaltyConfig(ctx.store.id);
    return { account, config };
  }),

  redeemPoints: protectedProcedure
    .input(z.object({ pointsToRedeem: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.store) throw new Error("Boutique introuvable.");
      return await redeemPointsForDiscount(
        ctx.store.id,
        ctx.user.id,
        input.pointsToRedeem,
        ctx.user.email ?? undefined
      );
    }),
});
