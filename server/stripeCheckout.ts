import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { mayAcceptStorefrontCommerce, mayServeStorefront } from "./services/storeScope";
import { bindStripeConnectSessionToPendingOrder, cancelUnboundStripePendingOrder, createAlgeriaCashOnDeliveryOrder, createStripePendingOrder, getOrderForStripeSessionForStore, getStoreMaintenanceMode, getStoreStripeConnectCheckoutContext, getStoreStripeConnectSetup, getStripeCheckoutCart, markOrderPaidByStripeSession, recordPaymentJournal, replaceByokServerCart, validatePromotion } from "./db";
import { completePaidStripeOrder, isVerifiedPaidStripeTestSession } from "./stripeWebhook";
import { convertChfCents } from "../shared/storeCurrency";
import { getCheckoutPaymentGate } from "./services/checkoutPaymentGate";
import { calculateMazighoApplicationFee } from "./services/stripeConnectPayment";
import { getStripeConnectCredentials, type StripeConnectMode } from "./services/stripeConnectMode";
import { CHECKOUT_LEGAL_VERSION } from "../shared/checkoutLegalAcceptance";
import { callPaymentService } from "./paymentServiceProxy";
import type { ByokCheckoutQuote } from "./db";

const inFlightCheckoutLocks = new Set<string>();

async function withCheckoutDoubleClickLock<T>(storeId: number, userId: number, fn: () => Promise<T>): Promise<T> {
  const key = `${storeId}:${userId}`;
  if (inFlightCheckoutLocks.has(key)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Une tentative de paiement est déjà en cours de préparation. Veuillez patienter.",
    });
  }
  inFlightCheckoutLocks.add(key);
  try {
    return await fn();
  } finally {
    inFlightCheckoutLocks.delete(key);
  }
}

const storefrontProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  }
  if (!mayServeStorefront(ctx.store.status)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation et n’accepte pas encore de paiement." });
  }
  if (!mayAcceptStorefrontCommerce(ctx.store.status, Boolean(ctx.store.isPlatformStore))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette vitrine est ouverte à la découverte, mais n’accepte pas encore de paiement." });
  }
  if (!ctx.store.isPlatformStore && (await getStoreMaintenanceMode(ctx.store.id)).enabled) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est momentanément en maintenance et n’accepte pas de paiement." });
  }
  return next({ ctx });
});

function getStripeClient(mode: StripeConnectMode) {
  if (!getCheckoutPaymentGate(mode).enabled) return null;
  const credentials = getStripeConnectCredentials(mode);
  return new Stripe(credentials.secretKey);
}

function getCurrentStripeCheckoutMode(): StripeConnectMode | null {
  if (getCheckoutPaymentGate("live").enabled) return "live";
  if (getCheckoutPaymentGate("test").enabled) return "test";
  return null;
}

function stripeUnavailable(mode: StripeConnectMode, operation: "create" | "retrieve") {
  const gate = getCheckoutPaymentGate(mode);
  const label = mode === "live" ? "Production" : "de test";
  if (gate.reason === "live_key_missing") return "La configuration Stripe Production dédiée est incomplète. Aucun encaissement réel ne peut être créé.";
  return operation === "create"
    ? `Le paiement Stripe ${label} n’est pas activé pour cette boutique.`
    : `Le statut d’un paiement Stripe ${label} ne peut pas être vérifié tant que ce mode n’est pas explicitement activé.`;
}

type CheckoutCart = Awaited<ReturnType<typeof getStripeCheckoutCart>>;

/** Promotion rules are administered in MAZIGHO's canonical CHF catalogue and apply to the product subtotal only. */
async function resolveCheckoutPromotion(promoCode: string | undefined, cart: CheckoutCart, userId: number, storeId: number) {
  if (!promoCode) return { promotionId: null as number | null, discountAmount: 0, discountAmountChf: 0, promoCodeLabel: "" };
  try {
    const resolved = await validatePromotion(promoCode, cart.productSubtotalChf, {
      userId,
      cartItems: cart.items.map(item => ({ productId: item.productId, price: item.unitAmountChf, quantity: item.quantity })),
      storeId,
    });
    return {
      promotionId: resolved.promotion.id as number | null,
      discountAmountChf: resolved.discountAmount,
      discountAmount: convertChfCents(resolved.discountAmount, cart.currency),
      promoCodeLabel: resolved.promotion.code,
    };
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Code promo invalide." });
  }
}

