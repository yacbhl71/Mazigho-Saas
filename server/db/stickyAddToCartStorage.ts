import {
  StickyAddToCartConfig,
  stickyAddToCartConfigSchema,
} from "../../shared/stickyAddToCart";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeStickyConfigs = new Map<number, StickyAddToCartConfig>();
const SETTING_KEY = "feature_sticky_add_to_cart";

export async function getStickyAddToCartConfig(
  storeId: number
): Promise<StickyAddToCartConfig> {
  const existing = storeStickyConfigs.get(storeId);
  if (existing) return existing;
  const persisted = await readPersistentStoreSetting<StickyAddToCartConfig | null>(storeId, SETTING_KEY, null);
  if (persisted) { storeStickyConfigs.set(storeId, persisted); return persisted; }

  const defaultConfig: StickyAddToCartConfig = {
    storeId,
    enabled: true,
    showOnMobile: true,
    showPriceAndImage: true,
  };

  storeStickyConfigs.set(storeId, defaultConfig);
  return defaultConfig;
}

export async function saveStickyAddToCartConfig(
  storeId: number,
  input: z.infer<typeof stickyAddToCartConfigSchema>
): Promise<StickyAddToCartConfig> {
  const current = await getStickyAddToCartConfig(storeId);
  const updated: StickyAddToCartConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeStickyConfigs.set(storeId, updated);
  await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration persistante de la fonctionnalité");
  return updated;
}
