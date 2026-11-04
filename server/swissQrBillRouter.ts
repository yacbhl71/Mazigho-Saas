import { z } from "zod";
import { router, storeOwnerProcedure, protectedProcedure } from "./_core/trpc";
import {
  getStoreSwissCreditorConfig,
  saveStoreSwissCreditorConfig,
  renderSwissInvoiceHtml,
} from "./services/swissQrBillInvoice";
import type { SwissInvoiceData } from "../shared/swissQrBillInvoice";

export const swissQrBillRouter = router({
  getCreditorConfig: storeOwnerProcedure.query(async ({ ctx }) => {
    return await getStoreSwissCreditorConfig(ctx.store.id);
  }),

  saveCreditorConfig: storeOwnerProcedure
    .input(
      z.object({
        iban: z.string().min(10, "IBAN suisse requis."),
        creditorName: z.string().min(2, "Nom du créancier requis."),
        creditorStreet: z.string().min(2, "Adresse requise."),
        creditorPostalCode: z.string().min(2, "NPA requis."),
        creditorCity: z.string().min(2, "Ville requise."),
        creditorCountry: z.string().default("CH"),
        vatNumber: z.string().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await saveStoreSwissCreditorConfig(ctx.store.id, input);
    }),

  generateInvoiceData: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.store) {
        throw new Error("Boutique introuvable.");
      }

      const creditor = await getStoreSwissCreditorConfig(ctx.store.id);
      const storeName = ctx.store.displayName || "MAZIGHO Boutique";

      // Mock order fallback data if details query isn't initialized yet
      const today = new Date();
      const invoiceDateStr = today.toLocaleDateString("fr-CH");
      const dueDate = new Date(today.getTime() + 30 * 86400 * 1000).toLocaleDateString("fr-CH");

      const invoiceData: SwissInvoiceData = {
        invoiceNumber: `FAC-2026-${String(input.orderId).padStart(4, "0")}`,
        orderId: input.orderId,
        invoiceDate: invoiceDateStr,
        dueDate,
        storeName,
        creditor,
        customerName: ctx.user?.name || "Client MAZIGHO",
        customerEmail: ctx.user?.email || "client@example.ch",
        customerStreet: "",
        customerPostalCode: "",
        customerCity: "",
        customerCountry: "CH",
        items: [
          {
            productName: `Article de la commande #${input.orderId}`,
            quantity: 1,
            unitPriceCents: 4900,
            totalPriceCents: 4900,
          },
        ],
        subtotalCents: 4900,
        taxAmountCents: 390,
        taxRatePercent: 8.1,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 4900,
        currency: "CHF",
        unstructuredMessage: `Facture commande #${input.orderId} chez ${storeName}`,
      };

      const html = renderSwissInvoiceHtml(invoiceData);

      return {
        invoiceData,
        html,
      };
    }),
});
