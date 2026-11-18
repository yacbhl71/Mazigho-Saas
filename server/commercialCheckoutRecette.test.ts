import type { Express, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  retrieveSession: vi.fn(),
  createCoupon: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  applyPaymentIntentEvent: vi.fn(),
  attachPaymentIntentOrder: vi.fn(),
  bindStripeConnectSessionToPendingOrder: vi.fn(),
  cancelUnboundStripePendingOrder: vi.fn(),
  createAlgeriaCashOnDeliveryOrder: vi.fn(),
  createPaymentIntent: vi.fn(),
  createStripePendingOrder: vi.fn(),
  getByokCartCheckout: vi.fn(),
  getOrderForStripeSessionForStore: vi.fn(),
  getProductById: vi.fn(),
  getPublicOwnerProductVariantsForProducts: vi.fn(),
  getStoreCurrencyConfig: vi.fn(),
  getStoreMaintenanceMode: vi.fn(),
  getStoreMembershipForUser: vi.fn(),
  getStoreStripeConnectCheckoutContext: vi.fn(),
  getStoreStripeConnectSetup: vi.fn(),
  getStripeCheckoutCart: vi.fn(),
  getStudioManagedStore: vi.fn(),
  markOrderPaidByStripeSession: vi.fn(),
  recordPaymentJournal: vi.fn(),
  replaceByokServerCart: vi.fn(),
  validatePromotion: vi.fn(),
}));

const proxyMocks = vi.hoisted(() => ({
  callPaymentService: vi.fn(),
}));

const webhookMocks = vi.hoisted(() => ({
  completePaidStripeOrder: vi.fn(),
  isVerifiedPaidStripeTestSession: vi.fn(),
}));

const guestTrackingMocks = vi.hoisted(() => ({
  sendGuestOrderTrackingEmail: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    coupons = { create: stripeMocks.createCoupon };
    checkout = { sessions: { create: stripeMocks.createSession, retrieve: stripeMocks.retrieveSession } };
  },
}));
vi.mock("./db", () => dbMocks);
vi.mock("./paymentServiceProxy", () => proxyMocks);
vi.mock("./stripeWebhook", () => webhookMocks);
vi.mock("./guestOrderTracking", () => guestTrackingMocks);

import { stripeCheckoutRouter } from "./stripeCheckout";
import { registerPaymentHostBridgeRoute } from "./paymentHostBridge";

const BRIDGE_TOKEN = "mazigho_bridge_secret_token_32_chars_min_ok";
const legalAcceptanceVersion = "2026-09-28" as const;

const sampleAddress = {
  name: "Amira Mansouri",
  phone: "+41 79 123 45 67",
  line1: "Rue du Rhône 42",
  city: "Genève",
  postalCode: "1204",
};

const sampleCart = {
  items: [
    {
      productId: 41,
      name: "Tapis berbère tissé main",
      quantity: 2,
      unitAmount: 5_000,
      unitAmountChf: 5_000,
      shippingAmount: 1_500,
      selectedOptions: {},
      supplierSnapshot: {},
    },
  ],
  currency: { code: "CHF" as const, rateBps: 10_000 },
  productSubtotal: 10_000,
  productSubtotalChf: 10_000,
  customerShippingAmount: 1_500,
  customerShippingAmountChf: 1_500,
  shippingPolicy: "flat_rate" as const,
  totalAmount: 11_500,
  totalAmountChf: 11_500,
};

function createCheckoutCaller(storeId = 72, userId = 7) {
  return stripeCheckoutRouter.createCaller({
    user: { id: userId, email: "client@example.test" },
    store: { id: storeId, primaryDomain: "amaboutique.ch", status: "active" },
    req: { headers: {} },
  } as never);
}

type RouteHandler = (req: Request, res: Response) => Promise<unknown>;

function mountBridgeApp() {
  const routes = new Map<string, RouteHandler>();
  const fakeApp = {
    get: (path: string, handler: RouteHandler) => routes.set(`GET ${path}`, handler),
    post: (path: string, handler: RouteHandler) => routes.set(`POST ${path}`, handler),
  } as unknown as Express;
  registerPaymentHostBridgeRoute(fakeApp);

  async function invoke(
    method: "GET" | "POST",
    routePattern: string,
    options: {
      params?: Record<string, string>;
      query?: Record<string, string>;
      body?: Record<string, unknown>;
      token?: string;
    } = {},
  ) {
    const handler = routes.get(`${method} ${routePattern}`);
    if (!handler) throw new Error(`Route not found: ${method} ${routePattern}`);
    const token = options.token === undefined ? BRIDGE_TOKEN : options.token;
    const req = {
      params: options.params ?? {},
      query: options.query ?? {},
      body: options.body ?? {},
      headers: token ? { "x-payment-service-token": token } : {},
      header(name: string) {
        return (this.headers as Record<string, string | undefined>)[name.toLowerCase()];
      },
    } as unknown as Request;

    let statusCode = 200;
    let jsonPayload: unknown = null;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        jsonPayload = payload;
        return this;
      },
    } as unknown as Response;

    await handler(req, res);
    return { status: statusCode, body: jsonPayload as Record<string, any> };
  }

  return { invoke };
}

