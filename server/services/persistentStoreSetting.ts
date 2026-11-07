import { getStoreSettingValue, setStoreSettingValue } from "../db";

export async function readPersistentStoreSetting<T>(storeId: number, key: string, fallback: T): Promise<T> {
  const raw = await getStoreSettingValue(storeId, key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writePersistentStoreSetting<T>(storeId: number, key: string, value: T, description: string): Promise<T> {
  await setStoreSettingValue(storeId, key, JSON.stringify(value), description);
  return value;
}
