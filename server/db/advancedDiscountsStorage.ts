import {
  DiscountRule,
  EvaluatedDiscountResult,
  discountRuleSchema,
} from "../../shared/advancedDiscounts";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeRulesMap = new Map<number, DiscountRule[]>();
const SETTING_KEY = "feature_advanced_discount_rules";

export async function getStoreDiscountRules(storeId: number): Promise<DiscountRule[]> {
  const existing = storeRulesMap.get(storeId);
  if (existing) return existing;
  const rules = await readPersistentStoreSetting<DiscountRule[]>(storeId, SETTING_KEY, []);
  storeRulesMap.set(storeId, rules);
  return rules;
}

export async function saveStoreDiscountRule(
  storeId: number,
  input: z.infer<typeof discountRuleSchema>
): Promise<DiscountRule> {
  const storeRules = storeRulesMap.get(storeId) || [];

  if (input.id) {
    const idx = storeRules.findIndex((r) => r.id === input.id);
    if (idx !== -1) {
      const updated: DiscountRule = {
        ...storeRules[idx],
        ...input,
        storeId,
      };
      storeRules[idx] = updated;
      storeRulesMap.set(storeId, storeRules);
      await writePersistentStoreSetting(storeId, SETTING_KEY, storeRules, "Règles de remise isolées par boutique");
      return updated;
    }
  }

  const newRule: DiscountRule = {
    id: `DISC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    title: input.title,
    type: input.type,
    enabled: input.enabled ?? true,
    minSubtotalCents: input.minSubtotalCents,
    discountPercentage: input.discountPercentage,
    discountFixedCents: input.discountFixedCents,
    buyProductId: input.buyProductId,
    buyQuantity: input.buyQuantity,
    getDiscountedProductId: input.getDiscountedProductId,
    getDiscountPercentage: input.getDiscountPercentage,
    code: input.code ? input.code.toUpperCase().trim() : undefined,
    usageLimit: input.usageLimit,
    timesUsed: 0,
    createdAt: new Date().toISOString(),
  };

  storeRules.unshift(newRule);
  storeRulesMap.set(storeId, storeRules);
  await writePersistentStoreSetting(storeId, SETTING_KEY, storeRules, "Règles de remise isolées par boutique");

  return newRule;
}

export async function toggleStoreDiscountRule(
  storeId: number,
  ruleId: string,
  enabled: boolean
): Promise<DiscountRule> {
  const storeRules = storeRulesMap.get(storeId) || [];
  const idx = storeRules.findIndex((r) => r.id === ruleId);

  if (idx === -1) {
    throw new Error("Règle de réduction introuvable.");
  }

  storeRules[idx].enabled = enabled;
  storeRulesMap.set(storeId, storeRules);
  await writePersistentStoreSetting(storeId, SETTING_KEY, storeRules, "Règles de remise isolées par boutique");
  return storeRules[idx];
}

export async function deleteStoreDiscountRule(
  storeId: number,
  ruleId: string
): Promise<boolean> {
  const storeRules = storeRulesMap.get(storeId) || [];
  const filtered = storeRules.filter((r) => r.id !== ruleId);
  storeRulesMap.set(storeId, filtered);
  await writePersistentStoreSetting(storeId, SETTING_KEY, filtered, "Règles de remise isolées par boutique");
  return true;
}

export async function evaluateCartDiscounts(
  storeId: number,
  items: { productId: number; quantity: number; priceCents: number }[],
  cartSubtotalCents: number,
  activeCode?: string
): Promise<EvaluatedDiscountResult> {
  const rules = (storeRulesMap.get(storeId) || []).filter((r) => r.enabled);

  const appliedRules: { ruleId: string; title: string; discountCents: number }[] = [];
  let totalDiscountCents = 0;

  for (const rule of rules) {
    if (rule.type === "AUTOMATIC_TIER") {
      if (rule.minSubtotalCents && cartSubtotalCents >= rule.minSubtotalCents) {
        let discount = 0;
        if (rule.discountPercentage) {
          discount = Math.round((cartSubtotalCents * rule.discountPercentage) / 100);
        } else if (rule.discountFixedCents) {
          discount = Math.min(rule.discountFixedCents, cartSubtotalCents);
        }

        if (discount > 0) {
          appliedRules.push({
            ruleId: rule.id,
            title: rule.title,
            discountCents: discount,
          });
          totalDiscountCents += discount;
        }
      }
    } else if (rule.type === "BUY_X_GET_Y") {
      if (rule.buyProductId && rule.buyQuantity) {
        const buyItem = items.find((i) => i.productId === rule.buyProductId);
        if (buyItem && buyItem.quantity >= rule.buyQuantity) {
          const targetItem = items.find(
            (i) => i.productId === (rule.getDiscountedProductId || rule.buyProductId)
          );
          if (targetItem) {
            const numSets = Math.floor(buyItem.quantity / rule.buyQuantity);
            const discountPct = rule.getDiscountPercentage || 100; // default 100% free
            const discountPerUnit = Math.round((targetItem.priceCents * discountPct) / 100);
            const totalBogoDiscount = discountPerUnit * numSets;

            if (totalBogoDiscount > 0) {
              appliedRules.push({
                ruleId: rule.id,
                title: `${rule.title} (Offre Achetez/Obtenez)`,
                discountCents: totalBogoDiscount,
              });
              totalDiscountCents += totalBogoDiscount;
            }
          }
        }
      }
    } else if (rule.type === "PROMO_CODE" && activeCode) {
      if (
        rule.code &&
        rule.code.toUpperCase() === activeCode.toUpperCase() &&
        (!rule.usageLimit || (rule.timesUsed || 0) < rule.usageLimit)
      ) {
        let discount = 0;
        if (rule.discountPercentage) {
          discount = Math.round((cartSubtotalCents * rule.discountPercentage) / 100);
        } else if (rule.discountFixedCents) {
          discount = Math.min(rule.discountFixedCents, cartSubtotalCents);
        }

        if (discount > 0) {
          appliedRules.push({
            ruleId: rule.id,
            title: `Code Promo (${rule.code})`,
            discountCents: discount,
          });
          totalDiscountCents += discount;
        }
      }
    }
  }

  const finalSubtotalCents = Math.max(0, cartSubtotalCents - totalDiscountCents);

  return {
    appliedRules,
    totalDiscountCents,
    finalSubtotalCents,
  };
}
