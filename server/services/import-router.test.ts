import { describe, expect, it } from "vitest";
import { cloneImportPayloadSchema, isCloneApiKeyValid } from "./import-router";

const validPayload = {
  user_id: "user_abc123",
  project_name: "Boutique clonée",
  source_url: "https://example.com",
  platform: "shopify" as const,
  theme: { colors: { primary: "#111111" }, fonts: { body: "Inter" }, borderRadius: "8px" },
  pages: { home: { blocks: [{ type: "hero", props: { title: "Bienvenue" } }] } },
  catalog: [{ title: "Produit", price: 12.5, images: ["https://cdn.example.com/product.webp"], variants: [{ title: "Standard", sku: "SKU-1" }] }],
  navigation: [{ label: "Accueil", href: "/" }],
  settings: { currency: "EUR", clonedFrom: "https://example.com", clonedPlatform: "shopify", clonedAt: new Date().toISOString() },
};

describe("contrat d’import clone", () => {
  it("refuse une clé absente ou invalide et accepte uniquement la clé configurée", () => {
    expect(isCloneApiKeyValid(undefined, "secret-long")).toBe(false);
    expect(isCloneApiKeyValid("wrong", "secret-long")).toBe(false);
    expect(isCloneApiKeyValid("secret-long", "secret-long")).toBe(true);
  });
  it("accepte un projet strictement structuré", () => {
    expect(cloneImportPayloadSchema.safeParse(validPayload).success).toBe(true);
  });
  it("rejette les champs inattendus", () => {
    expect(cloneImportPayloadSchema.safeParse({ ...validPayload, payment_secret: "x" }).success).toBe(false);
  });
  it("rejette les scripts et iframes dans les blocs", () => {
    expect(cloneImportPayloadSchema.safeParse({ ...validPayload, pages: { home: { blocks: [{ type: "hero", props: { html: "<script>alert(1)</script>" } }] } } }).success).toBe(false);
    expect(cloneImportPayloadSchema.safeParse({ ...validPayload, pages: { home: { blocks: [{ type: "hero", props: { frame: "<iframe src=\"https://evil.example\" />" } }] } } }).success).toBe(false);
  });
  it("rejette toute tentative d’import de commande ou client", () => {
    expect(cloneImportPayloadSchema.safeParse({ ...validPayload, settings: { ...validPayload.settings, customer_email: "x@example.com" } }).success).toBe(false);
    expect(cloneImportPayloadSchema.safeParse({ ...validPayload, pages: { home: { blocks: [{ type: "hero", props: { checkoutUrl: "https://evil.example" } }] } } }).success).toBe(false);
  });
});
