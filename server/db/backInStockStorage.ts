import {
  BackInStockSubscription,
  subscribeBackInStockSchema,
} from "../../shared/backInStock";
import { z } from "zod";
import { sendTransactionalEmail } from "../transactionalEmail";

const storeBackInStockMap = new Map<number, BackInStockSubscription[]>();

export async function subscribeToBackInStock(
  storeId: number,
  input: z.infer<typeof subscribeBackInStockSchema>
): Promise<BackInStockSubscription> {
  const subscriptions = storeBackInStockMap.get(storeId) || [];

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
  storeBackInStockMap.set(storeId, subscriptions);

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
  const subscriptions = storeBackInStockMap.get(storeId) || [];
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

  storeBackInStockMap.set(storeId, subscriptions);

  return { notifiedCount: count };
}
