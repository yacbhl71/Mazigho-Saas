import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = "t1";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 180;

function sign(payload: string, secret: string) {
  return createHmac("sha256", `order-tracking:${secret}`).update(payload).digest("base64url");
}

/** Signed read-only link to a single order. It opens no session and no other order. */
export function createOrderTrackingToken(input: { storeId: number; orderId: number }, secret: string, now = Date.now(), ttlMs = DEFAULT_TTL_MS) {
  const payload = `${VERSION}.${input.storeId}.${input.orderId}.${Math.floor((now + ttlMs) / 1000)}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOrderTrackingToken(token: string, secret: string, now = Date.now()) {
  const parts = token.trim().split(".");
  if (parts.length !== 5 || parts[0] !== VERSION) return null;
  const [, storeId, orderId, expiresAt, signature] = parts;
  if (!/^[1-9]\d{0,9}$/.test(storeId) || !/^[1-9]\d{0,9}$/.test(orderId) || !/^\d{1,12}$/.test(expiresAt)) return null;
  const expected = Buffer.from(sign(parts.slice(0, 4).join("."), secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  if (Number(expiresAt) * 1000 < now) return null;
  return { storeId: Number(storeId), orderId: Number(orderId) };
}
