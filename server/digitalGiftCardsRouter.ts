import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { createGiftCardSchema, redeemGiftCardSchema } from "../shared/digitalGiftCards";
import {
  createStoreGiftCard,
  getStoreGiftCards,
  getGiftCardByCode,
  redeemGiftCardBalance,
} from "./db/digitalGiftCardsStorage";

export const digitalGiftCardsRouter = router({
  checkBalance: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const card = await getGiftCardByCode(input.code, ctx.store?.id);
      if (!card) throw new Error("Carte-cadeau introuvable.");
      return card;
    }),

  redeem: publicProcedure
    .input(redeemGiftCardSchema)
    .mutation(async ({ ctx, input }) => {
      return await redeemGiftCardBalance(input, ctx.store?.id);
    }),

  createCard: storeOwnerProcedure
    .input(createGiftCardSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "gift_cards");
      return await createStoreGiftCard(ctx.store.id, input);
    }),

  getStoreCards: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "gift_cards");
    return await getStoreGiftCards(ctx.store.id);
  }),
});
