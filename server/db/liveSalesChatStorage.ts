import {
  LiveSalesChatConfig,
  liveSalesChatConfigSchema,
} from "../../shared/liveSalesChat";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeChatConfigs = new Map<number, LiveSalesChatConfig>();
const SETTING_KEY = "feature_live_sales_chat";

export async function getLiveSalesChatConfig(
  storeId: number
): Promise<LiveSalesChatConfig> {
  const existing = storeChatConfigs.get(storeId);
  if (existing) return existing;

  const defaultConfig: LiveSalesChatConfig = {
    storeId,
    enabled: true,
    whatsappNumber: "+41791234567",
    welcomeMessage: "Bonjour ! Une question sur un produit ? Écrivez-nous directement sur WhatsApp !",
    position: "bottom-right",
    showMessenger: false,
  };

  const persisted = await readPersistentStoreSetting(storeId, SETTING_KEY, defaultConfig);
  const config = { ...defaultConfig, ...persisted, storeId };
  storeChatConfigs.set(storeId, config);
  return config;
}

export async function saveLiveSalesChatConfig(
  storeId: number,
  input: z.infer<typeof liveSalesChatConfigSchema>
): Promise<LiveSalesChatConfig> {
  const current = await getLiveSalesChatConfig(storeId);
  const updated: LiveSalesChatConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeChatConfigs.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration du chat commercial isolée par boutique");
}
