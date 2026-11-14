import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getProductById,
  getPaymentCartById,
  createPaymentIntent,
  getPublicOwnerProductVariantsForProducts,
  getStoreCurrencyConfig,
  getStoreMembershipForUser,
  getStudioManagedStore,
} from "./db";

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
  const authRequest = Object.create(req) as Request;
  authRequest.headers = { ...req.headers };
  if (forwardedCookie) authRequest.headers.cookie = forwardedCookie;
  if (forwardedAuthorization) authRequest.headers.authorization = forwardedAuthorization;
  return sdk.authenticateRequest(authRequest).catch(() => null);
}

function storeIdParam(req: Request) {
  const id = Number(req.params.storeId);
  return Number.isInteger(id) && id > 0 ? id : null;
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
    const currency = await getStoreCurrencyConfig(storeId).catch(() => ({ code: "CHF" as const, rateBps: 10_000 }));
    return res.json({ data: { id: String(store.id), country: "CH", defaultCurrency: currency.code, supportedCurrencies: [currency.code], isActive: store.status === "active" || store.status === "limited" } });
  });

  targetApp.get("/api/internal/payment/stores/:storeId/products/:productId", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const productId = Number(req.params.productId);
    if (!storeId || !Number.isInteger(productId) || productId <= 0) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    const product = await getProductById(productId, storeId);
    if (!product) return res.json({ data: null });
    const variantsByProduct = await getPublicOwnerProductVariantsForProducts([productId], storeId);
    const variants = variantsByProduct.get(productId) ?? [];
    return res.json({ data: { id: String(product.id), storeId: String(storeId), name: product.name, active: product.status === "active", variants: variants.map((variant) => ({ id: String(variant.id), name: variant.label, active: true, stockAvailable: variant.stock, pricesMinor: { CHF: product.price + variant.priceAdjustmentCents } })) } });
  });

  targetApp.get("/api/internal/payment/stores/:storeId/carts/:cartId", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const cartId = Number(req.params.cartId);
    if (!storeId || !Number.isInteger(cartId) || cartId <= 0) return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    const cart = await getPaymentCartById(cartId, storeId);
    if (!cart) return res.json({ data: null });
    return res.json({ data: {
      id: String(cart.id),
      storeId: String(cart.storeId),
      currency: "CHF",
      items: cart.items.map((item) => ({ productId: String(item.productId), variantId: "default", quantity: item.quantity })),
    } });
  });

  targetApp.post("/api/internal/payment/stores/:storeId/intents", async (req, res) => {
    if (!bridgeGuard(req, res)) return;
    const storeId = storeIdParam(req);
    const body = req.body ?? {};
    const cartId = Number(body.cartId);
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
    const provider = typeof body.provider === "string" ? body.provider.trim().toLowerCase() : "";
    const method = typeof body.method === "string" ? body.method.trim().toLowerCase() : "";
    if (!storeId || !Number.isInteger(cartId) || cartId <= 0 || !idempotencyKey || !provider || !method) {
      return fail(res, 400, "PAYMENT_BRIDGE_INPUT_INVALID");
    }
    try {
      const intent = await createPaymentIntent({ storeId, cartId, idempotencyKey, provider, method, currency: "CHF", isTestMode: body.isTestMode !== false });
      return res.status(201).json({ data: intent });
    } catch (error) {
      const code = error instanceof Error ? error.message : "PAYMENT_INTENT_CREATE_FAILED";
      return fail(res, code === "CART_EMPTY_OR_NOT_FOUND" ? 404 : 400, code);
    }
  });
}
