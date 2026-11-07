import {
  CustomerSegmentsConfig,
  SegmentedCustomer,
  SegmentTag,
  customerSegmentationConfigSchema,
} from "../../shared/customerSegmentation";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeSegmentationConfigs = new Map<number, CustomerSegmentsConfig>();
const storeCustomersMap = new Map<number, SegmentedCustomer[]>();
const CONFIG_KEY = "feature_customer_segmentation_config";
const CUSTOMERS_KEY = "feature_customer_segmentation_customers";

export async function getSegmentationConfig(storeId: number): Promise<CustomerSegmentsConfig> {
  const existing = storeSegmentationConfigs.get(storeId);
  if (existing) return existing;
  const persisted = await readPersistentStoreSetting<CustomerSegmentsConfig | null>(storeId, CONFIG_KEY, null);
  if (persisted) {
    storeSegmentationConfigs.set(storeId, persisted);
    return persisted;
  }

  const defaultConfig: CustomerSegmentsConfig = {
    storeId,
    enabled: true,
    vipThresholdCents: 50000, // 500 CHF
    highAovThresholdCents: 15000, // 150 CHF
  };

  storeSegmentationConfigs.set(storeId, defaultConfig);
  return defaultConfig;
}

export async function saveSegmentationConfig(
  storeId: number,
  input: z.infer<typeof customerSegmentationConfigSchema>
): Promise<CustomerSegmentsConfig> {
  const current = await getSegmentationConfig(storeId);
  const updated: CustomerSegmentsConfig = {
    ...current,
    ...input,
    storeId,
  };

  storeSegmentationConfigs.set(storeId, updated);
  await writePersistentStoreSetting(storeId, CONFIG_KEY, updated, "Configuration de segmentation isolée par boutique");
  return updated;
}

export async function getStoreCustomerSegments(storeId: number): Promise<{
  config: CustomerSegmentsConfig;
  customers: SegmentedCustomer[];
}> {
  const config = await getSegmentationConfig(storeId);

  let customers = storeCustomersMap.get(storeId);
  if (!customers) {
    customers = await readPersistentStoreSetting<SegmentedCustomer[]>(storeId, CUSTOMERS_KEY, []);
    storeCustomersMap.set(storeId, customers);
  }

  // Dynamically evaluate tags based on current thresholds
  const evaluated = customers.map((c) => {
    const tags: SegmentTag[] = [];

    if (c.totalSpentCents >= config.vipThresholdCents) {
      tags.push("VIP");
    }
    if (c.ordersCount >= 2) {
      tags.push("RECURRING");
    }
    if (c.totalSpentCents / Math.max(1, c.ordersCount) >= config.highAovThresholdCents) {
      tags.push("HIGH_AOV");
    }

    const lastOrderTime = new Date(c.lastOrderDate).getTime();
    const daysSinceLast = (Date.now() - lastOrderTime) / (1000 * 60 * 60 * 24);
    if (daysSinceLast > 60) {
      tags.push("INACTIVE_60D");
    } else if (c.ordersCount === 1) {
      tags.push("NEW_CUSTOMER");
    }

    return { ...c, tags };
  });

  return { config, customers: evaluated };
}
