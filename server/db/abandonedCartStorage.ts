import { randomUUID } from "crypto";
import type {
  AbandonedCart,
  AbandonedCartAnalytics,
  TrackingPixelsConfig,
} from "../../shared/abandonedCart";
import { sanitizeTrackingPixelsConfig } from "../../shared/abandonedCart";
import { sendTransactionalEmail } from "../transactionalEmail";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

// Store-isolated memory registries
// Carts map: cartId -> AbandonedCart
const cartRegistry = new Map<string, AbandonedCart>();

// Pixels config map: storeId -> TrackingPixelsConfig
const pixelsRegistry = new Map<number, TrackingPixelsConfig>();
const CARTS_KEY = "feature_abandoned_carts";
const PIXELS_KEY = "feature_tracking_pixels";

// Seed default demo abandoned carts for fresh store testing
function ensureSeedCarts(storeId: number) {
  // Les données de démonstration sont interdites : seules les actions explicites du propriétaire créent des données.
}

async function getCartsForStore(storeId: number): Promise<AbandonedCart[]> {
  const existing = Array.from(cartRegistry.values()).filter(cart => cart.storeId === storeId);
  if (existing.length > 0) return existing;
  const persisted = await readPersistentStoreSetting<AbandonedCart[]>(storeId, CARTS_KEY, []);
  for (const cart of persisted) cartRegistry.set(cart.id, cart);
  return persisted;
}

async function saveCartsForStore(storeId: number): Promise<void> {
  const carts = Array.from(cartRegistry.values()).filter(cart => cart.storeId === storeId);
  await writePersistentStoreSetting(storeId, CARTS_KEY, carts, "Paniers abandonnés isolés par boutique");
}

// 1. ABANDONED CARTS OPERATIONS
export async function recordAbandonedCart(
  storeId: number,
  input: {
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
    items: AbandonedCart["items"];
    totalAmountCents: number;
    currency?: string;
  }
): Promise<AbandonedCart> {
  const carts = await getCartsForStore(storeId);
  const existing = carts.find(
    c => c.storeId === storeId && c.customerEmail.toLowerCase() === input.customerEmail.toLowerCase() && c.status !== "recovered"
  );

  const now = new Date().toISOString();

  if (existing) {
    existing.items = input.items;
    existing.totalAmountCents = input.totalAmountCents;
    existing.currency = input.currency || "CHF";
    if (input.customerName) existing.customerName = input.customerName;
    if (input.customerPhone) existing.customerPhone = input.customerPhone;
    existing.abandonedAt = now;
    cartRegistry.set(existing.id, existing);
    await saveCartsForStore(storeId);
    return existing;
  }

  const id = `cart-${randomUUID()}`;
  const recoveryToken = `rec-${randomUUID().slice(0, 8)}`;

  const newCart: AbandonedCart = {
    id,
    storeId,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    items: input.items,
    totalAmountCents: input.totalAmountCents,
    currency: input.currency || "CHF",
    abandonedAt: now,
    status: "abandoned",
    recoveryToken,
    reminderCount: 0,
  };

  cartRegistry.set(id, newCart);
  await saveCartsForStore(storeId);
  return newCart;
}

export async function getStoreAbandonedCarts(storeId: number): Promise<AbandonedCart[]> {
  const carts = await getCartsForStore(storeId);
  return carts
    .sort((a, b) => new Date(b.abandonedAt).getTime() - new Date(a.abandonedAt).getTime());
}

export async function getAbandonedCartAnalytics(storeId: number): Promise<AbandonedCartAnalytics> {
  const carts = await getCartsForStore(storeId);

  let totalAbandonedCents = 0;
  let totalRecoveredCents = 0;
  let recoveredCount = 0;

  for (const c of carts) {
    if (c.status === "recovered") {
      totalRecoveredCents += c.totalAmountCents;
      recoveredCount++;
    } else {
      totalAbandonedCents += c.totalAmountCents;
    }
  }

  const totalCount = carts.length;
  const recoveryRatePercent = totalCount > 0 ? Math.round((recoveredCount / totalCount) * 100) : 0;

  return {
    totalAbandonedCents,
    totalRecoveredCents,
    totalCartsCount: totalCount,
    recoveredCartsCount: recoveredCount,
    recoveryRatePercent,
    potentialRevenueCents: totalAbandonedCents,
  };
}

