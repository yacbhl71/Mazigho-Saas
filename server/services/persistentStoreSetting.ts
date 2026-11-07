import * as storeDb from "../db";

type StoreSettingsApi = {
  getStoreSettingValue?: (storeId: number | undefined, key: string) => Promise<string | null>;
  setStoreSettingValue?: (storeId: number | undefined, key: string, value: string, description?: string) => Promise<unknown>;
};

export async function readPersistentStoreSetting<T>(storeId: number, key: string, fallback: T): Promise<T> {
  let raw: string | null = null;
  try {
    const getter = (storeDb as StoreSettingsApi).getStoreSettingValue;
    if (typeof getter === "function") raw = await getter(storeId, key);
  } catch {
    // Les tests ou un adaptateur sans storeSettings utilisent le fallback mémoire.
  }
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writePersistentStoreSetting<T>(storeId: number, key: string, value: T, description: string): Promise<T> {
  try {
    const setter = (storeDb as StoreSettingsApi).setStoreSettingValue;
    if (typeof setter === "function") await setter(storeId, key, JSON.stringify(value), description);
  } catch {
    // Les tests ou un adaptateur sans storeSettings restent fonctionnels en mémoire.
  }
  return value;
}
