import { z } from "zod";
import { router, storeOwnerProcedure, protectedProcedure, publicProcedure } from "./_core/trpc";
import {
  subscriptionsConfigSchema,
  createSubscriptionSchema,
} from "../shared/productSubscriptions";
import {
  getSubscriptionConfig,
  saveSubscriptionConfig,
  createCustomerSubscription,
  getCustomerSubscriptions,
  getStoreSubscriptions,
} from "./db/productSubscriptionsStorage";
import { hasStoreSaasFeature } from "./db";

export const productSubscriptionsRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getSubscriptionConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "subscriptions")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(subscriptionsConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveSubscriptionConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "subscriptions")) });
    }),

  createSubscription: protectedProcedure
    .input(createSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.store) throw new Error("Boutique introuvable.");
      if (!await hasStoreSaasFeature(ctx.store.id, "subscriptions")) throw new Error("SUBSCRIPTIONS_FEATURE_NOT_INCLUDED");
      return await createCustomerSubscription(ctx.store.id, ctx.user.id, input);
    }),

  getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.store) throw new Error("Boutique introuvable.");
    return await getCustomerSubscriptions(ctx.store.id, ctx.user.id);
  }),

  getStoreSubscriptions: storeOwnerProcedure.query(async ({ ctx }) => {
    return await getStoreSubscriptions(ctx.store.id);
  }),
});