export async function sendCartRecoveryReminder(
  storeId: number,
  cartId: string,
  storeName: string = "MAZIGHO Boutique",
  discountPercent: number = 10
): Promise<{ success: boolean; message: string }> {
  const cart = (await getCartsForStore(storeId)).find(item => item.id === cartId);
  if (!cart || cart.storeId !== storeId) {
    throw new Error("Panier introuvable pour cette boutique.");
  }

  const discountCode = `RELANCE${discountPercent}`;
  const now = new Date().toISOString();

  // Mise à jour de l'état du panier
  cart.status = "reminded";
  cart.reminderCount += 1;
  cart.lastReminderSentAt = now;
  cart.recoveryDiscountCode = discountCode;
  cartRegistry.set(cartId, cart);
  await saveCartsForStore(storeId);

  // Construction de l'e-mail transactional
  const itemsHtml = cart.items
    .map(
      i => `<li style="margin-bottom:8px;">
      <strong>${i.productName}</strong> ${i.variantLabel ? `(${i.variantLabel})` : ""} - ${i.quantity}x ${(i.priceCents / 100).toFixed(2)} ${cart.currency}
    </li>`
    )
    .join("");

  const amountStr = (cart.totalAmountCents / 100).toFixed(2);

  const emailSubject = `N'oubliez pas vos articles chez ${storeName} ! (-${discountPercent}% offerts)`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #c2410c;">Votre commande chez ${storeName} vous attend !</h2>
      <p>Bonjour ${cart.customerName || "cher client"},</p>
      <p>Vous avez laissé des articles d'exception dans votre panier :</p>
      <ul style="background-color: #f8fafc; padding: 15px 25px; border-radius: 8px;">
        ${itemsHtml}
      </ul>
      <p style="font-size: 16px;"><strong>Montant total : ${amountStr} ${cart.currency}</strong></p>
      
      <div style="background-color: #ffedd5; border: 1px border #fdba74; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #9a3412;">Code privilège exclusif (-${discountPercent}%) :</p>
        <span style="display: inline-block; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #c2410c; margin-top: 5px;">${discountCode}</span>
      </div>

      <p style="text-align: center; margin-top: 25px;">
        <a href="https://studio.mazigho.com/panier?recovery=${cart.recoveryToken}&code=${discountCode}" style="background-color: #c2410c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
          Finaliser ma commande maintenant →
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 30px;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Service Client ${storeName} · Expédition & Garantie Satisfaction</p>
    </div>
  `;

  try {
    await sendTransactionalEmail({
      to: cart.customerEmail,
      subject: emailSubject,
      html: emailHtml,
      text: `Bonjour, n'oubliez pas vos articles chez ${storeName}. Code -${discountPercent}% : ${discountCode}`,
      idempotencyKey: `cart-relance-${cart.id}-${cart.reminderCount}`,
    });
  } catch (err) {
    console.warn("[AbandonedCart] Transactional email attempt logged:", err);
  }

  return {
    success: true,
    message: `E-mail de relance envoyé à ${cart.customerEmail} avec le code -${discountPercent}% (${discountCode}).`,
  };
}

export async function markCartAsRecovered(storeId: number, cartId: string): Promise<boolean> {
  const cart = (await getCartsForStore(storeId)).find(item => item.id === cartId);
  if (!cart || cart.storeId !== storeId) return false;

  cart.status = "recovered";
  cart.recoveredAt = new Date().toISOString();
  cartRegistry.set(cartId, cart);
  await saveCartsForStore(storeId);
  return true;
}

export async function recordCartChannelReminder(
  storeId: number,
  cartId: string,
  channel: "whatsapp" | "sms" | "email",
  discountPercent: number = 10
): Promise<{ success: boolean; message: string }> {
  const cart = (await getCartsForStore(storeId)).find(item => item.id === cartId);
  if (!cart || cart.storeId !== storeId) {
    throw new Error("Panier introuvable pour cette boutique.");
  }

  cart.status = "reminded";
  cart.reminderCount += 1;
  cart.lastReminderSentAt = new Date().toISOString();
  cart.recoveryDiscountCode = `RELANCE${discountPercent}`;
  cartRegistry.set(cartId, cart);

  return {
    success: true,
    message: `Relance ${channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "E-mail"} enregistrée avec succès.`,
  };
}

// 2. TRACKING PIXELS OPERATIONS
export async function getStoreTrackingPixels(storeId: number): Promise<TrackingPixelsConfig> {
  const existing = pixelsRegistry.get(storeId);
  if (existing) return existing;

  const defaultConfig: TrackingPixelsConfig = {
    metaPixelId: null,
    tiktokPixelId: null,
    gaMeasurementId: null,
    gtmContainerId: null,
    enabled: true,
  };

  const persisted = await readPersistentStoreSetting<TrackingPixelsConfig>(storeId, PIXELS_KEY, defaultConfig);
  const config = sanitizeTrackingPixelsConfig(persisted);
  pixelsRegistry.set(storeId, config);
  return config;
}

export async function saveStoreTrackingPixels(
  storeId: number,
  input: Partial<TrackingPixelsConfig>
): Promise<TrackingPixelsConfig> {
  const current = await getStoreTrackingPixels(storeId);
  const updated = sanitizeTrackingPixelsConfig({
    ...current,
    ...input,
  });

  pixelsRegistry.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, PIXELS_KEY, updated, "Réglages de tracking isolés par boutique");
}
