import type {
  LoyaltyProgramConfig,
  CustomerLoyaltyAccount,
  LoyaltyRedemptionResult,
} from "../../shared/loyaltyProgram";
import { generateReferralCode } from "../../shared/loyaltyProgram";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

// Registry for store loyalty config: storeId -> LoyaltyProgramConfig
const loyaltyConfigRegistry = new Map<number, LoyaltyProgramConfig>();
const SETTING_KEY = "feature_loyalty_program";

// Registry for customer loyalty accounts: `${storeId}:${userId}` -> CustomerLoyaltyAccount
const accountRegistry = new Map<string, CustomerLoyaltyAccount>();

export async function getStoreLoyaltyConfig(storeId: number): Promise<LoyaltyProgramConfig> {
  const existing = loyaltyConfigRegistry.get(storeId);
  if (existing) return existing;

  const defaultConfig: LoyaltyProgramConfig = {
    storeId,
    pointsPerSpentCents: 1, // 1 point per 1 CHF
    centsPerRedeemedPoint: 5, // 100 points = 5.00 CHF discount
    minRedeemPoints: 50,
    referralRewardCents: 1000, // 10.00 CHF discount
    enabled: true,
  };

  const persisted = await readPersistentStoreSetting(storeId, SETTING_KEY, defaultConfig);
  const config = { ...defaultConfig, ...persisted, storeId };
  loyaltyConfigRegistry.set(storeId, config);
  return config;
}

export async function saveStoreLoyaltyConfig(
  storeId: number,
  input: Partial<LoyaltyProgramConfig>
): Promise<LoyaltyProgramConfig> {
  const current = await getStoreLoyaltyConfig(storeId);
  const updated: LoyaltyProgramConfig = {
    ...current,
    ...input,
    storeId,
  };

  loyaltyConfigRegistry.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration fidélité isolée par boutique");
}

export async function getCustomerLoyaltyAccount(
  storeId: number,
  userId: number,
  userEmail: string = "client@example.ch"
): Promise<CustomerLoyaltyAccount> {
  const key = `${storeId}:${userId}`;
  const existing = accountRegistry.get(key);
  if (existing) return existing;

  const account: CustomerLoyaltyAccount = {
    userId,
    storeId,
    pointsBalance: 120, // Initial welcome bonus points
    totalEarnedPoints: 120,
    referralCode: generateReferralCode(userEmail),
    referralCount: 1,
    totalReferralEarningsCents: 1000,
  };

  accountRegistry.set(key, account);
  return account;
}

export async function earnPointsForOrder(
  storeId: number,
  userId: number,
  orderTotalCents: number,
  userEmail: string = "client@example.ch"
): Promise<number> {
  const config = await getStoreLoyaltyConfig(storeId);
  if (!config.enabled) return 0;

  const earnedPoints = Math.floor((orderTotalCents / 100) * config.pointsPerSpentCents);
  if (earnedPoints <= 0) return 0;

  const account = await getCustomerLoyaltyAccount(storeId, userId, userEmail);
  account.pointsBalance += earnedPoints;
  account.totalEarnedPoints += earnedPoints;

  const key = `${storeId}:${userId}`;
  accountRegistry.set(key, account);
  return earnedPoints;
}

export async function redeemPointsForDiscount(
  storeId: number,
  userId: number,
  pointsToRedeem: number,
  userEmail: string = "client@example.ch"
): Promise<LoyaltyRedemptionResult> {
  const config = await getStoreLoyaltyConfig(storeId);
  if (!config.enabled) {
    throw new Error("Le programme de fidélité n'est pas actif actuellement.");
  }

  const account = await getCustomerLoyaltyAccount(storeId, userId, userEmail);

  if (pointsToRedeem < config.minRedeemPoints) {
    throw new Error(`Minimum ${config.minRedeemPoints} points requis pour effectuer un échange.`);
  }

  if (account.pointsBalance < pointsToRedeem) {
    throw new Error(`Solde insuffisant : vous disposez de ${account.pointsBalance} points.`);
  }

  const discountCents = pointsToRedeem * config.centsPerRedeemedPoint;
  account.pointsBalance -= pointsToRedeem;

  const key = `${storeId}:${userId}`;
  accountRegistry.set(key, account);

  const promoCode = `FIDELITE-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    success: true,
    promoCode,
    discountCents,
    remainingPoints: account.pointsBalance,
  };
}
