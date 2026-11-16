import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getProductById,
  getByokCartCheckout,
  createPaymentIntent,
  applyPaymentIntentEvent,
  attachPaymentIntentOrder,
  getPublicOwnerProductVariantsForProducts,
  getStoreCurrencyConfig,
  getStoreMembershipForUser,
  getStudioManagedStore,
  recordPaymentJournal,
  type PaymentJournalEntry,
} from "./db";
import { convertChfCents, type StoreCurrencyConfig } from "../shared/storeCurrency";
import { sendGuestOrderTrackingEmail } from "./guestOrderTracking";

const EVENT_JOURNAL: Record<string, Pick<PaymentJournalEntry, "level" | "source" | "message">> = {
  "checkout.created": { level: "info", source: "checkout", message: "Paiement ouvert par un client" },
  "payment.succeeded": { level: "info", source: "payment", message: "Paiement confirmé" },
  "payment.failed": { level: "warning", source: "payment", message: "Paiement refusé ou échoué" },
  "payment.expired": { level: "warning", source: "payment", message: "Paiement abandonné ou expiré" },
};

const PROVIDER_LABEL: Record<string, string> = { stripe: "Stripe", paypal: "PayPal" };

const CONNECTOR_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: "clé refusée par le prestataire",
  MODE_KEY_MISMATCH: "clé de test et de production inversées",
  PROVIDER_UNAVAILABLE: "prestataire momentanément indisponible",
  PROVIDER_ERROR: "requête refusée par le prestataire",
};

function auditJournal(action: string, outcome: string, errorCode: string | null, provider: string | null): Pick<PaymentJournalEntry, "level" | "source" | "message"> | null {
  const p = provider ? ` ${PROVIDER_LABEL[provider] ?? provider}` : "";
  if (action === "payment_config.test") {
    return outcome === "success"
      ? { level: "info", source: "connector", message: `Test de connexion${p} réussi` }
      : { level: "error", source: "connector", message: `Test de connexion${p} échoué${errorCode ? ` : ${CONNECTOR_ERRORS[errorCode] ?? errorCode}` : ""}` };
  }
  // Key changes carry their author: the store handover checklist relies on it.
  if (outcome === "success" && action === "payment_config.upsert") return { level: "info", source: "connector", message: `Clés${p} enregistrées` };
  if (outcome === "success" && action === "payment_config.delete") return { level: "warning", source: "connector", message: `Connecteur${p} supprimé` };
  if (outcome === "denied") return { level: "warning", source: "connector", message: "Action refusée : accès non autorisé à la configuration" };
  if (outcome === "error") return { level: "error", source: "connector", message: `Échec de l’action ${action.slice(0, 80)}` };
  return null;
}

/** Variant id used by the payment service for a product sold without owner variants. */
const BASE_VARIANT_ID = "default";

function configuredToken() {
  const token = process.env.PAYMENT_SERVICE_TOKEN?.trim();
  if (!token || token.length < 32) return null;
  return token;
}

