import { z } from "zod";
import { router, storeOwnerProcedure, publicProcedure } from "./_core/trpc";
import {
  submitReviewSchema,
  reviewsConfigSchema,
  moderateReviewSchema,
} from "../shared/productReviewsUgc";
import {
  getReviewsConfig,
  saveReviewsConfig,
  createProductReview,
  getStoreReviews,
  getProductPublicReviews,
  moderateReview,
} from "./db/productReviewsUgcStorage";
import { hasStoreSaasFeature } from "./db";

export const productReviewsUgcRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const config = await getReviewsConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && await hasStoreSaasFeature(storeId, "reviews_ugc")) };
  }),

  saveConfig: storeOwnerProcedure
    .input(reviewsConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return await saveReviewsConfig(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "reviews_ugc")) });
    }),

  getPublicReviews: publicProcedure
    .input(z.object({ productId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const storeId = ctx.store?.id || 1;
      if (!await hasStoreSaasFeature(storeId, "reviews_ugc")) return { reviews: [], averageRating: 0, totalReviews: 0 };
      return await getProductPublicReviews(storeId, input.productId);
    }),

  submitReview: publicProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const storeId = ctx.store?.id || 1;
      if (!await hasStoreSaasFeature(storeId, "reviews_ugc")) throw new Error("REVIEWS_FEATURE_NOT_INCLUDED");
      return await createProductReview(storeId, input);
    }),

  getStoreReviews: storeOwnerProcedure.query(async ({ ctx }) => {
    return await getStoreReviews(ctx.store.id);
  }),

  moderateReview: storeOwnerProcedure
    .input(moderateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return await moderateReview(ctx.store.id, input);
    }),
});
