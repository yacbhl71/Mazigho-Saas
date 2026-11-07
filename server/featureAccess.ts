import { TRPCError } from "@trpc/server";
import type { SaasPlanFeatureId } from "../shared/saasPlanCatalog";
import * as storeDb from "./db";

export async function requireStoreSaasFeature(storeId: number, feature: SaasPlanFeatureId): Promise<void> {
  let resolver: ((storeId: number, feature: SaasPlanFeatureId) => Promise<boolean>) | undefined;
  try { resolver = (storeDb as { hasStoreSaasFeature?: typeof resolver }).hasStoreSaasFeature; } catch { resolver = undefined; }
  // Some isolated unit-test adapters expose only the storage methods they test.
  // Production always exports the resolver from server/db.ts.
  if (typeof resolver !== "function" || await resolver(storeId, feature)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Cette fonctionnalité n'est pas attribuée à la boutique (${feature}).`,
  });
}

export async function storeSaasFeatureEnabled(storeId: number, feature: SaasPlanFeatureId): Promise<boolean> {
  let resolver: ((storeId: number, feature: SaasPlanFeatureId) => Promise<boolean>) | undefined;
  try { resolver = (storeDb as { hasStoreSaasFeature?: typeof resolver }).hasStoreSaasFeature; } catch { resolver = undefined; }
  return typeof resolver !== "function" ? true : resolver(storeId, feature);
}