const CHECKOUT_CART_ERRORS: Record<string, string> = {
  PRODUCT_NOT_AVAILABLE: "Un article de votre panier n’est plus disponible. Actualisez votre panier.",
  OUT_OF_STOCK: "Un article vient de ne plus être disponible. Actualisez votre panier.",
  CHECKOUT_VARIANT_REQUIRED: "Choisissez une variante pour chaque article avant de payer.",
  CHECKOUT_VARIANT_PRICE_INVALID: "Le prix d’une variante est invalide. Contactez la boutique.",
  DELIVERY_NOT_AVAILABLE: "Un article ne peut pas être livré dans ce pays.",
  STORE_DELIVERY_COUNTRY_NOT_SERVED: "La boutique ne livre pas encore dans ce pays.",
  CART_EMPTY: "Votre panier est vide.",
  CART_INVALID: "Votre panier contient une ligne invalide. Actualisez votre panier.",
  INVALID_COUNTRY: "Pays de livraison invalide.",
};

function checkoutCartError(error: unknown, context: string) {
  if (error instanceof TRPCError) return error;
  const code = error instanceof Error ? error.message : "";
  if (CHECKOUT_CART_ERRORS[code]) return new TRPCError({ code: "PRECONDITION_FAILED", message: CHECKOUT_CART_ERRORS[code] });
  console.error(context, error);
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le panier n’a pas pu être préparé pour le paiement. Aucun paiement n’a été créé." });
}

const byokSessionInput = z.object({
  provider: z.enum(["stripe", "paypal"]),
  method: z.enum(["card", "paypal"]).optional(),
  idempotencyKey: z.string().trim().regex(/^[A-Za-z0-9._:-]{16,255}$/).optional(),
  countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/),
  shippingAddress: z.object({
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().min(5).max(60).optional(),
    line1: z.string().trim().min(3).max(240),
    line2: z.string().trim().max(240).optional(),
    city: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().min(2).max(32),
  }),
  promoCode: z.string().trim().min(2).max(64).optional(),
  legalAcceptanceVersion: z.literal(CHECKOUT_LEGAL_VERSION),
  legalAccepted: z.literal(true),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20),
    selectedOptions: z.record(z.string().max(80), z.string().max(120)).optional(),
    variantId: z.number().int().positive().optional(),
  })).min(1).max(30),
});

type ByokSessionContext = Parameters<typeof callPaymentService>[0] & { user: { id: number }; store?: { id: number } | null };

