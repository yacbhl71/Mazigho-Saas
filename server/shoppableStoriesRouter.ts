import { publicProcedure, router, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { shoppableStoriesConfigSchema } from "../shared/shoppableVideoStories";

export const shoppableStoriesRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    return db.getShoppableStoriesConfig(storeId);
  }),

  saveConfig: storeOwnerProcedure.input(shoppableStoriesConfigSchema).mutation(async ({ ctx, input }) => {
    return db.saveShoppableStoriesConfig(ctx.store.id, input);
  }),
});
