import {
  BackInStockSubscription,
  subscribeBackInStockSchema,
} from "../../shared/backInStock";
import { z } from "zod";
import { sendTransactionalEmail } from "../transactionalEmail";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeBackInStockMap = new Map<number, BackInStockSubscription[]>();
const SETTING_KEY = "feature_back_in_stock_subscriptions";
async function getSubscriptions(storeId: number) {
  const cached = storeBackInStockMap.get(storeId);
  if (cached) return cached;
  const persisted = await readPersistentStoreSetting<BackInStockSubscription[]>(storeId, SETTING_KEY, []);
  storeBackInStockMap.set(storeId, persisted);
  return persisted;
}
async function saveSubscriptions(storeId: number, value: BackInStockSubscription[]) {
  storeBackInStockMap.set(storeId, value);
  await writePersistentStoreSetting(storeId, SETTING_KEY, value, "Abonnements retour en stock isolés par boutique");
}

export async function subscribeToBackInStock(
  storeId: number,
  input: z.infer<typeof subscribeBackInStockSchema>
): Promise<BackInStockSubscription> {
  const subscriptions = await getSubscriptions(storeId);

  const existing = subscriptions.find(
    (s) => s.productId === input.productId && s.customerEmail.toLowerCase() === input.customerEmail.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const newSub: BackInStockSubscription = {
    id: `BIS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    productId: input.productId,
    productTitle: input.productTitle,
    customerEmail: input.customerEmail.toLowerCase().trim(),
    notified: false,
    createdAt: new Date().toISOString(),
  };

  subscriptions.unshift(newSub);
  await saveSubscriptions(storeId, subscriptions);

  return newSub;
}

export async function getStoreBackInStockSubscriptions(
  storeId: number
): Promise<BackInStockSubscription[]> {
  return storeBackInStockMap.get(storeId) || [];
}

export async function notifyBackInStockForProduct(
  storeId: number,
  productId: number
): Promise<{ notifiedCount: number }> {
  const subscriptions = await getSubscriptions(storeId);
  const pending = subscriptions.filter((s) => s.productId === productId && !s.notified);

  let count = 0;
  for (const sub of pending) {
    sub.notified = true;
    count++;

    // Fire transactional email notification
    try {
      await sendTransactionalEmail({
        to: sub.customerEmail,
        subject: `[Retour en Stock] ${sub.productTitle} est de nouveau disponible !`,
        html: `<p>Bonne nouvelle ! L'article <strong>${sub.productTitle}</strong> est de nouveau en stock dans notre boutique.</p><p>Rendez-vous vite sur notre site pour commander avant la fin des stocks !</p>`,
        text: `Bonne nouvelle ! L'article ${sub.productTitle} est de nouveau en stock dans notre boutique.\n\nRendez-vous vite sur notre site pour commander avant la fin des stocks !`,
        idempotencyKey: `bis-${sub.id}`,
      });
    } catch {
      // Ignore if email alert service unavailable
    }
  }

  await saveSubscriptions(storeId, subscriptions);

  return { notifiedCount: count };
}
