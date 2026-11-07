import {
  AffiliateAmbassador,
  AffiliateProgramConfig,
  createAffiliateSchema,
  affiliateConfigSchema,
} from "../../shared/affiliateProgram";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeAffConfigs = new Map<number, AffiliateProgramConfig>();
const SETTING_KEY = "feature_affiliate_program";
const storeAffiliatesMap = new Map<number, AffiliateAmbassador[]>();

export async function getAffiliateConfig(
  storeId: number
): Promise<AffiliateProgramConfig> {
  const existing = storeAffConfigs.get(storeId);
  if (existing) return existing;

  const defaultConfig: AffiliateProgramConfig = {
    storeId,
    enabled: true,
    defaultCommissionPercentage: 10,
  };

  const persisted = await readPersistentStoreSetting(storeId, SETTING_KEY, defaultConfig);
  const config = { ...defaultConfig, ...persisted, storeId };
  storeAffConfigs.set(storeId, config);
  return config;
}

export async function saveAffiliateConfig(
  storeId: number,
  input: z.infer<typeof affiliateConfigSchema>
): Promise<AffiliateProgramConfig> {
  const current = await getAffiliateConfig(storeId);
  const updated: AffiliateProgramConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeAffConfigs.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration affiliation isolée par boutique");
}

export async function createAffiliateAmbassador(
  storeId: number,
  input: z.infer<typeof createAffiliateSchema>
): Promise<AffiliateAmbassador> {
  const config = await getAffiliateConfig(storeId);
  if (!config.enabled) {
    throw new Error("Le programme d'affiliation est actuellement désactivé.");
  }

  const affiliates = storeAffiliatesMap.get(storeId) || [];

  const prefix = input.name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
  const affiliateCode = `${prefix || "AFF"}-${Math.floor(100 + Math.random() * 900)}`;

  const newAffiliate: AffiliateAmbassador = {
    id: `AFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    name: input.name,
    email: input.email.toLowerCase().trim(),
    affiliateCode,
    commissionPercentage: input.commissionPercentage || config.defaultCommissionPercentage,
    totalSalesCents: 0,
    totalCommissionCents: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  affiliates.unshift(newAffiliate);
  storeAffiliatesMap.set(storeId, affiliates);

  return newAffiliate;
}

export async function getStoreAffiliates(
  storeId: number
): Promise<AffiliateAmbassador[]> {
  return storeAffiliatesMap.get(storeId) || [];
}

export async function recordAffiliateSale(
  storeId: number,
  affiliateCode: string,
  saleAmountCents: number
): Promise<AffiliateAmbassador | null> {
  const affiliates = storeAffiliatesMap.get(storeId) || [];
  const idx = affiliates.findIndex(
    (a) => a.affiliateCode.toUpperCase() === affiliateCode.toUpperCase().trim()
  );

  if (idx === -1) return null;

  const target = affiliates[idx];
  const commission = Math.round((saleAmountCents * target.commissionPercentage) / 100);

  target.totalSalesCents += saleAmountCents;
  target.totalCommissionCents += commission;

  affiliates[idx] = target;
  storeAffiliatesMap.set(storeId, affiliates);

  return target;
}