describe("Recette commerciale complète — Panier, Livraison, Promotions, Stock, Stripe Test, PayPal Sandbox & Tests négatifs", () => {
  beforeEach(() => {
    process.env.PAYMENT_SERVICE_TOKEN = BRIDGE_TOKEN;
    process.env.MAZIGHO_ENABLE_STRIPE_TEST_CONNECT = "true";
    process.env.MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_platform";
    for (const mock of Object.values(dbMocks)) mock.mockReset();
    for (const mock of Object.values(proxyMocks)) mock.mockReset();
    for (const mock of Object.values(stripeMocks)) mock.mockReset();
    for (const mock of Object.values(webhookMocks)) mock.mockReset();
    for (const mock of Object.values(guestTrackingMocks)) mock.mockReset();

    dbMocks.getStoreMaintenanceMode.mockResolvedValue({ enabled: false, title: "", message: "" });
    dbMocks.getStripeCheckoutCart.mockResolvedValue(sampleCart);
    dbMocks.replaceByokServerCart.mockResolvedValue(501);
    dbMocks.recordPaymentJournal.mockResolvedValue(undefined);
  });

  it("ouvre une session BYOK Stripe Test avec panier serveur validé, livraison et promotion appliquée au sous-total produits", async () => {
    dbMocks.validatePromotion.mockResolvedValue({
      promotion: { id: 12, code: "BIENVENUE10" },
      discountAmount: 1_000,
      totalAmount: 9_000,
    });
    proxyMocks.callPaymentService.mockResolvedValue({
      session: {
        redirectUrl: "https://checkout.stripe.test/c/pay/cs_test_byok_123",
        orderId: "ord_0123456789abcdef0123456789abcdef",
      },
    });

    const result = await createCheckoutCaller(72, 7).createByokSession({
      provider: "stripe",
      method: "card",
      countryCode: "CH",
      shippingAddress: sampleAddress,
      promoCode: "BIENVENUE10",
      legalAcceptanceVersion,
      legalAccepted: true,
      items: [{ productId: 41, quantity: 2 }],
    });

    expect(dbMocks.getStripeCheckoutCart).toHaveBeenCalledWith(7, "CH", [{ productId: 41, quantity: 2 }], 72);
    expect(dbMocks.validatePromotion).toHaveBeenCalledWith(
      "BIENVENUE10",
      10_000, // Applied only to productSubtotalChf (10_000), never to customerShippingAmountChf (1_500)
      expect.objectContaining({ userId: 7, storeId: 72 }),
    );
    expect(dbMocks.replaceByokServerCart).toHaveBeenCalledWith(
      7,
      72,
      [{ productId: 41, quantity: 2 }],
      expect.objectContaining({
        countryCode: "CH",
        promoCode: "BIENVENUE10",
        promotionId: 12,
        discountAmountChf: 1_000,
        legalAcceptanceVersion,
      }),
    );
    expect(proxyMocks.callPaymentService).toHaveBeenCalledWith(
      expect.anything(),
      "/api/checkout/create-session",
      expect.objectContaining({
        method: "POST",
        storeId: 72,
        body: expect.objectContaining({
          storeId: "72",
          userId: "7",
          provider: "stripe",
          method: "card",
          currency: "CHF",
          country: "CH",
          cartId: "501",
          idempotencyKey: expect.stringMatching(/^byok_72_7_[a-f0-9]{32}$/),
        }),
      }),
    );
    expect(result).toEqual({
      url: "https://checkout.stripe.test/c/pay/cs_test_byok_123",
      orderId: "ord_0123456789abcdef0123456789abcdef",
      idempotencyKey: expect.stringMatching(/^byok_72_7_[a-f0-9]{32}$/),
    });
  });

  it("ouvre une session BYOK PayPal Sandbox puis capture automatiquement le paiement au retour client", async () => {
    proxyMocks.callPaymentService.mockResolvedValueOnce({
      session: {
        redirectUrl: "https://www.sandbox.paypal.com/checkoutnow?token=EC-TEST123",
        orderId: "ord_fedcba9876543210fedcba9876543210",
      },
    });

    const caller = createCheckoutCaller(72, 7);
    const created = await caller.createByokSession({
      provider: "paypal",
      method: "paypal",
      countryCode: "CH",
      shippingAddress: sampleAddress,
      legalAcceptanceVersion,
      legalAccepted: true,
      items: [{ productId: 41, quantity: 2 }],
    });

    expect(created.url).toContain("sandbox.paypal.com");
    expect(created.orderId).toBe("ord_fedcba9876543210fedcba9876543210");

    // 1st call to confirmByokReturn sees status "pending_payment", triggering POST /capture
    proxyMocks.callPaymentService
      .mockResolvedValueOnce({
        session: {
          provider: "paypal",
          status: "pending_payment",
          amountMinor: 11_500,
          currency: "CHF",
          isTestMode: true,
        },
      })
      .mockResolvedValueOnce({
        session: {
          provider: "paypal",
          status: "paid",
          amountMinor: 11_500,
          currency: "CHF",
          isTestMode: true,
        },
      });

    const confirmed = await caller.confirmByokReturn({
      storeId: 72,
      orderId: "ord_fedcba9876543210fedcba9876543210",
    });

    expect(proxyMocks.callPaymentService).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "/api/checkout/session/ord_fedcba9876543210fedcba9876543210?storeId=72",
      { storeId: 72 },
    );
    expect(proxyMocks.callPaymentService).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      "/api/checkout/session/ord_fedcba9876543210fedcba9876543210/capture?storeId=72",
      { method: "POST", storeId: 72, body: {} },
    );
    expect(confirmed).toEqual({
      status: "paid",
      provider: "paypal",
      amountMinor: 11_500,
      currency: "CHF",
      isTestMode: true,
    });
  });

  it("bloque un montant falsifié (PAYMENT_AMOUNT_MISMATCH) sur le pont de paiement avant toute création d’intention ou de commande", async () => {
    const bridge = mountBridgeApp();
    dbMocks.getByokCartCheckout.mockResolvedValue({
      cart: { id: 501, storeId: 72, userId: 7, items: [{ productId: 41, variantId: null, quantity: 2 }] },
      quote: {
        version: 1,
        countryCode: "CH",
        items: [{ productId: 41, quantity: 2 }],
        promoCode: "BIENVENUE10",
        promotionId: 12,
        discountAmountChf: 1_000,
        legalAcceptanceVersion,
      },
      checkout: sampleCart,
      discountAmount: 1_000,
      discountAmountChf: 1_000,
      chargeAmount: 10_500, // 10_000 products + 1_500 shipping - 1_000 promo = 10_500
    });

    // Attempt 1: tampered amountMinor (500 cents instead of 10_500 cents)
    const tamperedAmount = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents", {
      params: { storeId: "72" },
      body: {
        cartId: 501,
        idempotencyKey: "idem_tampered_amount_0001",
        provider: "stripe",
        method: "card",
        validatedCart: {
          fingerprint: "a".repeat(64),
          totalMinor: 500, // Tampered!
          currency: "CHF",
        },
      },
    });
    expect(tamperedAmount.status).toBe(409);
    expect(tamperedAmount.body.error.code).toBe("PAYMENT_AMOUNT_MISMATCH");
    expect(dbMocks.createPaymentIntent).not.toHaveBeenCalled();

    // Attempt 2: tampered currency (EUR instead of CHF)
    const tamperedCurrency = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents", {
      params: { storeId: "72" },
      body: {
        cartId: 501,
        idempotencyKey: "idem_tampered_currency_0002",
        provider: "paypal",
        method: "paypal",
        validatedCart: {
          fingerprint: "b".repeat(64),
          totalMinor: 10_500,
          currency: "EUR", // Tampered!
        },
      },
    });
    expect(tamperedCurrency.status).toBe(409);
    expect(tamperedCurrency.body.error.code).toBe("PAYMENT_AMOUNT_MISMATCH");
    expect(dbMocks.createPaymentIntent).not.toHaveBeenCalled();

    // Attempt 3: order attachment detects PAYMENT_AMOUNT_MISMATCH if cart changed after intent creation
    dbMocks.attachPaymentIntentOrder.mockRejectedValueOnce(new Error("PAYMENT_AMOUNT_MISMATCH"));
    const tamperedOrderAttach = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/order", {
      params: { storeId: "72", intentId: "88" },
      body: {
        userId: 7,
        shippingAddress: JSON.stringify(sampleAddress),
      },
    });
    expect(tamperedOrderAttach.status).toBe(409);
    expect(tamperedOrderAttach.body.error.code).toBe("PAYMENT_AMOUNT_MISMATCH");
  });

  it("bloque immédiatement une commande en cas de stock insuffisant (OUT_OF_STOCK) et journalise l’alerte sans appeler le prestataire", async () => {
    dbMocks.getStripeCheckoutCart.mockRejectedValueOnce(new Error("OUT_OF_STOCK"));

    await expect(
      createCheckoutCaller(72, 7).createByokSession({
        provider: "stripe",
        method: "card",
        countryCode: "CH",
        shippingAddress: sampleAddress,
        legalAcceptanceVersion,
        legalAccepted: true,
        items: [{ productId: 41, quantity: 10 }],
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("ne plus être disponible"),
    });

    expect(dbMocks.replaceByokServerCart).not.toHaveBeenCalled();
    expect(proxyMocks.callPaymentService).not.toHaveBeenCalled();
    expect(dbMocks.recordPaymentJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 72,
        level: "warning",
        source: "checkout",
        event: "checkout.failed",
        provider: "stripe",
        code: "PRECONDITION_FAILED",
      }),
    );

    // Same guarantee on Stripe Connect route
    dbMocks.getStripeCheckoutCart.mockRejectedValueOnce(new Error("OUT_OF_STOCK"));
    await expect(
      createCheckoutCaller(72, 7).createSession({
        countryCode: "CH",
        legalAcceptanceVersion,
        legalAccepted: true,
        items: [{ productId: 41, quantity: 10 }],
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("ne plus être disponible"),
    });
    expect(stripeMocks.createSession).not.toHaveBeenCalled();
  });

  it("gère proprement les paiements refusés et expirés sans débiter le stock ni valider la commande", async () => {
    const bridge = mountBridgeApp();

    // 1. Provider refuses to open payment session
    const { TRPCError } = await import("@trpc/server");
    proxyMocks.callPaymentService.mockRejectedValueOnce(
      new TRPCError({
        code: "BAD_GATEWAY",
        message: "Le service de paiement a refusé la demande — stripe : carte refusée.",
      }),
    );

    await expect(
      createCheckoutCaller(72, 7).createByokSession({
        provider: "stripe",
        method: "card",
        countryCode: "CH",
        shippingAddress: sampleAddress,
        legalAcceptanceVersion,
        legalAccepted: true,
        items: [{ productId: 41, quantity: 1 }],
      }),
    ).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });

    expect(dbMocks.recordPaymentJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 72,
        level: "error",
        source: "checkout",
        event: "checkout.failed",
        provider: "stripe",
        code: "BAD_GATEWAY",
      }),
    );

    // 2. Payment intent transitions to "failed" (declined card / refused PayPal capture)
    dbMocks.applyPaymentIntentEvent.mockResolvedValueOnce({
      id: 88,
      storeId: 72,
      orderId: 301,
      status: "failed",
      lastEventId: "evt_failed_001",
      duplicate: false,
      orderPaid: false,
    });

    const failedTransition = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/events", {
      params: { storeId: "72", intentId: "88" },
      body: {
        eventId: "evt_failed_001",
        targetStatus: "failed",
        providerReference: "pi_declined_123",
      },
    });
    expect(failedTransition.status).toBe(200);
    expect(failedTransition.body.data).toMatchObject({
      status: "failed",
      orderPaid: false,
      duplicate: false,
    });
    expect(guestTrackingMocks.sendGuestOrderTrackingEmail).not.toHaveBeenCalled();

    // 3. Payment service notifies payment.failed to the journal endpoint
    const journalRes = await bridge.invoke("POST", "/api/internal/payment/events", {
      body: {
        type: "payment.failed",
        storeId: 72,
        provider: "paypal",
        orderId: "ord_fedcba9876543210fedcba9876543210",
        amountMinor: 11_500,
        currency: "CHF",
      },
    });
    expect(journalRes.status).toBe(202);
    expect(dbMocks.recordPaymentJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 72,
        level: "warning",
        source: "payment",
        event: "payment.failed",
        provider: "paypal",
        amountMinor: 11_500,
        currency: "CHF",
      }),
    );
  });

  it("bloque le double clic simultané (CONFLICT) et garantit l’idempotence des webhooks et rattachements de commande", async () => {
    let resolveSlowCall!: (value: { session: { redirectUrl: string; orderId: string } }) => void;
    proxyMocks.callPaymentService.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSlowCall = resolve;
        }),
    );

    const caller = createCheckoutCaller(72, 7);
    const payload = {
      provider: "stripe" as const,
      method: "card" as const,
      countryCode: "CH",
      shippingAddress: sampleAddress,
      legalAcceptanceVersion,
      legalAccepted: true as const,
      items: [{ productId: 41, quantity: 1 }],
    };

    const firstClick = caller.createByokSession(payload);
    const secondClick = caller.createByokSession(payload);

    // Second concurrent click is immediately rejected with CONFLICT
    await expect(secondClick).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("déjà en cours"),
    });

    resolveSlowCall({
      session: {
        redirectUrl: "https://checkout.stripe.test/c/pay/cs_test_single",
        orderId: "ord_0123456789abcdef0123456789abcdef",
      },
    });

    await expect(firstClick).resolves.toMatchObject({
      url: "https://checkout.stripe.test/c/pay/cs_test_single",
    });
    expect(proxyMocks.callPaymentService).toHaveBeenCalledTimes(1);

    // Bridge idempotency: duplicate webhook eventId & duplicate order attachment
    const bridge = mountBridgeApp();
    dbMocks.applyPaymentIntentEvent
      .mockResolvedValueOnce({
        id: 88,
        storeId: 72,
        orderId: 301,
        status: "succeeded",
        lastEventId: "evt_paid_unique_001",
        duplicate: false,
        orderPaid: true,
      })
      .mockResolvedValueOnce({
        id: 88,
        storeId: 72,
        orderId: 301,
        status: "succeeded",
        lastEventId: "evt_paid_unique_001",
        duplicate: true,
        orderPaid: false,
      });

    const firstEvent = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/events", {
      params: { storeId: "72", intentId: "88" },
      body: { eventId: "evt_paid_unique_001", targetStatus: "succeeded" },
    });
    const duplicateEvent = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/events", {
      params: { storeId: "72", intentId: "88" },
      body: { eventId: "evt_paid_unique_001", targetStatus: "succeeded" },
    });

    expect(firstEvent.body.data).toMatchObject({ duplicate: false, orderPaid: true });
    expect(duplicateEvent.body.data).toMatchObject({ duplicate: true, orderPaid: false });
    expect(guestTrackingMocks.sendGuestOrderTrackingEmail).toHaveBeenCalledTimes(1);

    dbMocks.attachPaymentIntentOrder
      .mockResolvedValueOnce({ orderId: 301, alreadyAttached: false })
      .mockResolvedValueOnce({ orderId: 301, alreadyAttached: true });

    const firstAttach = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/order", {
      params: { storeId: "72", intentId: "88" },
      body: { userId: 7, shippingAddress: JSON.stringify(sampleAddress) },
    });
    const secondAttach = await bridge.invoke("POST", "/api/internal/payment/stores/:storeId/intents/:intentId/order", {
      params: { storeId: "72", intentId: "88" },
      body: { userId: 7, shippingAddress: JSON.stringify(sampleAddress) },
    });

    expect(firstAttach.status).toBe(201);
    expect(secondAttach.status).toBe(200);
    expect(secondAttach.body.data).toEqual({ orderId: 301, alreadyAttached: true });
  });

  it("refuse une promotion qui annule totalement le montant à encaisser ou un pays non desservi", async () => {
    dbMocks.validatePromotion.mockResolvedValueOnce({
      promotion: { id: 99, code: "GRATUIT100" },
      discountAmount: 11_500,
      totalAmount: 0,
    });

    await expect(
      createCheckoutCaller(72, 7).createByokSession({
        provider: "paypal",
        method: "paypal",
        countryCode: "CH",
        shippingAddress: sampleAddress,
        promoCode: "GRATUIT100",
        legalAcceptanceVersion,
        legalAccepted: true,
        items: [{ productId: 41, quantity: 2 }],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("réduit le total à zéro"),
    });
    expect(proxyMocks.callPaymentService).not.toHaveBeenCalled();

    dbMocks.getStripeCheckoutCart.mockRejectedValueOnce(new Error("STORE_DELIVERY_COUNTRY_NOT_SERVED"));
    await expect(
      createCheckoutCaller(72, 7).createByokSession({
        provider: "stripe",
        method: "card",
        countryCode: "JP",
        shippingAddress: sampleAddress,
        legalAcceptanceVersion,
        legalAccepted: true,
        items: [{ productId: 41, quantity: 1 }],
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("ne livre pas encore dans ce pays"),
    });
  });
});
