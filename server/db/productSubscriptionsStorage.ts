import {
  CustomerSubscription,
  ProductSubscriptionsConfig,
  subscriptionsConfigSchema,
  createSubscriptionSchema,
} from "../../shared/productSubscriptions";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeSubConfigs = new Map<number, ProductSubscriptionsConfig>();
const SETTING_KEY = "feature_product_subscriptions";
const storeSubscriptionsMap = new Map<number, CustomerSubscription[]>();

export async function getSubscriptionConfig(
  storeId: number
): Promise<ProductSubscriptionsConfig> {
  const existing = storeSubConfigs.get(storeId);
  if (existing) return existing;

  const defaultConfig: ProductSubscriptionsConfig = {
    storeId,
    enabled: true,
    defaultDiscountPercentage: 10,
    supportedFrequencies: ["2_WEEKS", "1_MONTH", "2_MONTHS"],
  };

  const persisted = await readPersistentStoreSetting(storeId, SETTING_KEY, defaultConfig);
  const config = { ...defaultConfig, ...persisted, storeId };
  storeSubConfigs.set(storeId, config);
  return config;
}

export async function saveSubscriptionConfig(
  storeId: number,
  input: z.infer<typeof subscriptionsConfigSchema>
): Promise<ProductSubscriptionsConfig> {
  const current = await getSubscriptionConfig(storeId);
  const updated: ProductSubscriptionsConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeSubConfigs.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration des abonnements isolée par boutique");
}

export async function createCustomerSubscription(
  storeId: number,
  userId: number,
  input: z.infer<typeof createSubscriptionSchema>
): Promise<CustomerSubscription> {
  const config = await getSubscriptionConfig(storeId);
  if (!config.enabled) {
    throw new Error("Le service d'abonnement est désactivé actuellement.");
  }

  const storeSubs = storeSubscriptionsMap.get(storeId) || [];

  const discountPercentage = config.defaultDiscountPercentage;
  const finalPriceCents = Math.round(
    input.priceCents * (1 - discountPercentage / 100)
  );

  const nextDate = new Date();
  if (input.frequency === "2_WEEKS") nextDate.setDate(nextDate.getDate() + 14);
  else if (input.frequency === "1_MONTH") nextDate.setMonth(nextDate.getMonth() + 1);
  else if (input.frequency === "2_MONTHS") nextDate.setMonth(nextDate.getMonth() + 2);
  else if (input.frequency === "3_MONTHS") nextDate.setMonth(nextDate.getMonth() + 3);

  const newSub: CustomerSubscription = {
    id: `SUB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    userId,
    productId: input.productId,
    productTitle: input.productTitle,
    priceCents: input.priceCents,
    discountPercentage,
    finalPriceCents,
    frequency: input.frequency,
    nextDeliveryDate: nextDate.toISOString(),
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  storeSubs.unshift(newSub);
  storeSubscriptionsMap.set(storeId, storeSubs);

  return newSub;
}

export async function getCustomerSubscriptions(
  storeId: number,
  userId: number
): Promise<CustomerSubscription[]> {
  const storeSubs = storeSubscriptionsMap.get(storeId) || [];
  return storeSubs.filter((s) => s.userId === userId);
}

export async function getStoreSubscriptions(
  storeId: number
): Promise<CustomerSubscription[]> {
  return storeSubscriptionsMap.get(storeId) || [];
}
