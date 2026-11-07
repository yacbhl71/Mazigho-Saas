import { requireStoreSaasFeature } from "./featureAccess";
import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import {
  generateLabelSchema,
  updateTrackingStatusSchema,
} from "../shared/shippingCarrier";
import {
  createShippingLabelForOrder,
  getStoreShippingLabels,
  getShippingLabelByTracking,
  getShippingLabelByOrder,
  updateLabelTrackingStatus,
  getStoreSenderAddress,
  setStoreSenderAddress,
} from "./db/shippingCarrierStorage";
import { renderPrintableLabelHtml } from "./services/shippingCarrierService";

export const shippingCarrierRouter = router({
  getSenderAddress: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "shipping_labels");
    return await getStoreSenderAddress(ctx.store.id);
  }),

  setSenderAddress: storeOwnerProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        street: z.string().min(1),
        postalCode: z.string().min(1),
        city: z.string().min(1),
        country: z.string().min(2).default("CH"),
      })
    )
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "shipping_labels");
      return await setStoreSenderAddress(ctx.store.id, input);
    }),

  getStoreLabels: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "shipping_labels");
    return await getStoreShippingLabels(ctx.store.id);
  }),

  generateLabel: storeOwnerProcedure
    .input(generateLabelSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "shipping_labels");
      return await createShippingLabelForOrder(ctx.store.id, input);
    }),

  getLabelHtml: storeOwnerProcedure
    .input(z.object({ trackingNumber: z.string() }))
    .query(async ({ input }) => {
      const label = await getShippingLabelByTracking(input.trackingNumber);
      if (!label) throw new Error("Étiquette introuvable.");
      return renderPrintableLabelHtml(label);
    }),

  getPublicTrackingDetails: publicProcedure
    .input(z.object({ trackingNumber: z.string().min(1) }))
    .query(async ({ input }) => {
      const label = await getShippingLabelByTracking(input.trackingNumber);
      if (!label) throw new Error("Aucun colis trouvé avec ce numéro de suivi.");
      return label;
    }),

  updateTrackingEvent: storeOwnerProcedure
    .input(updateTrackingStatusSchema)
    .mutation(async ({ input }) => {
      return await updateLabelTrackingStatus(input);
    }),
});
