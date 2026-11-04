import { publicProcedure, router, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { spinToWinSettingsSchema } from "../shared/spinToWinGamification";
import { z } from "zod";

export const spinToWinRouter = router({
  getSettings: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    return db.getSpinToWinSettings(storeId);
  }),

  saveSettings: storeOwnerProcedure.input(spinToWinSettingsSchema).mutation(async ({ ctx, input }) => {
    return db.saveSpinToWinSettings(ctx.store.id, input);
  }),

  claimReward: publicProcedure.input(z.object({
    email: z.string().email("Adresse email requise"),
    rewardCode: z.string().min(1),
    rewardLabel: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const storeId = ctx.store?.id || 1;
    const reward = await db.claimSpinToWinReward(storeId, input.rewardCode, input.rewardLabel);
    console.log(`[SpinToWin] Lead captured for store ${storeId}: ${input.email} -> ${reward.code} (${reward.label})`);
    return { success: true, message: `Code ${reward.code} débloqué pour ${input.email} !`, code: reward.code };
  }),
});
