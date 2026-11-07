import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { discountRuleSchema } from "../shared/advancedDiscounts";
import {
  getStoreDiscountRules,
  saveStoreDiscountRule,
  toggleStoreDiscountRule,
  deleteStoreDiscountRule,
  evaluateCartDiscounts,
} from "./db/advancedDiscountsStorage";

export const advancedDiscountsRouter = router({
  getRules: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "advanced_discounts");
    return await getStoreDiscountRules(ctx.store.id);
  }),

  saveRule: storeOwnerProcedure
    .input(discountRuleSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "advanced_discounts");
      return await saveStoreDiscountRule(ctx.store.id, input);
    }),

  toggleRule: storeOwnerProcedure
    .input(z.object({ ruleId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "advanced_discounts");
      return await toggleStoreDiscountRule(ctx.store.id, input.ruleId, input.enabled);
    }),

  deleteRule: storeOwnerProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "advanced_discounts");
      return await deleteStoreDiscountRule(ctx.store.id, input.ruleId);
    }),

  evaluateCart: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number().int(),
            quantity: z.number().int().min(1),
            priceCents: z.number().int().min(0),
          })
        ),
        cartSubtotalCents: z.number().int().min(0),
        activeCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.store?.id || 1;
      return await evaluateCartDiscounts(
        storeId,
        input.items,
        input.cartSubtotalCents,
        input.activeCode
      );
    }),
});
