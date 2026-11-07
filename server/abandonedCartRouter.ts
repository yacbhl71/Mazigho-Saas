import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import {
  getStoreAbandonedCarts,
  getAbandonedCartAnalytics,
  sendCartRecoveryReminder,
  recordCartChannelReminder,
  markCartAsRecovered,
  recordAbandonedCart,
  getStoreTrackingPixels,
  saveStoreTrackingPixels,
} from "./db/abandonedCartStorage";

export const abandonedCartRouter = router({
  // Owner queries & mutations
  getCarts: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
    return await getStoreAbandonedCarts(ctx.store.id);
  }),

  getAnalytics: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
    return await getAbandonedCartAnalytics(ctx.store.id);
  }),

  sendReminder: storeOwnerProcedure
    .input(
      z.object({
        cartId: z.string(),
        discountPercent: z.number().int().min(5).max(50).default(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
      const storeName = ctx.store.displayName || "MAZIGHO Boutique";
      return await sendCartRecoveryReminder(ctx.store.id, input.cartId, storeName, input.discountPercent);
    }),

  recordManualReminder: storeOwnerProcedure
    .input(
      z.object({
        cartId: z.string(),
        channel: z.enum(["whatsapp", "sms"]),
        discountPercent: z.number().int().min(5).max(50).default(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
      return await recordCartChannelReminder(ctx.store.id, input.cartId, input.channel, input.discountPercent);
    }),

  markRecovered: storeOwnerProcedure
    .input(z.object({ cartId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
      return await markCartAsRecovered(ctx.store.id, input.cartId);
    }),

  // Tracking Pixels endpoints
  getPixelsConfig: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
    return await getStoreTrackingPixels(ctx.store.id);
  }),

  savePixelsConfig: storeOwnerProcedure
    .input(
      z.object({
        metaPixelId: z.string().nullable().optional(),
        tiktokPixelId: z.string().nullable().optional(),
        gaMeasurementId: z.string().nullable().optional(),
        gtmContainerId: z.string().nullable().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "abandoned_cart_automation");
      return await saveStoreTrackingPixels(ctx.store.id, input);
    }),

  // Public endpoints for customer storefront
  getPublicStorePixels: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.store) return { enabled: false };
    return await getStoreTrackingPixels(ctx.store.id);
  }),

  recordPublicCartHeartbeat: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number().int(),
            productName: z.string(),
            priceCents: z.number().int(),
            quantity: z.number().int(),
            thumbnail: z.string().optional(),
            variantLabel: z.string().optional(),
          })
        ),
        totalAmountCents: z.number().int(),
        currency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.store) return null;
      return await recordAbandonedCart(ctx.store.id, input);
    }),
});
