import { describe, expect, it } from "vitest";
import { isDynamicCatalogueAttributes, normalizeBuilderHref, sanitizeBuilderAlt } from "../client/src/lib/visualBuilderSafety";

describe("visualBuilderSafety", () => {
  it("autorise les chemins internes et protocoles attendus", () => {
    expect(normalizeBuilderHref(" /boutique ")).toBe("/boutique");
    expect(normalizeBuilderHref("#contact")).toBe("#contact");
    expect(normalizeBuilderHref("https://example.com")).toBe("https://example.com");
    expect(normalizeBuilderHref("mailto:test@example.com")).toBe("mailto:test@example.com");
  });

  it("neutralise les protocoles inconnus", () => {
    expect(normalizeBuilderHref("javascript:alert(1)")).toBe("#");
    expect(normalizeBuilderHref("data:text/html,test")).toBe("#");
    expect(normalizeBuilderHref("//evil.example/path")).toBe("#");
  });

  it("nettoie et limite le texte alternatif", () => {
    expect(sanitizeBuilderAlt("Image <script> produit")).toBe("Image script produit");
    expect(sanitizeBuilderAlt("x".repeat(300))).toHaveLength(240);
  });

  it("reconnaît uniquement les sections catalogue marquées", () => {
    expect(isDynamicCatalogueAttributes({ "data-mazigho-dynamic": "catalogue" })).toBe(true);
    expect(isDynamicCatalogueAttributes({ "data-mazigho-dynamic": "other" })).toBe(false);
    expect(isDynamicCatalogueAttributes(undefined)).toBe(false);
  });
});
