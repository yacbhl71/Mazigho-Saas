import { ENV } from "./_core/env";
import { getGuestOrderTrackingRecipient } from "./db";
import { escapeHtml, isTransactionalEmailConfigured, sendTransactionalEmail } from "./transactionalEmail";
import { createOrderTrackingToken } from "./services/orderTrackingLink";

export function orderTrackingUrl(primaryDomain: string, storeId: number, orderId: number) {
  const token = createOrderTrackingToken({ storeId, orderId }, ENV.cookieSecret);
  return `https://${primaryDomain}/suivi-commande?t=${encodeURIComponent(token)}`;
}

/** E-mails a guest customer the link to follow a freshly paid order. Never throws. */
export async function sendGuestOrderTrackingEmail(storeId: number, orderId: number) {
  try {
    if (!isTransactionalEmailConfigured()) return;
    const recipient = await getGuestOrderTrackingRecipient(storeId, orderId);
    if (!recipient) return;
    const url = orderTrackingUrl(recipient.primaryDomain, storeId, orderId);
    const shop = recipient.storeName;
    const name = recipient.name?.trim().split(/\s+/)[0] ?? "";
    await sendTransactionalEmail({
      to: recipient.email,
      subject: `${shop} — suivi de votre commande n° ${orderId}`,
      idempotencyKey: `guest-order-tracking/${storeId}/${orderId}`,
      text: `Bonjour ${name},\n\nMerci pour votre commande n° ${orderId} chez ${shop}. Votre paiement est confirmé.\n\nSuivez votre commande ici, sans compte : ${url}\n\nCe lien est personnel : ne le partagez pas.`,
      html: `<p>Bonjour ${escapeHtml(name)},</p><p>Merci pour votre commande n° <strong>${orderId}</strong> chez <strong>${escapeHtml(shop)}</strong>. Votre paiement est confirmé.</p><p><a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600">Suivre ma commande</a></p><p>Ou copiez cette adresse dans votre navigateur :</p><p><a href="${url}">${url}</a></p><p>Ce lien est personnel : ne le partagez pas.</p>`,
    });
  } catch (error) {
    console.error("[guest-order-tracking] e-mail not sent", String(error));
  }
}
