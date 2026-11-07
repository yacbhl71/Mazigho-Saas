import { TRPCError } from "@trpc/server";
import type { SaasPlanFeatureId } from "../shared/saasPlanCatalog";
import { hasStoreSaasFeature } from "./db";

export async function requireStoreSaasFeature(storeId: number, feature: SaasPlanFeatureId): Promise<void> {
  if (await hasStoreSaasFeature(storeId, feature)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Cette fonctionnalité n'est pas attribuée à la boutique (${feature}).`,
  });
}

export async function storeSaasFeatureEnabled(storeId: number, feature: SaasPlanFeatureId): Promise<boolean> {
  return hasStoreSaasFeature(storeId, feature);
}
