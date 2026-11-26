import { describe, expect, it } from "vitest";
import { DELICES_TRESORS_BLOCKS, DELICES_TRESORS_CSS, DELICES_TRESORS_HTML, DELICES_TRESORS_MEDIA, DELICES_TRESORS_PAGES, DELICES_TRESORS_THEME } from "@/lib/themes/delicesTresors/delicesTresorsTemplate";

describe("thème visuel Délices et Trésors d’Algérie", () => {
  it("expose un contrat natif isolé", () => {
    expect(DELICES_TRESORS_THEME.id).toBe("delices-tresors-algerie");
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-theme="delices-tresors-algerie"');
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-header="true"');
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-language-selector="true"');
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-cart-trigger="true"');
  });
  it("fournit les quatre pages et le shell partagé", () => {
    expect(DELICES_TRESORS_PAGES.map((page) => page.title)).toEqual(["Accueil", "Boutique", "Histoire", "Contact"]);
    expect(DELICES_TRESORS_PAGES.every((page) => page.html.includes('data-mazigho-header="true"') && page.html.includes('data-mazigho-footer="true"'))).toBe(true);
    expect(DELICES_TRESORS_PAGES.find((page) => page.slug === "/boutique")?.html).toContain('data-mazigho-zone="catalogue"');
  });
  it("découpe les sections clés en blocs réutilisables", () => {
    expect(DELICES_TRESORS_BLOCKS.map((block) => block.id)).toEqual([
      "delices-tresors-header", "delices-tresors-hero", "delices-tresors-featured-cards", "delices-tresors-values", "delices-tresors-cta", "delices-tresors-newsletter", "delices-tresors-footer",
    ]);
    expect(DELICES_TRESORS_BLOCKS.every((block) => block.category === "Délices & Trésors · Thème visuel" && block.icon.includes("<svg"))).toBe(true);
  });
  it("déclare des médias importés et des rôles éditables", () => {
    expect(DELICES_TRESORS_MEDIA.length).toBeGreaterThanOrEqual(4);
    expect(DELICES_TRESORS_MEDIA.every((media) => media.url.length > 0 && media.alt.length > 0)).toBe(true);
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-media-role="category"');
    expect(DELICES_TRESORS_HTML).toContain('data-mazigho-background-image="true"');
  });
  it("garde le CSS strictement préfixé et responsive", () => {
    expect(DELICES_TRESORS_CSS).toContain(".mz-dta-root");
    expect(DELICES_TRESORS_CSS).toContain("@media(max-width:767px)");
    expect(DELICES_TRESORS_CSS).toContain("@media(max-width:360px)");
    expect(DELICES_TRESORS_CSS).toContain("max-width:100%");
    expect(DELICES_TRESORS_CSS).not.toMatch(/(^|\n)\s*(body|h1|h2|h3|a|button)\s*\{/);
    expect(DELICES_TRESORS_HTML).not.toMatch(/<script/i);
  });
  it("ne contient pas de logique métier active", () => {
    expect(DELICES_TRESORS_HTML).not.toMatch(/api[_-]?key|sk_live|payment[_-]?secret|stock[_-]?id/i);
    expect(DELICES_TRESORS_PAGES.find((page) => page.slug === "/boutique")?.html).toContain("Aucun produit, prix, stock ou paiement n’est activé");
  });
});
