import { describe, expect, it } from "vitest";
import {
  buildStoreHandoverChecklist,
  evaluateStoreHandoverDeliveryGate,
  parseStoreHandoverSignoffRecord,
  type StoreHandoverFacts,
} from "./storeHandoverChecklist";

const ready: StoreHandoverFacts = {
  store: { id: 7, displayName: "Atelier Lina", primaryDomain: "atelier-lina.ch", status: "active" },
  buyer: { email: "lina@example.test", name: "Lina", activated: true },
  otherAccess: [],
  connectorKeys: [{ provider: "stripe", savedByBuyer: true }],
  legal: { operatorName: "Lina Studio Sàrl", complete: true, sameAsPlatform: false },
  delivery: { ready: true },
  paymentRoute: "byok",
  sellableProducts: 12,
  succeededTestPayments: 1,
  succeededLivePayments: 0,
};
const liveStripe = [{ provider: "stripe", label: "Carte", isTestMode: false }];
const status = (result: ReturnType<typeof buildStoreHandoverChecklist>, key: string) => result.items.find(item => item.key === key)?.status;

describe("store handover checklist", () => {
  it("is fully green for a transferred store paid with the buyer's live keys", () => {
    const result = buildStoreHandoverChecklist(ready, liveStripe);
    expect(result.blockingCount).toBe(0);
    expect(result.items.every(item => item.status === "ok")).toBe(true);
  });

  it("blocks a store still owned or signed by the platform", () => {
    const result = buildStoreHandoverChecklist({ ...ready, buyer: null, legal: { ...ready.legal, sameAsPlatform: true, operatorName: "MAZIGHO" } }, liveStripe);
    expect(status(result, "buyer_owner")).toBe("todo");
    expect(status(result, "legal_identity")).toBe("warning");
    expect(status(result, "payment_keys")).toBe("todo");
  });

  it("lists the previous owner and staff that still have access", () => {
    const result = buildStoreHandoverChecklist({ ...ready, otherAccess: [{ email: "ancien@example.test", role: "owner", platformStaff: false }, { email: "studio@example.test", role: "manager", platformStaff: true }] }, liveStripe);
    const item = result.items.find(entry => entry.key === "team_access");
    expect(item?.status).toBe("todo");
    expect(item?.detail).toContain("ancien@example.test (propriétaire)");
    expect(item?.detail).toContain("studio@example.test (gérant, MAZIGHO)");
  });

  it("requires payment keys saved by the buyer", () => {
    expect(status(buildStoreHandoverChecklist({ ...ready, connectorKeys: [{ provider: "stripe", savedByBuyer: false }] }, liveStripe), "payment_keys")).toBe("todo");
    expect(status(buildStoreHandoverChecklist({ ...ready, connectorKeys: [] }, liveStripe), "payment_keys")).toBe("warning");
    expect(status(buildStoreHandoverChecklist({ ...ready, connectorKeys: [{ provider: "stripe", savedByBuyer: null }] }, liveStripe), "payment_keys")).toBe("warning");
  });

  it("asks for the buyer's keys, production mode and a test payment", () => {
    expect(status(buildStoreHandoverChecklist(ready, []), "payment_connector")).toBe("todo");
    expect(status(buildStoreHandoverChecklist(ready, null), "payment_connector")).toBe("warning");
    expect(status(buildStoreHandoverChecklist({ ...ready, connectorKeys: [{ provider: "paypal", savedByBuyer: true }] }, [{ provider: "paypal", label: "PayPal", isTestMode: true }]), "payment_live")).toBe("warning");
    expect(status(buildStoreHandoverChecklist({ ...ready, succeededTestPayments: 0 }, liveStripe), "test_payment")).toBe("todo");
  });

  it("warns when payments are not collected with the buyer's own keys", () => {
    expect(status(buildStoreHandoverChecklist({ ...ready, paymentRoute: "stripe_connect" }, null), "payment_connector")).toBe("warning");
  });

  it("flags a MAZIGHO sub-domain as information only", () => {
    const result = buildStoreHandoverChecklist({ ...ready, store: { ...ready.store, primaryDomain: "lina.mazigho.ch" } }, liveStripe);
    expect(status(result, "domain")).toBe("info");
    expect(result.blockingCount).toBe(0);
  });

  it("blocks formal delivery sign-off until all critical automated and manual controls pass", () => {
    const base = buildStoreHandoverChecklist(ready, liveStripe);
    const emptySignoff = parseStoreHandoverSignoffRecord(null);
    const blockedByManual = evaluateStoreHandoverDeliveryGate(base, emptySignoff, "2026-11-18T10:00:00.000Z");

    expect(blockedByManual.signoff.isDeliveryBlocked).toBe(true);
    expect(blockedByManual.signoff.canConfirmDelivery).toBe(false);
    expect(blockedByManual.signoff.deliveryStatus).toBe("blocked");
    expect(blockedByManual.signoff.criticalAutomatedBlockers).toHaveLength(0);
    expect(blockedByManual.signoff.criticalManualBlockers).toHaveLength(4);

    const completeManualSignoff = parseStoreHandoverSignoffRecord(
      JSON.stringify({
        checkedItems: {
          storefront_visual_qa: { checked: true, checkedAt: "2026-11-18T10:01:00.000Z", checkedBy: "Studio MAZIGHO" },
          responsive_multi_device: { checked: true, checkedAt: "2026-11-18T10:02:00.000Z", checkedBy: "Studio MAZIGHO" },
          checkout_e2e_verified: { checked: true, checkedAt: "2026-11-18T10:03:00.000Z", checkedBy: "Studio MAZIGHO" },
          byok_secrets_isolation: { checked: true, checkedAt: "2026-11-18T10:04:00.000Z", checkedBy: "Studio MAZIGHO" },
          buyer_handover_guide: { checked: false, checkedAt: null, checkedBy: null },
        },
        deliveredAt: null,
        deliveredBy: null,
        notes: "Recette complète validée.",
        updatedAt: "2026-11-18T10:04:00.000Z",
      }),
    );

    const readyToDeliver = evaluateStoreHandoverDeliveryGate(base, completeManualSignoff, "2026-11-18T10:05:00.000Z");
    expect(readyToDeliver.signoff.isDeliveryBlocked).toBe(false);
    expect(readyToDeliver.signoff.canConfirmDelivery).toBe(true);
    expect(readyToDeliver.signoff.deliveryStatus).toBe("ready_to_deliver");
    expect(readyToDeliver.signoff.notes).toBe("Recette complète validée.");

    const signedOff = evaluateStoreHandoverDeliveryGate(
      base,
      {
        ...completeManualSignoff,
        deliveredAt: "2026-11-18T10:06:00.000Z",
        deliveredBy: "Studio MAZIGHO (admin@mazigho.ch)",
      },
      "2026-11-18T10:06:00.000Z",
    );
    expect(signedOff.signoff.deliveryStatus).toBe("delivered");
    expect(signedOff.signoff.deliveredAt).toBe("2026-11-18T10:06:00.000Z");
    expect(signedOff.signoff.deliveredBy).toBe("Studio MAZIGHO (admin@mazigho.ch)");

    // If an automated critical check regresses later, delivery reverts to blocked
    const regressedBase = buildStoreHandoverChecklist({ ...ready, succeededTestPayments: 0 }, liveStripe);
    const regressedGate = evaluateStoreHandoverDeliveryGate(
      regressedBase,
      {
        ...completeManualSignoff,
        deliveredAt: "2026-11-18T10:06:00.000Z",
        deliveredBy: "Studio MAZIGHO (admin@mazigho.ch)",
      },
      "2026-11-18T10:10:00.000Z",
    );
    expect(regressedGate.signoff.isDeliveryBlocked).toBe(true);
    expect(regressedGate.signoff.deliveryStatus).toBe("blocked");
    expect(regressedGate.signoff.criticalAutomatedBlockers.map(item => item.label)).toEqual(["Paiement de test réussi"]);
  });
});

