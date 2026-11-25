import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_STYLE_TOKENS,
  THEME_COMMERCE_BLOCKS,
  createCommercePagesFromTheme,
  extractThemeStyleTokens,
  hasInventedCommerceData,
  injectCommerceCartIntoHeader,
  setCommerceElementsHidden,
  themeTokenCss,
} from "./themeCommerceTransition";

describe("theme commerce transition", () => {
  it("extrait et injecte les tokens visuels sans perdre les valeurs par défaut", () => {
    const tokens = extractThemeStyleTokens(".theme { --theme-primary: #d82519; --theme-radius: 12px; }");
    expect(tokens.primary).toBe("#d82519");
    expect(tokens.radius).toBe("12px");
    expect(tokens.font).toBe(DEFAULT_THEME_STYLE_TOKENS.font);
    expect(themeTokenCss(tokens, ".page-143")).toContain("--theme-primary: #d82519");
  });

  it("injecte le panier dans un header une seule fois", () => {
    const html = '<header data-mazigho-header="true"><nav>Navigation</nav></header>';
    const first = injectCommerceCartIntoHeader(html);
    const second = injectCommerceCartIntoHeader(first);
    expect(first).toContain('data-mazigho-commerce-role="header-cart"');
    expect(second).toBe(first);
  });

  it("crée les pages Boutique et Commande en conservant les autres pages", () => {
    const pages = createCommercePagesFromTheme(
      [{ id: "home", title: "Accueil", slug: "/", project: {} }],
      '<header data-mazigho-header="true">Header</header><main>Contenu</main><footer>Footer</footer>',
      ".theme { color: red; }",
    );
    expect(pages.map(page => page.title)).toEqual(["Accueil", "Boutique", "Produit", "Commande"]);
    expect(pages.find(page => page.title === "Boutique")?.project.components).toContain("Header");
    expect(pages.find(page => page.title === "Commande")?.project.components).toContain("data-mazigho-zone=\"shop-checkout\"");
  });

  it("masque puis restaure uniquement les éléments commerce", () => {
    const html = '<header data-mazigho-header="true"><a data-mazigho-commerce-element="true">Panier</a><a>Accueil</a></header>';
    const hidden = setCommerceElementsHidden(html, true);
    expect(hidden).toContain('hidden="hidden"');
    expect(hidden).toContain('>Accueil</a>');
    expect(setCommerceElementsHidden(hidden, false)).not.toContain('hidden="hidden"');
  });

  it("ne contient aucun prix ou produit métier inventé dans les blocs transition", () => {
    expect(THEME_COMMERCE_BLOCKS.every(block => !hasInventedCommerceData(block.content))).toBe(true);
    expect(THEME_COMMERCE_BLOCKS.find(block => block.id === "mazigho-commerce-catalog-grid")?.content).toContain('data-mazigho-state="empty"');
  });

  it("expose les blocs services et numérique avec des zones stables", () => {
    const ids = THEME_COMMERCE_BLOCKS.map(block => block.id);
    expect(ids).toHaveLength(18);
    expect(ids).toEqual(expect.arrayContaining(["mazigho-services-booking", "mazigho-services-menu", "mazigho-digital-asset-card", "mazigho-customer-portal"]));
    const booking = THEME_COMMERCE_BLOCKS.find(block => block.id === "mazigho-services-booking");
    expect(booking?.category).toBe("Services & Numérique");
    expect(booking?.content).toContain('data-mazigho-timezone="Europe/Zurich"');
    expect(booking?.traits?.find(trait => trait.name === "data-mazigho-slot-duration")?.options).toEqual(["15", "30", "45", "60"]);
  });
});