function safeEqual(received: string | undefined, expected: string) {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function fail(res: Response, status: number, code: string) {
  return res.status(status).json({ error: { code, message: code } });
}

function bridgeGuard(req: Request, res: Response) {
  const token = configuredToken();
  if (!token) {
    fail(res, 503, "PAYMENT_BRIDGE_NOT_CONFIGURED");
    return false;
  }
  if (!safeEqual(req.header("x-payment-service-token"), token)) {
    fail(res, 401, "PAYMENT_BRIDGE_UNAUTHORIZED");
    return false;
  }
  return true;
}

async function authenticateForwardedRequest(req: Request) {
  const forwardedCookie = req.header("x-forwarded-cookie");
  const forwardedAuthorization = req.header("x-forwarded-authorization");
  const forwardedOwnerSession = req.header("x-forwarded-owner-session");
  const authRequest = Object.create(req) as Request;
  authRequest.headers = { ...req.headers };
  if (forwardedCookie) authRequest.headers.cookie = forwardedCookie;
  if (forwardedAuthorization) authRequest.headers.authorization = forwardedAuthorization;
  // The SDK gives x-mazigho-session precedence over cookies. Prefer the
  // forwarded cookie when present so an obsolete localStorage token cannot
  // invalidate an otherwise valid owner session.
  if (forwardedOwnerSession && !forwardedCookie && !forwardedAuthorization) authRequest.headers["x-mazigho-session"] = forwardedOwnerSession;
  return sdk.authenticateRequest(authRequest).catch(() => null);
}

function storeIdParam(req: Request) {
  const id = Number(req.params.storeId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function storeCurrency(storeId: number): Promise<StoreCurrencyConfig> {
  return getStoreCurrencyConfig(storeId).catch(() => ({ code: "CHF" as const, rateBps: 10_000 }));
}

function unitPrices(unitAmountChf: number, currency: StoreCurrencyConfig) {
  return { CHF: unitAmountChf, [currency.code]: convertChfCents(unitAmountChf, currency) };
}

export function registerPaymentHostBridgeRoute(targetApp: Express) {
  targetApp.get("/api/internal/payment/auth", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const user = await authenticateForwardedRequest(req);
    return res.json({ data: user ? { userId: String(user.id) } : null });
  });

  targetApp.get("/api/internal/payment/stores/:storeId/role", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const userId = Number(req.query.userId);
    if (!storeId || !Number.isInteger(userId) || userId <= 0) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    const membership = await getStoreMembershipForUser(storeId, userId);
    if (!membership || membership.status !== "active") return res.json({ data: { role: null } });
    const role = membership.role === "owner" ? "owner" : membership.role === "manager" ? "admin" : membership.role === "viewer" ? "customer" : "staff";
    return res.json({ data: { role } });
  });

  targetApp.get("/api/internal/payment/stores/:storeId", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    if (!storeId) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    const store = await getStudioManagedStore(storeId);
    if (!store) return res.json({ data: null });
    const currency = await storeCurrency(storeId);
    return res.json({ data: { id: String(store.id), country: "CH", defaultCurrency: currency.code, supportedCurrencies: [currency.code], isActive: store.status === "active" || store.status === "limited", returnBaseUrl: `https://${store.primaryDomain}` } });
  });

  targetApp.get("/api/internal/payment/stores/:storeId/products/:productId", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const productId = Number(req.params.productId);
    if (!storeId || !Number.isInteger(productId) || productId <= 0) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    const product = await getProductById(productId, storeId);
    if (!product) return res.json({ data: null });
    const [variantsByProduct, currency] = await Promise.all([getPublicOwnerProductVariantsForProducts([productId], storeId), storeCurrency(storeId)]);
    const ownerVariants = variantsByProduct.get(productId) ?? [];
    // A product without owner variants is sold through one base variant.
    const variants = ownerVariants.length > 0
      ? ownerVariants.map((variant) => ({ id: String(variant.id), name: variant.label, active: true, stockAvailable: variant.stock, pricesMinor: unitPrices(product.price + variant.priceAdjustmentCents, currency) }))
      : [{ id: BASE_VARIANT_ID, active: true, stockAvailable: product.stock, pricesMinor: unitPrices(product.price, currency) }];
    return res.json({ data: { id: String(product.id), storeId: String(storeId), name: product.name, active: product.status === "active", variants } });
  });

  targetApp.get("/api/internal/payment/stores/:storeId/carts/:cartId", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const cartId = Number(req.params.cartId);
    if (!storeId || !Number.isInteger(cartId) || cartId <= 0) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    try {
      const priced = await getByokCartCheckout(cartId, storeId);
      if (!priced) return res.json({ data: null });
      return res.json({ data: {
        id: String(priced.cart.id),
        storeId: String(priced.cart.storeId),
        currency: priced.checkout.currency.code,
        items: priced.cart.items.map((item) => ({ productId: String(item.productId), variantId: item.variantId ? String(item.variantId) : BASE_VARIANT_ID, quantity: item.quantity })),
        // Same checkout engine as Stripe Connect: store shipping policy and promotion.
        adjustments: { shippingMinor: priced.checkout.customerShippingAmount, discountMinor: priced.discountAmount },
      } });
    } catch (error) {
      return fail(res, 409, error instanceof Error ? error.message : "PAYMENT_CART_UNAVAILABLE");
    }
  });

  targetApp.post("/api/internal/payment/stores/:storeId/intents", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const body = req.body ?? {};
    const cartId = Number(body.cartId);
    const validatedCart = body.validatedCart;
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
    const provider = typeof body.provider === "string" ? body.provider.trim().toLowerCase() : "";
    const method = typeof body.method === "string" ? body.method.trim().toLowerCase() : "";
    const validatedCartOk = validatedCart && typeof validatedCart.fingerprint === "string" && /^[a-f0-9]{64}$/.test(validatedCart.fingerprint) && Number.isSafeInteger(validatedCart.totalMinor) && validatedCart.totalMinor > 0 && typeof validatedCart.currency === "string";
    if (!storeId || (!Number.isInteger(cartId) || cartId <= 0) && !validatedCartOk || !idempotencyKey || !provider || !method) {
      return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    }
    try {
      if (Number.isInteger(cartId) && cartId > 0) {
        // The amount the provider will charge must equal MAZIGHO's own checkout total.
        if (!validatedCartOk) return fail(res, 409, "PAYMENT_SERVICE_UPDATE_REQUIRED");
        const priced = await getByokCartCheckout(cartId, storeId);
        if (!priced) return fail(res, 404, "CART_EMPTY_OR_NOT_FOUND");
        if (validatedCart.currency !== priced.checkout.currency.code || validatedCart.totalMinor !== priced.chargeAmount) {
          return fail(res, 409, "PAYMENT_AMOUNT_MISMATCH");
        }
      }
      const currency = validatedCartOk ? validatedCart.currency : (await storeCurrency(storeId)).code;
      const intent = await createPaymentIntent({ storeId, cartId: Number.isInteger(cartId) && cartId > 0 ? cartId : undefined, validatedCart: validatedCartOk ? { fingerprint: validatedCart.fingerprint, totalMinor: validatedCart.totalMinor, currency: validatedCart.currency } : undefined, idempotencyKey, provider, method, currency, isTestMode: body.isTestMode !== false });
      return res.status(201).json({ data: intent });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_INTENT_CREATE_FAILED";
      return fail(res, code === "CART_EMPTY_OR_NOT_FOUND" ? 404 : 400, code);
    }
  });

  targetApp.post("/api/internal/payment/stores/:storeId/intents/:intentId/events", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const intentId = Number(req.params.intentId);
    const body = req.body ?? {};
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    const targetStatus = body.targetStatus;
    if (!storeId || !Number.isInteger(intentId) || intentId <= 0 || !eventId || !["processing", "succeeded", "failed", "expired"].includes(targetStatus)) {
      return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    }
    try {
      const result = await applyPaymentIntentEvent({ storeId, intentId, eventId, targetStatus, providerReference: typeof body.providerReference === "string" ? body.providerReference : undefined });
      if (result.orderPaid && result.orderId) void sendGuestOrderTrackingEmail(storeId, Number(result.orderId));
      return res.json({ data: result });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_EVENT_REJECTED";
      return fail(res, code === "PAYMENT_INTENT_NOT_FOUND" ? 404 : 409, code);
    }
  });

  targetApp.post("/api/internal/payment/stores/:storeId/intents/:intentId/order", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const intentId = Number(req.params.intentId);
    const userId = Number(req.body?.userId);
    const shippingAddress = typeof req.body?.shippingAddress === "string" ? req.body.shippingAddress.trim() : "";
    if (!storeId || !Number.isInteger(intentId) || intentId <= 0 || !Number.isInteger(userId) || userId <= 0 || !shippingAddress) {
      return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    }
    // Storefront customers are not store members: intents built from a server
    // cart are bound to the cart owner instead. Cart-less intents stay member-only.
    const membership = await getStoreMembershipForUser(storeId, userId);
    try {
      const result = await attachPaymentIntentOrder({ storeId, intentId, userId, shippingAddress, billingAddress: typeof req.body?.billingAddress === "string" ? req.body.billingAddress : undefined, allowWithoutCart: membership?.status === "active" });
      return res.status(result.alreadyAttached ? 200 : 201).json({ data: result });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_ORDER_ATTACH_FAILED";
      const status = code === "PAYMENT_INTENT_NOT_FOUND" ? 404 : code === "PAYMENT_BRIDGE_STORE_ACCESS_DENIED" || code === "PAYMENT_INTENT_CART_MISMATCH" ? 403 : 409;
      return fail(res, status, code);
    }
  });

  // Payment service notifications. They are acknowledged and logged without
  // payload secrets; a notification never blocks a checkout or a webhook.
  targetApp.post("/api/internal/payment/events", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const body = req.body ?? {};
    const type = String(body.type ?? "");
    const storeId = Number(body.storeId);
    const journal = EVENT_JOURNAL[type];
    if (journal && Number.isInteger(storeId) && storeId > 0) {
      await recordPaymentJournal({
        ...journal,
        storeId,
        event: type,
        provider: typeof body.provider === "string" ? body.provider : null,
        reference: typeof body.orderId === "string" ? body.orderId : null,
        amountMinor: Number.isSafeInteger(body.amountMinor) ? body.amountMinor : null,
        currency: typeof body.currency === "string" ? body.currency : null,
      });
    }
    return res.status(202).json({ data: { received: true } });
  });

  targetApp.post("/api/internal/payment/audit", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const body = req.body ?? {};
    const storeId = Number(body.storeId);
    const action = String(body.action ?? "");
    const provider = typeof body.provider === "string" ? body.provider : null;
    const errorCode = typeof body.details?.errorCode === "string" ? body.details.errorCode : null;
    const actorUserId = Number(body.actorId);
    const journal = auditJournal(action, String(body.outcome ?? ""), errorCode, provider);
    if (journal && Number.isInteger(storeId) && storeId > 0) {
      await recordPaymentJournal({ ...journal, storeId, event: action, provider, code: errorCode, actorUserId: Number.isInteger(actorUserId) && actorUserId > 0 ? actorUserId : null });
    }
    return res.status(202).json({ data: { received: true } });
  });
}
