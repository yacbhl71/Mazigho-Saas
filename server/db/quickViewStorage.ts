import {
  QuickViewConfig,
  quickViewConfigSchema,
} from "../../shared/quickViewConfig";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeQuickViewConfigs = new Map<number, QuickViewConfig>();
const SETTING_KEY = "feature_quick_view";

export async function getQuickViewConfig(storeId: number): Promise<QuickViewConfig> {
  const existing = storeQuickViewConfigs.get(storeId);
  if (existing) return existing;
  const persisted = await readPersistentStoreSetting<QuickViewConfig | null>(storeId, SETTING_KEY, null);
  if (persisted) { storeQuickViewConfigs.set(storeId, persisted); return persisted; }

  const defaultConfig: QuickViewConfig = {
    storeId,
    enabled: true,
    showVariantsMatrix: true,
    enableDirectAddToCart: true,
  };

  storeQuickViewConfigs.set(storeId, defaultConfig);
  return defaultConfig;
}

export async function saveQuickViewConfig(
  storeId: number,
  input: z.infer<typeof quickViewConfigSchema>
): Promise<QuickViewConfig> {
  const current = await getQuickViewConfig(storeId);

  const updated: QuickViewConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeQuickViewConfigs.set(storeId, updated);
  await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration persistante de la fonctionnalité");
  return updated;
}
