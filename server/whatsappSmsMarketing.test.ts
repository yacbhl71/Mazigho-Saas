import { describe, it, expect } from "vitest";
import {
  getStoreWhatsAppSmsCampaigns,
  saveWhatsAppSmsCampaign,
  getStoreWhatsAppSmsSettings,
  saveStoreWhatsAppSmsSettings,
} from "./db/whatsappSmsStorage";

describe("WhatsApp & SMS Marketing Storage & Operations", () => {
  const storeId = 999;

  it("should start without demo campaigns or credentials", async () => {
    const campaigns = await getStoreWhatsAppSmsCampaigns(storeId);
    expect(campaigns).toEqual([]);

    const settings = await getStoreWhatsAppSmsSettings(storeId);
    expect(settings.enabled).toBe(false);
    expect(settings.accountSidOrApiKey).toBe("");
    expect(settings.senderIdOrNumber).toBe("");
  });

  it("should create and update a marketing campaign", async () => {
    const created = await saveWhatsAppSmsCampaign(storeId, {
      channel: "whatsapp",
      title: "Test Campaign WhatsApp",
      message: "Bonjour test message",
      segment: "vip_loyalty",
      status: "draft",
      recipientCount: 50,
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Test Campaign WhatsApp");
    expect(created.status).toBe("draft");

    const updated = await saveWhatsAppSmsCampaign(storeId, {
      id: created.id,
      channel: "whatsapp",
      title: "Test Campaign WhatsApp Updated",
      message: "Bonjour test message updated",
      segment: "vip_loyalty",
      status: "sent",
      recipientCount: 50,
    });
    expect(updated.title).toBe("Test Campaign WhatsApp Updated");
    expect(updated.status).toBe("sent");
    expect(updated.sentAt).toBeDefined();
  });

  it("should save and update settings", async () => {
    const newSettings = {
      enabled: true,
      provider: "twilio" as const,
      accountSidOrApiKey: "AC_TEST_123",
      senderIdOrNumber: "+41791234567",
    };
    const saved = await saveStoreWhatsAppSmsSettings(storeId, newSettings);
    expect(saved.provider).toBe("twilio");
    expect(saved.accountSidOrApiKey).toBe("AC_TEST_123");
  });
});
