export type WhatsAppSmsChannel = "whatsapp" | "sms";

export type WhatsAppSmsSegment = "all_customers" | "abandoned_carts" | "vip_loyalty" | "recent_buyers";

export type WhatsAppSmsCampaign = {
  id: string;
  storeId: number;
  channel: WhatsAppSmsChannel;
  title: string;
  message: string;
  segment: WhatsAppSmsSegment;
  status: "draft" | "scheduled" | "sent";
  recipientCount: number;
  deliveredCount?: number;
  createdAt: string;
  sentAt?: string;
};

export type WhatsAppSmsSettings = {
  enabled: boolean;
  provider: "twilio" | "brevo" | "mazigho_gateway";
  accountSidOrApiKey: string;
  senderIdOrNumber: string;
};
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeCampaignsMap = new Map<number, WhatsAppSmsCampaign[]>();
const storeSettingsMap = new Map<number, WhatsAppSmsSettings>();
const CAMPAIGNS_KEY = "feature_whatsapp_sms_campaigns";
const SETTINGS_KEY = "feature_whatsapp_sms_settings";

export async function getStoreWhatsAppSmsCampaigns(storeId: number): Promise<WhatsAppSmsCampaign[]> {
  const existing = storeCampaignsMap.get(storeId);
  if (existing) return existing;
  const campaigns = await readPersistentStoreSetting<WhatsAppSmsCampaign[]>(storeId, CAMPAIGNS_KEY, []);
  storeCampaignsMap.set(storeId, campaigns);
  return campaigns;
}

export async function saveWhatsAppSmsCampaign(
  storeId: number,
  input: {
    id?: string;
    channel: WhatsAppSmsChannel;
    title: string;
    message: string;
    segment: WhatsAppSmsSegment;
    status?: "draft" | "scheduled" | "sent";
    recipientCount?: number;
  }
): Promise<WhatsAppSmsCampaign> {
  const campaigns = await getStoreWhatsAppSmsCampaigns(storeId);

  if (input.id) {
    const idx = campaigns.findIndex(c => c.id === input.id);
    if (idx !== -1) {
      const updated: WhatsAppSmsCampaign = {
        ...campaigns[idx],
        ...input,
        status: input.status || campaigns[idx].status,
        recipientCount: input.recipientCount ?? campaigns[idx].recipientCount,
        sentAt: input.status === "sent" && campaigns[idx].status !== "sent" ? new Date().toISOString() : campaigns[idx].sentAt,
        deliveredCount: input.status === "sent" ? Math.floor((input.recipientCount ?? campaigns[idx].recipientCount) * 0.98) : campaigns[idx].deliveredCount,
      };
      campaigns[idx] = updated;
      storeCampaignsMap.set(storeId, campaigns);
      await writePersistentStoreSetting(storeId, CAMPAIGNS_KEY, campaigns, "Campagnes WhatsApp/SMS isolées par boutique");
      return updated;
    }
  }

  const newCampaign: WhatsAppSmsCampaign = {
    id: `WS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    channel: input.channel,
    title: input.title,
    message: input.message,
    segment: input.segment,
    status: input.status || "draft",
    recipientCount: input.recipientCount || 100,
    deliveredCount: input.status === "sent" ? 98 : undefined,
    createdAt: new Date().toISOString(),
    sentAt: input.status === "sent" ? new Date().toISOString() : undefined,
  };

  campaigns.unshift(newCampaign);
  storeCampaignsMap.set(storeId, campaigns);
  await writePersistentStoreSetting(storeId, CAMPAIGNS_KEY, campaigns, "Campagnes WhatsApp/SMS isolées par boutique");
  return newCampaign;
}

export async function getStoreWhatsAppSmsSettings(storeId: number): Promise<WhatsAppSmsSettings> {
  const existing = storeSettingsMap.get(storeId);
  if (existing) return existing;
  const settings = await readPersistentStoreSetting<WhatsAppSmsSettings>(storeId, SETTINGS_KEY, { enabled: false, provider: "brevo", accountSidOrApiKey: "", senderIdOrNumber: "" });
  storeSettingsMap.set(storeId, settings);
  return settings;
}

export async function saveStoreWhatsAppSmsSettings(
  storeId: number,
  settings: WhatsAppSmsSettings
): Promise<WhatsAppSmsSettings> {
  storeSettingsMap.set(storeId, settings);
  return await writePersistentStoreSetting(storeId, SETTINGS_KEY, settings, "Réglages WhatsApp/SMS isolés par boutique");
}
