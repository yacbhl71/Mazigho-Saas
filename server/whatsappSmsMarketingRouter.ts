import { z } from "zod";
import { router, storeOwnerProcedure } from "./_core/trpc";
import { requireStoreSaasFeature } from "./featureAccess";
import {
  getStoreWhatsAppSmsCampaigns,
  saveWhatsAppSmsCampaign,
  getStoreWhatsAppSmsSettings,
  saveStoreWhatsAppSmsSettings,
} from "./db/whatsappSmsStorage";

export const whatsappSmsMarketingRouter = router({
  getCampaigns: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "whatsapp_sms_marketing");
    return await getStoreWhatsAppSmsCampaigns(ctx.store.id);
  }),

  saveCampaign: storeOwnerProcedure
    .input(
      z.object({
        id: z.string().optional(),
        channel: z.enum(["whatsapp", "sms"]),
        title: z.string().min(2),
        message: z.string().min(5),
        segment: z.enum(["all_customers", "abandoned_carts", "vip_loyalty", "recent_buyers"]),
        status: z.enum(["draft", "scheduled", "sent"]).optional(),
        recipientCount: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "whatsapp_sms_marketing");
      return await saveWhatsAppSmsCampaign(ctx.store.id, input);
    }),

  getSettings: storeOwnerProcedure.query(async ({ ctx }) => {
    await requireStoreSaasFeature(ctx.store.id, "whatsapp_sms_marketing");
    return await getStoreWhatsAppSmsSettings(ctx.store.id);
  }),

  saveSettings: storeOwnerProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        provider: z.enum(["twilio", "brevo", "mazigho_gateway"]),
        accountSidOrApiKey: z.string().min(3),
        senderIdOrNumber: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireStoreSaasFeature(ctx.store.id, "whatsapp_sms_marketing");
      return await saveStoreWhatsAppSmsSettings(ctx.store.id, input);
    }),
});
