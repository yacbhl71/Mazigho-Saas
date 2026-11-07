import { publicProcedure, router, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { spinToWinSettingsSchema } from "../shared/spinToWinGamification";
import { z } from "zod";
import { hasStoreSaasFeature } from "./db";

export const spinToWinRouter = router({
  getSettings: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const settings = await db.getSpinToWinSettings(storeId);
    return { ...settings, enabled: Boolean(settings.enabled && await hasStoreSaasFeature(storeId, "spin_to_win")) };
  }),

  saveSettings: storeOwnerProcedure.input(spinToWinSettingsSchema).mutation(async ({ ctx, input }) => {
    return db.saveSpinToWinSettings(ctx.store.id, { ...input, enabled: Boolean(input.enabled && await hasStoreSaasFeature(ctx.store.id, "spin_to_win")) });
  }),

  claimReward: publicProcedure.input(z.object({
    email: z.string().email("Adresse email requise"),
    rewardCode: z.string().min(1),
    rewardLabel: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const storeId = ctx.store?.id || 1;
    if (!await hasStoreSaasFeature(storeId, "spin_to_win")) return { success: false, message: "Fonctionnalité réservée à une offre premium.", code: null };
    const reward = await db.claimSpinToWinReward(storeId, input.rewardCode, input.rewardLabel);
    console.log(`[SpinToWin] Lead captured for store ${storeId}: ${input.email} -> ${reward.code} (${reward.label})`);
    return { success: true, message: `Code ${reward.code} débloqué pour ${input.email} !`, code: reward.code };
  }),
});
