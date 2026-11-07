import {
  DigitalGiftCard,
  createGiftCardSchema,
  redeemGiftCardSchema,
} from "../../shared/digitalGiftCards";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeGiftCardsMap = new Map<number, DigitalGiftCard[]>();
const SETTING_KEY = "feature_digital_gift_cards";

export async function createStoreGiftCard(
  storeId: number,
  input: z.infer<typeof createGiftCardSchema>
): Promise<DigitalGiftCard> {
  const storeCards = storeGiftCardsMap.get(storeId) || [];

  const code = `GIFT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const card: DigitalGiftCard = {
    id: `CARD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    code,
    storeId,
    initialBalanceCents: input.initialBalanceCents,
    remainingBalanceCents: input.initialBalanceCents,
    recipientEmail: input.recipientEmail,
    senderName: input.senderName,
    message: input.message,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  storeCards.unshift(card);
  storeGiftCardsMap.set(storeId, storeCards);
  await writePersistentStoreSetting(storeId, SETTING_KEY, storeCards, "Cartes cadeaux isolées par boutique");

  return card;
}

export async function getStoreGiftCards(storeId: number): Promise<DigitalGiftCard[]> {
  const existing = storeGiftCardsMap.get(storeId);
  if (existing) return existing;
  const cards = await readPersistentStoreSetting<DigitalGiftCard[]>(storeId, SETTING_KEY, []);
  storeGiftCardsMap.set(storeId, cards);
  return cards;
}

export async function getGiftCardByCode(code: string, storeId?: number): Promise<DigitalGiftCard | null> {
  const stores = storeId ? [storeId] : Array.from(storeGiftCardsMap.keys());
  for (const currentStoreId of stores) {
    const cards = await getStoreGiftCards(currentStoreId);
    const found = cards.find((c: DigitalGiftCard) => c.code.toUpperCase() === code.toUpperCase().trim());
    if (found) return found;
  }
  return null;
}

export async function redeemGiftCardBalance(
  input: z.infer<typeof redeemGiftCardSchema>,
  storeId?: number
): Promise<{ success: boolean; redeemedCents: number; remainingBalanceCents: number }> {
  const card = await getGiftCardByCode(input.code, storeId);
  if (!card) {
    throw new Error("Carte-cadeau introuvable ou code expiré.");
  }

  if (card.status !== "ACTIVE" || card.remainingBalanceCents <= 0) {
    throw new Error("Cette carte-cadeau est épuisée ou inactive.");
  }

  const redeemedCents = Math.min(card.remainingBalanceCents, input.amountCents);
  card.remainingBalanceCents -= redeemedCents;

  if (card.remainingBalanceCents === 0) {
    card.status = "EXHAUSTED";
  }

  const cards = storeGiftCardsMap.get(card.storeId)!;
  const idx = cards.findIndex((c) => c.id === card.id);
  cards[idx] = card;
  storeGiftCardsMap.set(card.storeId, cards);
  await writePersistentStoreSetting(card.storeId, SETTING_KEY, cards, "Cartes cadeaux isolées par boutique");

  return {
    success: true,
    redeemedCents,
    remainingBalanceCents: card.remainingBalanceCents,
  };
}
