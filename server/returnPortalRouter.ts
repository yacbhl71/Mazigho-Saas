import { requireStoreSaasFeature } from "./featureAccess";
import { router, storeOwnerProcedure, protectedProcedure } from "./_core/trpc";
import {
  createReturnRequestSchema,
  updateReturnStatusSchema,
} from "../shared/returnPortal";
import {
  createReturnRequest,
  getCustomerReturnRequests,
  getStoreReturnRequests,
  updateReturnStatus,
} from "./db/returnPortalStorage";

export const returnPortalRouter = router({
  createRequest: protectedProcedure
    .input(createReturnRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.store) throw new Error("Boutique introuvable.");
      return await createReturnRequest(ctx.store.id, ctx.user.id, input);
    }),

  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.store) throw new Error("Boutique introuvable.");
    return await getCustomerReturnRequests(ctx.store.id, ctx.user.id);
  }),

  getStoreRequests: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "return_portal");
    return await getStoreReturnRequests(ctx.store.id);
  }),

  updateStatus: storeOwnerProcedure
    .input(updateReturnStatusSchema)
    .mutation(async ({ ctx, input }) => {
    await requireStoreSaasFeature(ctx.store.id, "return_portal");
      return await updateReturnStatus(ctx.store.id, input);
    }),
});
