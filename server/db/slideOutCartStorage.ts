import {
  SlideOutCartConfig,
  slideOutCartConfigSchema,
} from "../../shared/slideOutCartConfig";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeCartConfigs = new Map<number, SlideOutCartConfig>();
const SETTING_KEY = "feature_slide_out_cart";

export async function getSlideOutCartConfig(storeId: number): Promise<SlideOutCartConfig> {
  const existing = storeCartConfigs.get(storeId);
  if (existing) return existing;
  const persisted = await readPersistentStoreSetting<SlideOutCartConfig | null>(storeId, SETTING_KEY, null);
  if (persisted) { storeCartConfigs.set(storeId, persisted); return persisted; }

  const defaultConfig: SlideOutCartConfig = {
    storeId,
    enabled: true,
    freeShippingGoalEnabled: true,
    freeShippingThresholdCents: 10000, // 100 CHF default
    upsellEnabled: true,
    featuredUpsellProductIds: [],
    customShippingNote: "Livraison rapide assurée en 24-48h.",
  };

  storeCartConfigs.set(storeId, defaultConfig);
  return defaultConfig;
}

export async function saveSlideOutCartConfig(
  storeId: number,
  input: z.infer<typeof slideOutCartConfigSchema>
): Promise<SlideOutCartConfig> {
  const current = await getSlideOutCartConfig(storeId);

  const updated: SlideOutCartConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeCartConfigs.set(storeId, updated);
  await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration persistante de la fonctionnalité");
  return updated;
}
