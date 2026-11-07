import {
  ReturnRequest,
  createReturnRequestSchema,
  updateReturnStatusSchema,
} from "../../shared/returnPortal";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

// Store isolated return requests in memory with persistence structure
const storeReturnsMap = new Map<number, ReturnRequest[]>();
const SETTING_KEY = "feature_return_requests";

async function getReturnsForStore(storeId: number): Promise<ReturnRequest[]> {
  const existing = storeReturnsMap.get(storeId);
  if (existing) return existing;
  const requests = await readPersistentStoreSetting<ReturnRequest[]>(storeId, SETTING_KEY, []);
  storeReturnsMap.set(storeId, requests);
  return requests;
}

async function saveReturnsForStore(storeId: number, requests: ReturnRequest[]): Promise<void> {
  await writePersistentStoreSetting(storeId, SETTING_KEY, requests, "Demandes de retour isolées par boutique");
}

export async function createReturnRequest(
  storeId: number,
  userId: number,
  input: z.infer<typeof createReturnRequestSchema>
): Promise<ReturnRequest> {
  const storeReturns = await getReturnsForStore(storeId);

  const newReturn: ReturnRequest = {
    id: `RET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId,
    userId,
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    items: input.items,
    reason: input.reason,
    notes: input.notes,
    resolution: input.resolution,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  storeReturns.unshift(newReturn);
  storeReturnsMap.set(storeId, storeReturns);
  await saveReturnsForStore(storeId, storeReturns);

  return newReturn;
}

export async function getCustomerReturnRequests(
  storeId: number,
  userId: number
): Promise<ReturnRequest[]> {
  const storeReturns = await getReturnsForStore(storeId);
  return storeReturns.filter((r) => r.userId === userId);
}

export async function getStoreReturnRequests(
  storeId: number
): Promise<ReturnRequest[]> {
  return await getReturnsForStore(storeId);
}

export async function updateReturnStatus(
  storeId: number,
  input: z.infer<typeof updateReturnStatusSchema>
): Promise<ReturnRequest> {
  const storeReturns = await getReturnsForStore(storeId);
  const returnIndex = storeReturns.findIndex((r) => r.id === input.returnId);

  if (returnIndex === -1) {
    throw new Error("Demande de retour introuvable.");
  }

  const existing = storeReturns[returnIndex];
  const updated: ReturnRequest = {
    ...existing,
    status: input.status,
    adminNote: input.adminNote ?? existing.adminNote,
    returnLabelUrl: input.returnLabelUrl ?? existing.returnLabelUrl,
    updatedAt: new Date().toISOString(),
  };

  storeReturns[returnIndex] = updated;
  storeReturnsMap.set(storeId, storeReturns);
  await saveReturnsForStore(storeId, storeReturns);

  return updated;
}
