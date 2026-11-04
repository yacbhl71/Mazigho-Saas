import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
}));

import { swissQrBillRouter } from "./swissQrBillRouter";
import { isValidSwissIban, formatSwissIban, generateSixQrCodePayload } from "../shared/swissQrBillInvoice";

function makeOwnerCaller(storeId: number = 77) {
  state.membership = { role: "owner", status: "active" };
  return swissQrBillRouter.createCaller({
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

describe("swissQrBillRouter - Factures PDF & QR-Facture Suisse", () => {
  beforeEach(() => {
    state.membership = { role: "owner", status: "active" };
  });

  it("valide et formate les numéros IBAN suisses", () => {
    expect(isValidSwissIban("CH5630000000000000000")).toBe(true);
    expect(isValidSwissIban("INVALID_IBAN")).toBe(false);
    expect(formatSwissIban("CH5630000000000000000")).toBe("CH56 3000 0000 0000 0000 0");
  });

  it("génère le payload structuré QR-Code selon la norme SIX Interbank Clearing", () => {
    const payload = generateSixQrCodePayload({
      iban: "CH5630000000000000000",
      creditorName: "MAZIGHO Sàrl",
      creditorStreet: "Rue du Rhône 42",
      creditorPostalCode: "1204",
      creditorCity: "Genève",
      creditorCountry: "CH",
      customerName: "Jean Dupont",
      customerStreet: "Rue de la Gare 10",
      customerPostalCode: "1003",
      customerCity: "Lausanne",
      customerCountry: "CH",
      amountCents: 12500,
      currency: "CHF",
      unstructuredMessage: "Facture commande #1001",
    });

    expect(payload).toContain("SPC");
    expect(payload).toContain("0200");
    expect(payload).toContain("CH5630000000000000000");
    expect(payload).toContain("MAZIGHO Sàrl");
    expect(payload).toContain("125.00");
    expect(payload).toContain("EPD");
  });

  it("enregistre la configuration créancier de la boutique", async () => {
    const caller = makeOwnerCaller(701);
    const saved = await caller.saveCreditorConfig({
      iban: "CH56 3000 0000 0000 0000 0",
      creditorName: "MAZIGHO Boutique Suisse",
      creditorStreet: "Bahnhofstrasse 10",
      creditorPostalCode: "8001",
      creditorCity: "Zürich",
      creditorCountry: "CH",
    });

    expect(saved.creditorName).toBe("MAZIGHO Boutique Suisse");
    expect(saved.creditorCity).toBe("Zürich");
  });

  it("génère les données de facture et le HTML d'impression pour une commande", async () => {
    const caller = makeOwnerCaller(702);
    await caller.saveCreditorConfig({
      iban: "CH56 3000 0000 0000 0000 0",
      creditorName: "Boutique Test 702",
      creditorStreet: "Bahnhofstrasse 10",
      creditorPostalCode: "8001",
      creditorCity: "Zürich",
      creditorCountry: "CH",
    });
    const res = await caller.generateInvoiceData({ orderId: 1042 });

    expect(res.invoiceData.invoiceNumber).toContain("1042");
    expect(res.html).toContain("Facture N°");
    expect(res.html).toContain("Section Paiement QR");
    expect(res.html).toContain("CH56");
  });
});
