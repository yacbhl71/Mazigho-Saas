import { describe, expect, it } from "vitest";
import {
  DELICES_TRESORS_MODE_BLOCKS,
  DELICES_TRESORS_MODE_MEDIA,
  DELICES_TRESORS_MODE_PAGES,
  DELICES_TRESORS_MODE_THEME,
} from "@/lib/themes/delicesTresorsMode/delicesTresorsModeTemplate";

describe("thème visuel Délices & Trésors · Atelier Mode", () => {
  it("expose l’identité mode et les quatre pages", () => {
    expect(DELICES_TRESORS_MODE_THEME.id).toBe("delices-tresors-mode");
    expect(DELICES_TRESORS_MODE_THEME.name).toContain("Atelier Mode");
    expect(DELICES_TRESORS_MODE_PAGES.map((page) => page.title)).toEqual(["Accueil", "Boutique", "Notre univers", "Contact"]);
    expect(DELICES_TRESORS_MODE_PAGES).toHaveLength(4);
  });

  it("partage un Header/Footer et prépare le catalogue et le panier", () => {
    expect(DELICES_TRESORS_MODE_PAGES.every((page) => page.html.includes('data-mazigho-header="true"') && page.html.includes('data-mazigho-footer="true"'))).toBe(true);
    expect(DELICES_TRESORS_MODE_PAGES.every((page) => page.html.includes('class="mz-dtm-logo" href="/"') && page.html.includes('data-mazigho-logo-mode="image"'))).toBe(true);
    const shopPage = DELICES_TRESORS_MODE_PAGES.find((page) => page.slug === "/boutique");
    expect(shopPage?.html).toContain('data-mazigho-zone="catalogue"');
    expect(shopPage?.html).toContain('data-mazigho-catalogue-state="empty"');
    expect(shopPage?.html).toContain("Aucun produit, prix, stock, paiement ou commande n’est activé");
    expect(shopPage?.html).toContain('data-mazigho-cart-trigger="true"');
  });

  it("enregistre des blocs universels avec des icônes SVG", () => {
    expect(DELICES_TRESORS_MODE_BLOCKS.length).toBeGreaterThanOrEqual(6);
    expect(DELICES_TRESORS_MODE_BLOCKS.every((block) => block.category === "Délices & Trésors · Atelier Mode" && block.icon.includes("<svg"))).toBe(true);
    expect(DELICES_TRESORS_MODE_BLOCKS.every((block) => !/ath-vahloul|model/i.test(`${block.id} ${block.label}`))).toBe(true);
  });

  it("déclare des médias locaux réalistes et des fallbacks éditables", () => {
    expect(DELICES_TRESORS_MODE_MEDIA.length).toBeGreaterThanOrEqual(7);
    expect(DELICES_TRESORS_MODE_MEDIA.every((media) => media.url.length > 0 && media.alt.length > 0)).toBe(true);
    expect(DELICES_TRESORS_MODE_MEDIA.some((media) => media.url.endsWith(".jpg") && media.sourceUrl.startsWith("https://unsplash.com"))).toBe(true);
    expect(DELICES_TRESORS_MODE_MEDIA.some((media) => media.sourceUrl.startsWith("local://"))).toBe(true);
  });

  it("garde les tokens, le CSS préfixé et le responsive", () => {
    expect(DELICES_TRESORS_MODE_THEME.css).toContain("--mz-primary:#ef3f88");
    expect(DELICES_TRESORS_MODE_THEME.css).toContain("--mz-secondary:#ff6b35");
    expect(DELICES_TRESORS_MODE_THEME.css).toContain("--mz-text:#171016");
    expect(DELICES_TRESORS_MODE_THEME.css).toContain(".mz-dtm-root");
    expect(DELICES_TRESORS_MODE_THEME.css).toContain("@media(max-width:767px)");
    expect(DELICES_TRESORS_MODE_THEME.css).toContain("@media(min-width:768px) and (max-width:1024px)");
    expect(DELICES_TRESORS_MODE_THEME.css).not.toMatch(/(^|\n)\s*(body|h1|h2|h3|a|button)\s*\{/);
  });

  it("ne contient aucune logique métier réelle", () => {
    expect(DELICES_TRESORS_MODE_THEME.html).not.toMatch(/api[_-]?key|sk_live|payment[_-]?secret|stock[_-]?id/i);
    expect(DELICES_TRESORS_MODE_THEME.html).not.toMatch(/stripe|paypal|checkout|data-mazigho-(order|inventory)|payment[_-]?provider/i);
  });
});
