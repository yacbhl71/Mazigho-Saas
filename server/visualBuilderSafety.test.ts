import { describe, expect, it } from "vitest";
import { clearVisualBuilderLocalDraft, getVisualBuilderLocalDraftKey, isDynamicCatalogueAttributes, normalizeBuilderHref, readVisualBuilderLocalDraft, sanitizeBuilderAlt, writeVisualBuilderLocalDraft } from "../client/src/lib/visualBuilderSafety";

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

  it("isole et restaure un brouillon local sans exposer de données de boutique", () => {
    const values = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => values.set(key, value),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    };
    const key = getVisualBuilderLocalDraftKey({ storeId: 42 });
    expect(key).toBe("mazigho:visual-builder:draft:store-42");
    expect(writeVisualBuilderLocalDraft(storage, key, { components: "<section>test</section>", styles: "" })).toBe(true);
    expect(readVisualBuilderLocalDraft(storage, key)?.payload).toEqual({ components: "<section>test</section>", styles: "" });
    clearVisualBuilderLocalDraft(storage, key);
    expect(readVisualBuilderLocalDraft(storage, key)).toBeNull();
  });

  it("refuse un brouillon local trop volumineux", () => {
    const storage = { setItem: () => undefined };
    expect(writeVisualBuilderLocalDraft(storage, "draft", "x".repeat(2_000_001))).toBe(false);
  });
});
