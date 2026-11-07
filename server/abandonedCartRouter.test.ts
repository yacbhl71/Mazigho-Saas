import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
}));

vi.mock("./emails", () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

import { abandonedCartRouter } from "./abandonedCartRouter";

function makeOwnerCaller(storeId: number = 77) {
  state.membership = { role: "owner", status: "active" };
  return abandonedCartRouter.createCaller({
    user: { id: 10, role: "user", name: "Propriétaire Test", email: "owner@test.mazigho" },
    store: {
      id: storeId,
      slug: `boutique-${storeId}`,
      displayName: `Boutique Test ${storeId}`,
      primaryDomain: `boutique${storeId}.test`,
      status: "active",
      isPlatformStore: 0,
    },
  } as any);
}

function makePublicCaller(storeId?: number) {
  return abandonedCartRouter.createCaller({
    user: null,
    store: storeId
      ? {
          id: storeId,
          slug: `boutique-${storeId}`,
          displayName: `Boutique ${storeId}`,
          primaryDomain: `boutique${storeId}.test`,
          status: "active",
          isPlatformStore: 0,
        }
      : null,
  } as any);
}

describe("abandonedCartRouter - Paniers Abandonnés & Pixels", () => {
  beforeEach(() => {
    state.membership = { role: "owner", status: "active" };
  });

  async function seedCart(storeId: number) {
    const publicCaller = makePublicCaller(storeId);
    return await publicCaller.recordPublicCartHeartbeat({
      customerEmail: `client-${storeId}@example.com`,
      customerName: "Client de test",
      items: [{ productId: 1, productName: "Produit de test", priceCents: 2500, quantity: 1 }],
      totalAmountCents: 2500,
      currency: "CHF",
    });
  }

  describe("1. Gestion des Paniers Abandonnés & Relances", () => {
    it("retourne la liste des paniers abandonnés isolée par boutique", async () => {
      const caller = makeOwnerCaller(801);
      await seedCart(801);
      const carts = await caller.getCarts();

      expect(Array.isArray(carts)).toBe(true);
      expect(carts.length).toBeGreaterThan(0);
      expect(carts[0].storeId).toBe(801);
    });

    it("calcule les statistiques d'analyse de récupération de revenus", async () => {
      const caller = makeOwnerCaller(802);
      await seedCart(802);
      const analytics = await caller.getAnalytics();

      expect(analytics.totalCartsCount).toBeGreaterThan(0);
      expect(analytics.recoveryRatePercent).toBeGreaterThanOrEqual(0);
      expect(analytics.potentialRevenueCents).toBeGreaterThan(0);
    });

    it("envoie un e-mail de relance avec code de réduction et met à jour le statut", async () => {
      const caller = makeOwnerCaller(803);
      await seedCart(803);
      const carts = await caller.getCarts();
      const firstCart = carts[0];

      const res = await caller.sendReminder({
        cartId: firstCart.id,
        discountPercent: 15,
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("15%");

      const updatedCarts = await caller.getCarts();
      const target = updatedCarts.find(c => c.id === firstCart.id);
      expect(target?.status).toBe("reminded");
      expect(target?.reminderCount).toBeGreaterThan(0);
      expect(target?.recoveryDiscountCode).toBe("RELANCE15");
    });

    it("permet de marquer un panier comme récupéré", async () => {
      const caller = makeOwnerCaller(804);
      await seedCart(804);
      const carts = await caller.getCarts();
      const firstCart = carts[0];

      const ok = await caller.markRecovered({ cartId: firstCart.id });
      expect(ok).toBe(true);

      const updatedCarts = await caller.getCarts();
      const target = updatedCarts.find(c => c.id === firstCart.id);
      expect(target?.status).toBe("recovered");
    });

    it("enregistre une relance WhatsApp et SMS en 1 clic avec statut mis à jour", async () => {
      const caller = makeOwnerCaller(808);
      await seedCart(808);
      const carts = await caller.getCarts();
      const firstCart = carts[0];

      const waRes = await caller.recordManualReminder({
        cartId: firstCart.id,
        channel: "whatsapp",
        discountPercent: 10,
      });
      expect(waRes.success).toBe(true);
      expect(waRes.message).toContain("WhatsApp");

      const afterWa = await caller.getCarts();
      const targetWa = afterWa.find(c => c.id === firstCart.id);
      expect(targetWa?.status).toBe("reminded");
      expect(targetWa?.recoveryDiscountCode).toBe("RELANCE10");

      const smsRes = await caller.recordManualReminder({
        cartId: firstCart.id,
        channel: "sms",
        discountPercent: 15,
      });
      expect(smsRes.success).toBe(true);
      expect(smsRes.message).toContain("SMS");

      const afterSms = await caller.getCarts();
      const targetSms = afterSms.find(c => c.id === firstCart.id);
      expect(targetSms?.status).toBe("reminded");
      expect(targetSms?.recoveryDiscountCode).toBe("RELANCE15");
    });

    it("enregistre un battement de panier à partir du tunnel d'achat public (storefront)", async () => {
      const publicCaller = makePublicCaller(805);
      const recorded = await publicCaller.recordPublicCartHeartbeat({
        customerEmail: "jean.dupont@example.ch",
        customerName: "Jean Dupont",
        items: [
          {
            productId: 55,
            productName: "T-Shirt Coton Bio",
            priceCents: 2900,
            quantity: 2,
          },
        ],
        totalAmountCents: 5800,
        currency: "CHF",
      });

      expect(recorded).toBeDefined();
      expect(recorded?.customerEmail).toBe("jean.dupont@example.ch");
      expect(recorded?.totalAmountCents).toBe(5800);
    });
  });

  describe("2. Tracking Pixels (Meta, TikTok, GA4, GTM)", () => {
    it("enregistre et valide les identifiants de Pixels publicitaires", async () => {
      const ownerCaller = makeOwnerCaller(901);

      const saved = await ownerCaller.savePixelsConfig({
        metaPixelId: "123456789012345",
        tiktokPixelId: "C9876543210ABCDEF",
        gaMeasurementId: "G-ABC1234567",
        gtmContainerId: "GTM-XYZ9876",
        enabled: true,
      });

      expect(saved.metaPixelId).toBe("123456789012345");
      expect(saved.tiktokPixelId).toBe("C9876543210ABCDEF");
      expect(saved.gaMeasurementId).toBe("G-ABC1234567");
      expect(saved.gtmContainerId).toBe("GTM-XYZ9876");
      expect(saved.enabled).toBe(true);
    });

    it("rejette les identifiants de pixels malformés (sécurité de scripts)", async () => {
      const ownerCaller = makeOwnerCaller(902);

      const saved = await ownerCaller.savePixelsConfig({
        metaPixelId: "<script>alert(1)</script>", // Format invalide
        gaMeasurementId: "INVALID-GA-ID",          // Doit commencer par G-
        gtmContainerId: "GTM-OK1234",
      });

      expect(saved.metaPixelId).toBeNull();
      expect(saved.gaMeasurementId).toBeNull();
      expect(saved.gtmContainerId).toBe("GTM-OK1234");
    });

    it("expose la configuration des pixels aux visiteurs de la vitrine publique", async () => {
      const ownerCaller = makeOwnerCaller(903);
      await ownerCaller.savePixelsConfig({
        metaPixelId: "999888777666555",
        enabled: true,
      });

      const publicCaller = makePublicCaller(903);
      const publicConfig = await publicCaller.getPublicStorePixels();

      expect(publicConfig.metaPixelId).toBe("999888777666555");
      expect(publicConfig.enabled).toBe(true);
    });
  });
});
