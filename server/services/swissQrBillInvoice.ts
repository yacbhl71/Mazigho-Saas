import type {
  SwissCreditorConfig,
  SwissInvoiceData,
} from "../../shared/swissQrBillInvoice";
import {
  generateSixQrCodePayload,
  formatSwissIban,
  isValidSwissIban,
} from "../../shared/swissQrBillInvoice";

// Registry for store IBAN & Creditor setup: storeId -> SwissCreditorConfig
const creditorRegistry = new Map<number, SwissCreditorConfig>();

export async function getStoreSwissCreditorConfig(storeId: number): Promise<SwissCreditorConfig> {
  const existing = creditorRegistry.get(storeId);
  if (existing) return existing;

  const defaultConfig: SwissCreditorConfig = {
    iban: "",
    creditorName: "",
    creditorStreet: "",
    creditorPostalCode: "",
    creditorCity: "",
    creditorCountry: "CH",
    vatNumber: "",
    enabled: false,
  };

  creditorRegistry.set(storeId, defaultConfig);
  return defaultConfig;
}

export async function saveStoreSwissCreditorConfig(
  storeId: number,
  input: Partial<SwissCreditorConfig>
): Promise<SwissCreditorConfig> {
  const current = await getStoreSwissCreditorConfig(storeId);
  const cleanIban = (input.iban || current.iban).replace(/\s+/g, "").toUpperCase();

  if (input.iban && !isValidSwissIban(cleanIban)) {
    throw new Error("Numéro IBAN suisse ou liechtensteinois invalide (doit commencer par CH ou LI et comporter 21 caractères).");
  }

  const updated: SwissCreditorConfig = {
    ...current,
    ...input,
    iban: formatSwissIban(cleanIban),
  };

  creditorRegistry.set(storeId, updated);
  return updated;
}

