import { TRPCError } from "@trpc/server";

const paymentServiceUrl = () => process.env.PAYMENT_SERVICE_PUBLIC_URL?.trim().replace(/\/$/, "") || null;
const paymentServiceToken = () => process.env.PAYMENT_SERVICE_TOKEN?.trim() || null;

type ProxyContext = { req: { headers: Record<string, string | string[] | undefined> } };

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function proxyError(status: number, code?: string) {
  if (status === 401 || code === "UNAUTHENTICATED") return new TRPCError({ code: "UNAUTHORIZED", message: "Votre session propriétaire n’est plus valide." });
  if (status === 403 || code === "FORBIDDEN") return new TRPCError({ code: "FORBIDDEN", message: "Vous n’avez pas le droit de gérer les paiements de cette boutique." });
  if (status === 404) return new TRPCError({ code: "NOT_FOUND", message: "Configuration de paiement introuvable." });
  return new TRPCError({ code: "BAD_GATEWAY", message: "Le service de paiement est momentanément indisponible. Aucun changement n’a été enregistré." });
}

export async function callPaymentService<T>(ctx: ProxyContext, path: string, init: { method?: string; storeId: number; body?: unknown }): Promise<T> {
  const baseUrl = paymentServiceUrl();
  const token = paymentServiceToken();
  if (!baseUrl || !token) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le service de paiement n’est pas configuré pour cette installation." });

  const headers: Record<string, string> = {
    "x-payment-service-token": token,
    "x-store-id": String(init.storeId),
  };
  const cookie = headerValue(ctx.req.headers.cookie);
  const authorization = headerValue(ctx.req.headers.authorization);
  const mazighoSession = headerValue(ctx.req.headers["x-mazigho-session"]);
  if (cookie) headers["x-forwarded-cookie"] = cookie;
  if (authorization) headers["x-forwarded-authorization"] = authorization;
  if (mazighoSession) headers["owner-session"] = mazighoSession;
  if (init.body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw proxyError(503);
  }

  const payload = await response.json().catch(() => ({})) as T & { error?: { code?: string } };
  if (!response.ok) throw proxyError(response.status, payload.error?.code);
  return payload;
}
