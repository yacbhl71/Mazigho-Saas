import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import { subscribeBackInStockSchema } from "../shared/backInStock";
import {
  subscribeToBackInStock,
  getStoreBackInStockSubscriptions,
  notifyBackInStockForProduct,
} from "./db/backInStockStorage";
import { hasStoreSaasFeature } from "./db";

export const backInStockRouter = router({
  subscribe: publicProcedure
    .input(subscribeBackInStockSchema)
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.store?.id || 1;
      if (!await hasStoreSaasFeature(storeId, "back_in_stock")) return { success: false, message: "Fonctionnalité réservée au plan BASIC ou supérieur." };
      return await subscribeToBackInStock(storeId, input);
    }),

  getSubscriptions: storeOwnerProcedure.query(async ({ ctx }) => {
    return await getStoreBackInStockSubscriptions(ctx.store.id);
  }),

  triggerNotification: storeOwnerProcedure
    .input(z.object({ productId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return await notifyBackInStockForProduct(ctx.store.id, input.productId);
    }),
});