async function createByokCheckoutSession(input: z.infer<typeof byokSessionInput>, ctx: ByokSessionContext) {
  const storeId = ctx.store!.id;
  const countryCode = input.countryCode.toUpperCase();
  // Same checkout engine as Stripe Connect: catalogue, variants, stock, delivery, shipping, currency and promotion.
  const cart = await getStripeCheckoutCart(ctx.user.id, countryCode, input.items, storeId).catch(error => { throw checkoutCartError(error, "BYOK checkout cart error"); });
  const promotion = await resolveCheckoutPromotion(input.promoCode, cart, ctx.user.id, storeId);
  if (cart.totalAmount - promotion.discountAmount <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cette promotion réduit le total à zéro et ne peut pas être encaissée en ligne." });
  }
  const quote: ByokCheckoutQuote = {
    version: 1,
    countryCode,
    items: input.items,
    promoCode: promotion.promoCodeLabel || null,
    promotionId: promotion.promotionId,
    discountAmountChf: promotion.discountAmountChf,
    legalAcceptanceVersion: input.legalAcceptanceVersion,
  };
  // The payment service reads a server cart: mirror the validated browser basket first.
  const cartId = await replaceByokServerCart(ctx.user.id, storeId, input.items, quote).catch(error => { throw checkoutCartError(error, "BYOK server cart error"); });
  const windowBucket = Math.floor(Date.now() / 30_000);
  const deterministicDigest = crypto
    .createHash("sha256")
    .update(JSON.stringify({ storeId, userId: ctx.user.id, provider: input.provider, method: input.method ?? null, cartId, quote, windowBucket }))
    .digest("hex")
    .slice(0, 32);
  const idempotencyKey = input.idempotencyKey ?? `byok_${storeId}_${ctx.user.id}_${deterministicDigest}`;
  const response = await callPaymentService<{ session: { redirectUrl: string | null; orderId: string } }>(ctx, "/api/checkout/create-session", {
    method: "POST",
    storeId,
    body: {
      storeId: String(storeId),
      userId: String(ctx.user.id),
      provider: input.provider,
      method: input.method,
      currency: cart.currency.code,
      country: countryCode,
      shippingAddress: JSON.stringify({ source: "byok_checkout", ...input.shippingAddress, countryCode }),
      idempotencyKey,
      cartId: String(cartId),
    },
  });
  if (!response.session.redirectUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le prestataire de paiement n’a pas fourni de lien de paiement." });
  return { url: response.session.redirectUrl, orderId: response.session.orderId, idempotencyKey };
}

export const stripeCheckoutRouter = router({
  createByokSession: storefrontProtectedProcedure
    .input(byokSessionInput)
    .mutation(async ({ input, ctx }) => {
      const storeId = ctx.store!.id;
      return await withCheckoutDoubleClickLock(storeId, ctx.user.id, async () => {
        try {
          return await createByokCheckoutSession(input, ctx);
        } catch (error) {
          const known = error instanceof TRPCError && (error.code === "PRECONDITION_FAILED" || error.code === "BAD_REQUEST");
          await recordPaymentJournal?.({
            storeId,
            level: known ? "warning" : "error",
            source: "checkout",
            event: "checkout.failed",
            provider: input.provider,
            code: error instanceof TRPCError ? error.code : null,
            message: `Paiement non ouvert : ${error instanceof Error ? error.message : "erreur inconnue"}`,
          });
          throw error;
        }
      });
    }),
  // Return page of a BYOK hosted payment. The random session id is the only
  // capability; Stripe is reconciled server-side and PayPal is captured here.
  confirmByokReturn: publicProcedure
    .input(z.object({
      storeId: z.number().int().positive(),
      orderId: z.string().regex(/^ord_[a-f0-9]{32}$/),
    }))
    .mutation(async ({ input, ctx }) => {
      type ByokSession = { provider: string; status: string; amountMinor: number; currency: string; isTestMode: boolean };
      const query = `storeId=${encodeURIComponent(String(input.storeId))}`;
      let { session } = await callPaymentService<{ session: ByokSession }>(ctx, `/api/checkout/session/${input.orderId}?${query}`, { storeId: input.storeId });
      if (session.provider === "paypal" && session.status === "pending_payment") {
        ({ session } = await callPaymentService<{ session: ByokSession }>(ctx, `/api/checkout/session/${input.orderId}/capture?${query}`, { method: "POST", storeId: input.storeId, body: {} }));
      }
      return { status: session.status, provider: session.provider, amountMinor: session.amountMinor, currency: session.currency, isTestMode: session.isTestMode };
    }),
  createAlgeriaCashOnDeliveryOrder: storefrontProtectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      countryCode: z.literal("DZ"),
      wilayaCode: z.string().trim().regex(/^\d{1,2}$/),
      deliveryMode: z.enum(["home", "relay"]),
      promoCode: z.string().trim().min(2).max(64).optional(),
      legalAcceptanceVersion: z.literal(CHECKOUT_LEGAL_VERSION),
      legalAccepted: z.literal(true),
      address: z.object({
        name: z.string().trim().min(2).max(160),
        phone: z.string().trim().min(5).max(60),
        line1: z.string().trim().min(3).max(240),
        line2: z.string().trim().max(240).optional(),
        city: z.string().trim().min(2).max(120),
        postalCode: z.string().trim().min(2).max(32),
      }),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        selectedOptions: z.record(z.string().max(80), z.string().max(120)).optional(),
        variantId: z.number().int().positive().optional(),
      })).min(1).max(30),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await createAlgeriaCashOnDeliveryOrder({
          userId: ctx.user.id,
          requestId: input.requestId,
          countryCode: input.countryCode,
          wilayaCode: input.wilayaCode,
          deliveryMode: input.deliveryMode,
          address: input.address,
          promoCode: input.promoCode,
          legalAcceptanceVersion: input.legalAcceptanceVersion,
          legalAccepted: input.legalAccepted,
          items: input.items,
          storeId: ctx.store!.id,
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CASH_ON_DELIVERY_DZ_NOT_AVAILABLE") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le paiement à la livraison n’est pas disponible pour cette boutique et cette destination." });
        }
        if (code === "CASH_ON_DELIVERY_ADDRESS_INCOMPLETE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Complétez le nom, téléphone, adresse, ville et code postal avant de commander." });
        }
        if (code === "ALGERIA_WILAYA_DELIVERY_UNAVAILABLE") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette wilaya ou ce mode de livraison n’est pas disponible pour cette boutique." });
        }
        if (code === "ALGERIA_WILAYA_DELIVERY_CURRENCY_REQUIRED") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette boutique doit d’abord configurer ses prix en dinar algérien pour utiliser une grille par wilaya." });
        }
        if (code === "CHECKOUT_LEGAL_PROFILE_INCOMPLETE") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette boutique doit compléter ses informations légales, fiscales et de livraison avant de prendre une commande." });
        }
        if (code === "CHECKOUT_LEGAL_ACCEPTANCE_REQUIRED") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’acceptation des conditions de vente est requise avant la commande." });
        }
        if (code === "CASH_ON_DELIVERY_REQUEST_CONFLICT") {
          throw new TRPCError({ code: "CONFLICT", message: "Cette tentative de commande ne peut pas être réutilisée." });
        }
        if (code === "OUT_OF_STOCK") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Un article vient de ne plus être disponible. Actualisez votre panier." });
        }
        console.error("Algeria cash-on-delivery checkout error", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La commande à la livraison n’a pas pu être créée. Aucun paiement n’a été enregistré." });
      }
    }),
  createSession: storefrontProtectedProcedure
    .input(z.object({
      countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/),
      promoCode: z.string().trim().min(2).max(64).optional(),
      legalAcceptanceVersion: z.literal(CHECKOUT_LEGAL_VERSION),
      legalAccepted: z.literal(true),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        selectedOptions: z.record(z.string().max(80), z.string().max(120)).optional(),
        variantId: z.number().int().positive().optional(),
      })).min(1).max(30),
    }))
    .mutation(async ({ input, ctx }) => {
      const mode = getCurrentStripeCheckoutMode();
      if (!mode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable("live", "create") });
      const stripe = getStripeClient(mode);
      if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable(mode, "create") });
      return await withCheckoutDoubleClickLock(ctx.store!.id, ctx.user.id, async () => {
        try {
          const storeId = ctx.store!.id;
          const cart = await getStripeCheckoutCart(ctx.user.id, input.countryCode, input.items, storeId);
          const connect = await getStoreStripeConnectCheckoutContext(storeId, mode);
          if (!connect.ready) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Cette boutique doit terminer la configuration Stripe Connect ${mode === "live" ? "Production" : "de test"} avant d’encaisser.` });
          }
          // Resolve promo (optional). Discount applies to the product subtotal, never to shipping.
          const { promotionId, discountAmount, discountAmountChf, promoCodeLabel } = await resolveCheckoutPromotion(input.promoCode, cart, ctx.user.id, storeId);
          const chargeAmount = cart.totalAmount - discountAmount;
          if (chargeAmount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette promotion réduit le total à zéro et ne peut pas être encaissée par Stripe Connect." });
          const applicationFeeAmount = calculateMazighoApplicationFee(chargeAmount, connect.commissionRateBps);
          const pendingOrder = await createStripePendingOrder({
            userId: ctx.user.id,
            mode,
            countryCode: input.countryCode,
            totalAmount: cart.totalAmount,
            cart,
            promotionId,
            discountAmount,
            discountAmountChf,
            legalAcceptanceVersion: input.legalAcceptanceVersion,
            legalAccepted: input.legalAccepted,
            storeId,
          });
          const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
          for (const item of cart.items) {
            lineItems.push({
              price_data: {
                currency: cart.currency.code.toLowerCase(),
                product_data: { name: item.name },
                unit_amount: item.unitAmount,
              },
              quantity: item.quantity,
            });
          }
          if (cart.customerShippingAmount > 0) {
            lineItems.push({
              price_data: {
                currency: cart.currency.code.toLowerCase(),
                product_data: { name: "Livraison" },
                unit_amount: cart.customerShippingAmount,
              },
              quantity: 1,
            });
          }
          const origin = `https://${ctx.store!.primaryDomain}`;
          // No stock is reserved when the session opens: it is taken only once
          // Stripe confirms the payment. The hosted session stays short-lived.
          // Stripe requires at least 30 minutes; one minute avoids a boundary
          // rejection between request construction and API receipt.
          const checkoutExpiresAt = Math.floor(Date.now() / 1000) + 31 * 60;
          // TWINT is retained for the Swiss franc storefront; card is used for the other configured currencies.
          const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = cart.currency.code === "CHF" ? ["card", "twint"] : ["card"];
          const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: "payment",
            expires_at: checkoutExpiresAt,
            payment_method_types: paymentMethodTypes,
            line_items: lineItems,
            shipping_address_collection: {
              allowed_countries: [input.countryCode.toUpperCase() as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
            },
            phone_number_collection: { enabled: true },
            customer_email: ctx.user.email || undefined,
            client_reference_id: String(ctx.user.id),
            success_url: `${origin}/commandes?stripe_session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/panier`,
            metadata: {
              user_id: String(ctx.user.id),
              country_code: input.countryCode.toUpperCase(),
              total_amount: String(cart.totalAmount),
              total_amount_chf: String(cart.totalAmountChf),
              currency_code: cart.currency.code,
              currency_rate_bps: String(cart.currency.rateBps),
              promo_code: promoCodeLabel,
              customer_shipping_amount: String(cart.customerShippingAmount),
              shipping_policy: cart.shippingPolicy,
              store_id: String(storeId),
              order_id: String(pendingOrder.id),
              commission_rate_bps: String(connect.commissionRateBps),
              stripe_connect_mode: mode,
            },
            payment_intent_data: { application_fee_amount: applicationFeeAmount },
          };
          try {
            if (discountAmount > 0) {
              const coupon = await stripe.coupons.create({ amount_off: discountAmount, currency: cart.currency.code.toLowerCase(), duration: "once", name: `MAZIGHO ${promoCodeLabel}` }, { stripeAccount: connect.accountId });
              sessionParams.discounts = [{ coupon: coupon.id }];
            }
            const session = await stripe.checkout.sessions.create(sessionParams, { stripeAccount: connect.accountId });
            if (!session.url) throw new Error("STRIPE_SESSION_URL_MISSING");
            await bindStripeConnectSessionToPendingOrder({
              storeId,
              userId: ctx.user.id,
              mode,
              orderId: pendingOrder.id,
              sessionId: session.id,
              stripeAccountId: connect.accountId,
              applicationFeeAmount,
              commissionRateBps: connect.commissionRateBps,
            });
            return { sessionId: session.id, orderId: pendingOrder.id, url: session.url };
          } catch (error) {
            await cancelUnboundStripePendingOrder({ storeId, userId: ctx.user.id, orderId: pendingOrder.id });
            throw error;
          }
        } catch (error) {
          console.error(`Stripe ${mode} Checkout error`, error);
          if (error instanceof TRPCError) throw error;
          const code = error instanceof Error ? error.message : "";
          if (CHECKOUT_CART_ERRORS[code]) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: CHECKOUT_CART_ERRORS[code] });
          }
          if (code === "CHECKOUT_LEGAL_PROFILE_INCOMPLETE") {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette boutique doit compléter ses informations légales, fiscales et de livraison avant de pouvoir ouvrir un paiement." });
          }
          if (code === "CHECKOUT_LEGAL_ACCEPTANCE_REQUIRED") {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’acceptation des conditions de vente est requise avant le paiement." });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable(mode, "create") });
        }
      });
    }),

  getSessionStatus: storefrontProtectedProcedure
    .input(z.object({ sessionId: z.string().min(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const order = await getOrderForStripeSessionForStore(input.sessionId, ctx.user.id, ctx.store?.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable pour cette boutique." });
        }
        const mode: StripeConnectMode = order.paymentMethod === "stripe_connect_live" ? "live" : "test";
        const stripe = getStripeClient(mode);
        if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable(mode, "retrieve") });
        const setup = await getStoreStripeConnectSetup(ctx.store!.id, mode);
        if (!setup.account) throw new TRPCError({ code: "NOT_FOUND", message: "Compte Stripe Connect introuvable pour cette boutique." });
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {}, { stripeAccount: setup.account.accountId });
        if (session.metadata?.user_id !== String(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Session Stripe non autorisée." });
        }
        let resolvedOrder = order;
        if ((mode === "test" ? isVerifiedPaidStripeTestSession(session) : session.livemode && session.mode === "payment" && session.payment_status === "paid")) {
          const paid = await markOrderPaidByStripeSession(input.sessionId);
          await completePaidStripeOrder(session, { mode, sendCustomerEmail: paid.justPaid });
          const refreshedOrder = await getOrderForStripeSessionForStore(input.sessionId, ctx.user.id, ctx.store?.id);
          if (!refreshedOrder) throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable pour cette boutique." });
          resolvedOrder = refreshedOrder;
        }
        return {
          status: session.payment_status,
          mode,
          order: {
            id: resolvedOrder.id,
            status: resolvedOrder.status,
            paymentStatus: resolvedOrder.paymentStatus,
            totalAmount: resolvedOrder.totalAmount,
            currencyCode: resolvedOrder.currencyCode,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Stripe session retrieval error", error);
        const fallbackMode: StripeConnectMode = getCurrentStripeCheckoutMode() ?? "test";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable(fallbackMode, "retrieve") });
      }
    }),
});
