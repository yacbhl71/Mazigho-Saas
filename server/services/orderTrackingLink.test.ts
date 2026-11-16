import { describe, expect, it } from "vitest";
import { createOrderTrackingToken, verifyOrderTrackingToken } from "./orderTrackingLink";

const secret = "test-secret-for-order-tracking-links";
const now = Date.UTC(2026, 5, 1);

describe("order tracking link", () => {
  it("opens exactly the signed order of the signed store", () => {
    const token = createOrderTrackingToken({ storeId: 7, orderId: 1234 }, secret, now);
    expect(verifyOrderTrackingToken(token, secret, now)).toEqual({ storeId: 7, orderId: 1234 });
  });

  it("rejects a tampered order, store or signature", () => {
    const token = createOrderTrackingToken({ storeId: 7, orderId: 1234 }, secret, now);
    const [version, storeId, , expiresAt, signature] = token.split(".");
    expect(verifyOrderTrackingToken([version, storeId, "1235", expiresAt, signature].join("."), secret, now)).toBeNull();
    expect(verifyOrderTrackingToken([version, "8", "1234", expiresAt, signature].join("."), secret, now)).toBeNull();
    expect(verifyOrderTrackingToken(token, "another-secret", now)).toBeNull();
    expect(verifyOrderTrackingToken("not-a-token", secret, now)).toBeNull();
  });

  it("expires", () => {
    const token = createOrderTrackingToken({ storeId: 7, orderId: 1234 }, secret, now, 60_000);
    expect(verifyOrderTrackingToken(token, secret, now + 59_000)).not.toBeNull();
    expect(verifyOrderTrackingToken(token, secret, now + 61_000)).toBeNull();
  });
});