export function renderSwissInvoiceHtml(data: SwissInvoiceData): string {
  const qrPayload = generateSixQrCodePayload({
    iban: data.creditor.iban,
    creditorName: data.creditor.creditorName,
    creditorStreet: data.creditor.creditorStreet,
    creditorPostalCode: data.creditor.creditorPostalCode,
    creditorCity: data.creditor.creditorCity,
    creditorCountry: data.creditor.creditorCountry,
    customerName: data.customerName,
    customerStreet: data.customerStreet,
    customerPostalCode: data.customerPostalCode,
    customerCity: data.customerCity,
    customerCountry: data.customerCountry,
    amountCents: data.totalCents,
    currency: data.currency,
    unstructuredMessage: data.unstructuredMessage,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`;

  const itemsRows = data.items
    .map(
      item => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: 500;">
        ${item.productName}
        ${item.variantLabel ? `<br/><span style="font-size: 11px; color: #64748b;">${item.variantLabel}</span>` : ""}
      </td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">${(item.unitPriceCents / 100).toFixed(2)} ${data.currency}</td>
      <td style="padding: 10px; text-align: right; font-weight: bold;">${(item.totalPriceCents / 100).toFixed(2)} ${data.currency}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Facture ${data.invoiceNumber} - ${data.storeName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 24px; border: 1px solid #cbd5e1; box-sizing: border-box; }
    .header-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
    .header-table td { vertical-align: top; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px; }
    .meta-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; }
    .items-table th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
    .totals-table { width: 280px; margin-left: auto; border-collapse: collapse; font-size: 12px; }
    .totals-table td { padding: 4px 8px; }
    .totals-table tr.grand-total td { font-size: 15px; font-weight: 800; color: #c2410c; border-top: 2px solid #0f172a; padding-top: 8px; }
    
    /* Official Swiss QR-Bill Payment Slip section at bottom */
    .swiss-qr-slip { margin-top: 40px; border-top: 1px dashed #94a3b8; padding-top: 20px; display: flex; gap: 20px; font-size: 10px; color: #000; }
    .qr-receipt { width: 180px; border-right: 1px solid #cbd5e1; padding-right: 15px; }
    .qr-payment { flex: 1; display: flex; gap: 20px; }
    .qr-code-box { width: 160px; height: 160px; border: 1px solid #000; padding: 4px; box-sizing: border-box; position: relative; }
    .qr-code-img { width: 100%; h-height: 100%; }
    .swiss-cross-center { position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; margin-top: -12px; margin-left: -12px; background: #000; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 16px; line-height: 1; }
    .section-title { font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="width: 55%;">
          <div class="title">${data.storeName}</div>
          <p style="margin: 0; color: #475569; font-size: 11px;">
            <strong>${data.creditor.creditorName}</strong><br/>
            ${data.creditor.creditorStreet}<br/>
            ${data.creditor.creditorPostalCode} ${data.creditor.creditorCity} (${data.creditor.creditorCountry})<br/>
            ${data.creditor.vatNumber ? `TVA : ${data.creditor.vatNumber}` : ""}
          </p>
        </td>
        <td style="width: 45%;">
          <div class="meta-box">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Facture N° ${data.invoiceNumber}</p>
            <p style="margin: 2px 0;"><strong>N° de commande :</strong> #${data.orderId}</p>
            <p style="margin: 2px 0;"><strong>Date d'émission :</strong> ${data.invoiceDate}</p>
            <p style="margin: 2px 0;"><strong>Échéance :</strong> ${data.dueDate}</p>
          </div>
        </td>
      </tr>
    </table>

    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px;">Facturé à :</p>
      <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a;">${data.customerName}</p>
      <p style="margin: 2px 0; color: #334155;">
        ${data.customerStreet}<br/>
        ${data.customerPostalCode} ${data.customerCity} (${data.customerCountry})<br/>
        E-mail : ${data.customerEmail}
      </p>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Désignation de l'article</th>
          <th style="text-align: center;">Qté</th>
          <th style="text-align: right;">Prix Unitaire</th>
          <th style="text-align: right;">Total Net</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td>Sous-total net :</td>
        <td style="text-align: right;">${(data.subtotalCents / 100).toFixed(2)} ${data.currency}</td>
      </tr>
      ${
        data.shippingCents > 0
          ? `<tr><td>Frais de livraison :</td><td style="text-align: right;">${(data.shippingCents / 100).toFixed(2)} ${data.currency}</td></tr>`
          : `<tr><td>Livraison :</td><td style="text-align: right; color: #16a34a;">Offerte</td></tr>`
      }
      ${
        data.discountCents > 0
          ? `<tr><td>Remise :</td><td style="text-align: right; color: #dc2626;">-${(data.discountCents / 100).toFixed(2)} ${data.currency}</td></tr>`
          : ""
      }
      ${
        data.taxAmountCents > 0
          ? `<tr><td>TVA (${data.taxRatePercent}%) :</td><td style="text-align: right;">${(data.taxAmountCents / 100).toFixed(2)} ${data.currency}</td></tr>`
          : ""
      }
      <tr class="grand-total">
        <td>Total à payer :</td>
        <td style="text-align: right;">${(data.totalCents / 100).toFixed(2)} ${data.currency}</td>
      </tr>
    </table>

    <!-- SWISS QR-BILL SECTION (Norme SIX Interbank Clearing) -->
    <div class="swiss-qr-slip">
      <!-- Receipt side -->
      <div class="qr-receipt">
        <div class="section-title">Récépissé</div>
        <p><strong>Compte / Payable à :</strong><br/>${data.creditor.iban}<br/>${data.creditor.creditorName}</p>
        <p><strong>Payable par :</strong><br/>${data.customerName}<br/>${data.customerPostalCode} ${data.customerCity}</p>
        <p style="margin-top: 15px;"><strong>Montant :</strong><br/><span style="font-size: 13px; font-weight: bold;">${data.currency} ${(data.totalCents / 100).toFixed(2)}</span></p>
      </div>

      <!-- Payment side -->
      <div class="qr-payment">
        <div>
          <div class="section-title">Section Paiement QR</div>
          <div class="qr-code-box">
            <img src="${qrCodeUrl}" alt="Swiss QR-Code" class="qr-code-img" />
            <div class="swiss-cross-center">+</div>
          </div>
          <p style="font-size: 9px; color: #475569; margin-top: 4px;">Scannez avec votre application bancaire suisse (e-banking / TWINT)</p>
        </div>

        <div style="flex: 1;">
          <p style="margin: 0 0 6px 0;"><strong>IBAN :</strong><br/>${data.creditor.iban}</p>
          <p style="margin: 0 0 6px 0;"><strong>Créancier :</strong><br/>${data.creditor.creditorName}<br/>${data.creditor.creditorStreet}, ${data.creditor.creditorPostalCode} ${data.creditor.creditorCity}</p>
          <p style="margin: 0 0 6px 0;"><strong>Information supplémentaire :</strong><br/>${data.unstructuredMessage}</p>
          <p style="margin: 0;"><strong>Débiteure :</strong><br/>${data.customerName}, ${data.customerCity}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
