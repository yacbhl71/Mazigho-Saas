import {
  FbtBundle,
  fbtBundleSchema,
} from "../../shared/frequentlyBoughtTogether";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeFbtBundlesMap = new Map<number, FbtBundle[]>();
const SETTING_KEY = "feature_frequently_bought_together";
async function getBundles(storeId: number) {
  const cached = storeFbtBundlesMap.get(storeId);
  if (cached) return cached;
  const persisted = await readPersistentStoreSetting<FbtBundle[]>(storeId, SETTING_KEY, []);
  storeFbtBundlesMap.set(storeId, persisted);
  return persisted;
}
async function saveBundles(storeId: number, value: FbtBundle[]) {
  storeFbtBundlesMap.set(storeId, value);
  await writePersistentStoreSetting(storeId, SETTING_KEY, value, "Achats fréquents isolés par boutique");
}

export async function getStoreFbtBundles(storeId: number): Promise<FbtBundle[]> {
  return await getBundles(storeId);
}

export async function saveFbtBundle(
  storeId: number,
  input: z.infer<typeof fbtBundleSchema>
): Promise<FbtBundle> {
  const storeBundles = await getBundles(storeId);

  if (input.id) {
    const idx = storeBundles.findIndex((b) => b.id === input.id);
    if (idx !== -1) {
      const updated: FbtBundle = {
        ...storeBundles[idx],
        ...input,
        storeId,
      };
      storeBundles[idx] = updated;
      await saveBundles(storeId, storeBundles);
      return updated;
    }
  }

  const newBundle: FbtBundle = {
    id: `FBT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    mainProductId: input.mainProductId,
    addonProductIds: input.addonProductIds,
    discountPercentage: input.discountPercentage,
    title: input.title || "Fréquemment Achetés Ensemble",
    enabled: input.enabled ?? true,
    createdAt: new Date().toISOString(),
  };

  storeBundles.unshift(newBundle);
  await saveBundles(storeId, storeBundles);

  return newBundle;
}

export async function getFbtBundleForProduct(
  storeId: number,
  mainProductId: number
): Promise<FbtBundle | null> {
  const storeBundles = (await getBundles(storeId)).filter((b) => b.enabled);
  return storeBundles.find((b) => b.mainProductId === mainProductId) || null;
}
