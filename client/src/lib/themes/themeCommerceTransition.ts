export type ThemeStyleTokens = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  font: string;
  radius: string;
};

export const DEFAULT_THEME_STYLE_TOKENS: ThemeStyleTokens = {
  primary: "#172033",
  secondary: "#f5b98f",
  background: "#ffffff",
  surface: "#faf8f5",
  text: "#172033",
  muted: "#5b6470",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  radius: "8px",
};

export const THEME_COMMERCE_CSS = `
[data-mazigho-commerce-element="true"] { --mz-primary: var(--theme-primary, #172033); --mz-secondary: var(--theme-secondary, #f5b98f); --mz-bg: var(--theme-background, #fff); --mz-text: var(--theme-text, #172033); --mz-font: var(--theme-font, sans-serif); --mz-radius: var(--theme-radius, 8px); }
[data-mazigho-commerce-element="true"] {
  --commerce-primary: var(--theme-primary, #172033);
  --commerce-secondary: var(--theme-secondary, #f5b98f);
  --commerce-background: var(--theme-background, #fff);
  --commerce-surface: var(--theme-surface, #faf8f5);
  --commerce-text: var(--theme-text, #172033);
  --commerce-muted: var(--theme-muted, #5b6470);
  --commerce-font: var(--theme-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  --commerce-radius: var(--theme-radius, 8px);
  font-family: var(--commerce-font);
  color: var(--commerce-text);
}
[data-mazigho-commerce-element="true"][hidden] { display: none !important; }
.mz-commerce-shell { box-sizing: border-box; width: 100%; max-width: 1180px; margin: 0 auto; padding: 48px 24px; background: var(--commerce-background); }
.mz-commerce-shell *, .mz-commerce-shell *::before, .mz-commerce-shell *::after { box-sizing: border-box; }
.mz-commerce-title { margin: 0 0 10px; color: var(--commerce-text); font: 800 30px/1.15 var(--commerce-font); }
.mz-commerce-empty { margin: 0; color: var(--commerce-muted); font: 14px/1.6 var(--commerce-font); }
.mz-commerce-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
.mz-commerce-card { min-height: 150px; padding: 20px; border: 1px dashed color-mix(in srgb, var(--commerce-primary) 35%, transparent); border-radius: var(--commerce-radius); background: var(--commerce-surface); }
.mz-commerce-button { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 10px 18px; border: 0; border-radius: var(--commerce-radius); background: var(--commerce-primary); color: #fff; font: 700 14px/1 var(--commerce-font); cursor: pointer; }
.mz-commerce-drawer { position: relative; margin: 24px; padding: 24px; border: 1px solid color-mix(in srgb, var(--commerce-primary) 18%, transparent); border-radius: var(--commerce-radius); background: var(--commerce-surface); box-shadow: 0 14px 34px rgba(0,0,0,.08); }
@media (max-width: 700px) { .mz-commerce-grid { grid-template-columns: 1fr; } .mz-commerce-shell { padding: 32px 16px; } }
`;

export type CommerceBlock = { id: string; label: string; category: string; content: string; traits?: Array<{ type: string; name: string; label: string; options?: string[] }> };

const icon = (symbol: string) => `<span aria-hidden="true" style="display:inline-grid;place-items:center;font-size:18px">${symbol}</span>`;

export const THEME_COMMERCE_BLOCKS: CommerceBlock[] = [
  {
    id: "mazigho-commerce-catalog-grid",
    label: `${icon("▦")} Grille Catalogue`,
    category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-product-grid" data-mazigho-dynamic="catalogue" data-mazigho-catalogue-kind="products"><h2 class="mz-commerce-title">Catalogue</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les produits publiés apparaîtront ici lorsque le catalogue sera connecté.</p><div class="mz-commerce-grid" data-mazigho-catalogue-slot="products" aria-live="polite"></div></section>`,
  },
  {
    id: "mazigho-commerce-featured-product",
    label: `${icon("✦")} Produit Vedette`,
    category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-featured-products" data-mazigho-dynamic="catalogue" data-mazigho-catalogue-kind="featured"><h2 class="mz-commerce-title">Produit vedette</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Un produit publié pourra être présenté ici depuis le catalogue connecté.</p><div data-mazigho-catalogue-slot="featured" aria-live="polite"></div></section>`,
  },
  {
    id: "mazigho-commerce-buy-button",
    label: `${icon("＋")} Bouton Acheter`,
    category: "Boutique",
    content: `<button type="button" class="mz-commerce-button" data-mazigho-commerce-element="true" data-mazigho-commerce-action="add-to-cart" data-mazigho-product-id="" aria-label="Ajouter le produit au panier">Ajouter au panier</button>`,
  },
  {
    id: "mazigho-commerce-cart-drawer",
    label: `${icon("🛒")} Tiroir Panier`,
    category: "Boutique",
    content: `<aside class="mz-commerce-drawer" data-mazigho-commerce-element="true" data-mazigho-commerce-action="cart-drawer" data-mazigho-zone="shop-cart" hidden aria-label="Panier"><h2 class="mz-commerce-title">Votre panier</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Votre panier est vide.</p><div data-mazigho-cart-items="true"></div></aside>`,
  },
  {
    id: "mazigho-commerce-bestsellers-carousel",
    label: `${icon("↔")} Meilleures ventes / Nouveautés`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-bestsellers" data-mazigho-dynamic="catalogue"><h2 class="mz-commerce-title">Sélection</h2><p class="mz-commerce-empty" data-mazigho-state="loading">Les produits seront chargés depuis la collection sélectionnée.</p><div data-mazigho-catalogue-slot="carousel" aria-live="polite"></div></section>`,
    traits: [{ type: "select", name: "data-mazigho-source", label: "Collection", options: ["best-sellers", "new-arrivals"] }],
  },
  {
    id: "mazigho-commerce-category-grid",
    label: `${icon("◇")} Grille de Catégories`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-categories" data-mazigho-dynamic="catalogue"><h2 class="mz-commerce-title">Catégories</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les catégories publiées apparaîtront ici.</p><div class="mz-commerce-grid" data-mazigho-catalogue-slot="categories"></div></section>`,
  },
  {
    id: "mazigho-commerce-search",
    label: `${icon("⌕")} Recherche Produits`, category: "Boutique",
    content: `<form class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-commerce-action="catalogue-search" data-mazigho-zone="shop-search"><label class="mz-commerce-title" for="mazigho-product-search">Rechercher</label><input id="mazigho-product-search" type="search" placeholder="Rechercher dans le catalogue connecté" aria-label="Rechercher dans le catalogue connecté" /></form>`,
  },
  {
    id: "mazigho-commerce-product-detail",
    label: `${icon("▣")} Fiche Produit`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-product-detail" data-mazigho-dynamic="catalogue"><h1 class="mz-commerce-title">Fiche produit</h1><p class="mz-commerce-empty" data-mazigho-state="empty">Sélectionnez un produit publié pour afficher ses informations.</p><div data-mazigho-catalogue-slot="product-detail"></div></section>`,
    traits: [{ type: "text", name: "data-mazigho-product-id", label: "Référence produit" }, { type: "select", name: "data-mazigho-product-layout", label: "Disposition", options: ["2-colonnes", "1-colonne"] }],
  },
  {
    id: "mazigho-commerce-flash-offer",
    label: `${icon("✧")} Produit Vedette / Offre`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-featured-offer" data-mazigho-dynamic="catalogue"><h2 class="mz-commerce-title">Offre mise en avant</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Aucun produit sélectionné pour le moment.</p></section>`,
    traits: [{ type: "text", name: "data-mazigho-product-id", label: "Référence produit" }, { type: "checkbox", name: "data-mazigho-show-countdown", label: "Afficher un compte à rebours" }],
  },
  {
    id: "mazigho-commerce-purchase-action",
    label: `${icon("→")} Achat / Don Express`, category: "Boutique",
    content: `<button type="button" class="mz-commerce-button" data-mazigho-commerce-element="true" data-mazigho-commerce-action="purchase" data-mazigho-product-id="">Action d’achat ou de contribution</button>`,
    traits: [{ type: "select", name: "data-mazigho-commerce-action", label: "Comportement", options: ["add-to-cart", "checkout", "donation"] }],
  },
  {
    id: "mazigho-commerce-offer-comparison",
    label: `${icon("☷")} Comparatif d’offres`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-offers" data-mazigho-dynamic="catalogue"><h2 class="mz-commerce-title">Offres disponibles</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les offres connectées seront affichées ici.</p><div class="mz-commerce-grid" data-mazigho-catalogue-slot="offers"></div></section>`,
  },
  {
    id: "mazigho-commerce-checkout",
    label: `${icon("✓")} Panier & Tunnel`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-checkout" data-mazigho-commerce-action="checkout"><h1 class="mz-commerce-title">Tunnel de commande</h1><p class="mz-commerce-empty">Le formulaire et les moyens de paiement seront fournis par les services autorisés lorsqu’ils seront configurés.</p></section>`,
  },
  {
    id: "mazigho-commerce-reassurance",
    label: `${icon("◇")} Réassurance`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-reassurance"><h2 class="mz-commerce-title">Une expérience claire</h2><div class="mz-commerce-grid"><div class="mz-commerce-card">Livraison et retours à préciser</div><div class="mz-commerce-card">Paiement sécurisé à configurer</div><div class="mz-commerce-card">Service client à renseigner</div></div></section>`,
  },
  {
    id: "mazigho-commerce-reviews",
    label: `${icon("★")} Avis & Étoiles`, category: "Boutique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="shop-reviews" data-mazigho-dynamic="catalogue"><h2 class="mz-commerce-title">Avis clients</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les avis vérifiés du catalogue seront affichés ici.</p><div data-mazigho-catalogue-slot="reviews"></div></section>`,
  },
  {
    id: "mazigho-services-booking",
    label: `${icon("◷")} Calendrier de réservation`, category: "Services & Numérique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="service-booking" data-mazigho-dynamic="booking"><h2 class="mz-commerce-title">Prendre rendez-vous</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les prestations et créneaux disponibles seront fournis par le service de réservation connecté.</p><div data-mazigho-booking-slot="true" data-mazigho-timezone="Europe/Zurich"></div></section>`,
    traits: [{ type: "select", name: "data-mazigho-slot-duration", label: "Durée par défaut", options: ["15", "30", "45", "60"] }, { type: "text", name: "data-mazigho-booking-lead-time", label: "Délai minimum (heures)" }, { type: "select", name: "data-mazigho-payment-timing", label: "Paiement", options: ["required", "on-site"] }, { type: "text", name: "data-mazigho-timezone", label: "Fuseau horaire" }],
  },
  {
    id: "mazigho-services-menu",
    label: `${icon("☰")} Catalogue de prestations`, category: "Services & Numérique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="service-menu" data-mazigho-dynamic="services"><h2 class="mz-commerce-title">Nos prestations</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Les prestations, durées et tarifs seront chargés depuis le service autorisé.</p><div data-mazigho-services-slot="true"></div></section>`,
    traits: [{ type: "select", name: "data-mazigho-service-layout", label: "Disposition", options: ["cards", "list"] }, { type: "select", name: "data-mazigho-service-action", label: "Action", options: ["booking", "contact"] }],
  },
  {
    id: "mazigho-digital-asset-card",
    label: `${icon("⇩")} Produit numérique`, category: "Services & Numérique",
    content: `<article class="mz-commerce-card" data-mazigho-commerce-element="true" data-mazigho-zone="digital-product" data-mazigho-dynamic="digital"><h2 class="mz-commerce-title">Produit numérique</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Le fichier, son format et son aperçu seront fournis par le catalogue numérique connecté.</p><div data-mazigho-digital-asset-slot="true"></div><button type="button" class="mz-commerce-button" data-mazigho-commerce-action="digital-purchase">Acheter le téléchargement</button></article>`,
    traits: [{ type: "select", name: "data-mazigho-digital-format", label: "Format affiché", options: ["pdf", "video", "software", "ticket"] }, { type: "checkbox", name: "data-mazigho-show-preview", label: "Afficher un aperçu" }],
  },
  {
    id: "mazigho-customer-portal",
    label: `${icon("◎")} Espace client`, category: "Services & Numérique",
    content: `<section class="mz-commerce-shell" data-mazigho-commerce-element="true" data-mazigho-zone="customer-portal" data-mazigho-dynamic="customer"><h2 class="mz-commerce-title">Mon espace</h2><p class="mz-commerce-empty" data-mazigho-state="empty">Connectez le portail client pour afficher les achats numériques, factures et réservations autorisés.</p><div data-mazigho-customer-portal-slot="true"></div></section>`,
    traits: [{ type: "select", name: "data-mazigho-portal-section", label: "Section", options: ["all", "downloads", "bookings", "invoices"] }],
  },
]; 

export function extractThemeStyleTokens(css: string, fallback: ThemeStyleTokens = DEFAULT_THEME_STYLE_TOKENS): ThemeStyleTokens {
  const read = (name: string, value: string) => {
    const match = css.match(new RegExp(`--${name}\\s*:\\s*([^;]+)`, "i"));
    return match?.[1]?.trim() || value;
  };
  return {
    primary: read("theme-primary", fallback.primary),
    secondary: read("theme-secondary", fallback.secondary),
    background: read("theme-background", fallback.background),
    surface: read("theme-surface", fallback.surface),
    text: read("theme-text", fallback.text),
    muted: read("theme-muted", fallback.muted),
    font: read("theme-font", fallback.font),
    radius: read("theme-radius", fallback.radius),
  };
}

export function themeTokenCss(tokens: ThemeStyleTokens, selector = ":root"): string {
  return `${selector} { --theme-primary: ${tokens.primary}; --theme-secondary: ${tokens.secondary}; --theme-background: ${tokens.background}; --theme-surface: ${tokens.surface}; --theme-text: ${tokens.text}; --theme-muted: ${tokens.muted}; --theme-font: ${tokens.font}; --theme-radius: ${tokens.radius}; }`;
}

export function injectThemeTokens(css: string, tokens: ThemeStyleTokens, selector: string): string {
  return `${themeTokenCss(tokens, selector)}\n${css}`;
}

export function registerThemeCommerceBlocks(editor: { BlockManager: { add: (id: string, config: { label: string; category: string; content: string; traits?: CommerceBlock["traits"] }) => unknown; get?: (id: string) => unknown } }): void {
  for (const block of THEME_COMMERCE_BLOCKS) {
    if (!editor.BlockManager.get?.(block.id)) editor.BlockManager.add(block.id, { label: block.label, category: block.category, content: block.content, traits: block.traits });
  }
}

export function commerceHeaderMarkup(): string {
  return `<a href="#panier" class="mz-commerce-cart-trigger" data-mazigho-commerce-element="true" data-mazigho-commerce-action="open-cart" aria-label="Ouvrir le panier"><span aria-hidden="true">🛒</span><span data-mazigho-cart-count="true">0</span></a>`;
}

export function injectCommerceCartIntoHeader(html: string): string {
  if (!html.includes('data-mazigho-header="true"') || html.includes('data-mazigho-commerce-role="header-cart"')) return html;
  const cart = commerceHeaderMarkup().replace("data-mazigho-commerce-element=\"true\"", 'data-mazigho-commerce-element="true" data-mazigho-commerce-role="header-cart"');
  return html.replace(/(<[^>]+data-mazigho-header="true"[^>]*>[\s\S]*?)(<\/header>)/i, `$1${cart}$2`);
}

export function setCommerceElementsHidden(html: string, hidden: boolean): string {
  return html.replace(/<([a-z0-9-]+)([^>]*data-mazigho-commerce-element="true"[^>]*)>/gi, (_match, tag, attributes) => {
    const withoutHidden = attributes.replace(/\s+hidden(?:="[^"]*")?/gi, "");
    return `<${tag}${withoutHidden}${hidden ? ' hidden="hidden"' : ""}>`;
  });
}

export type CommercePageSnapshot = { id: string; title: string; slug: string; project: { components?: unknown; styles?: unknown }; settings?: Record<string, unknown> };

function extractTag(html: string, tag: "header" | "footer"): string {
  return html.match(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "i"))?.[0] || "";
}

export function createCommercePagesFromTheme(pages: CommercePageSnapshot[], sourceHtml: string, sourceCss: string): CommercePageSnapshot[] {
  const header = extractTag(sourceHtml, "header");
  const footer = extractTag(sourceHtml, "footer");
  if (!header && !footer) return pages;
  const make = (id: string, title: string, slug: string, body: string): CommercePageSnapshot => ({ id, title, slug, project: { components: `${header}${body}${footer}`, styles: `${sourceCss}\n${THEME_COMMERCE_CSS}` }, settings: { language: "fr", description: "", socialCoverUrl: "", faviconUrl: "" } });
  const without = pages.filter(page => !["mazigho-boutique", "mazigho-produit", "mazigho-commande"].includes(page.id));
  return [...without, make("mazigho-boutique", "Boutique", "/boutique", THEME_COMMERCE_BLOCKS[0].content), make("mazigho-produit", "Produit", "/produit", THEME_COMMERCE_BLOCKS[7].content), make("mazigho-commande", "Commande", "/commande", THEME_COMMERCE_BLOCKS[11].content)];
}

export function hasInventedCommerceData(html: string): boolean {
  return /data-mazigho-(?:product-id|catalogue-kind)="[^"]+"/.test(html) && /(?:49[,.]99|59[,.]99|CHF|EUR)/i.test(html);
}

export type ThemeCommerceEditor = {
  BlockManager: { add: (id: string, config: { label: string; category: string; content: string; traits?: CommerceBlock["traits"] }) => unknown; get?: (id: string) => unknown };
  setStyle: (style: string) => unknown;
  setComponents: (components: string) => unknown;
  getHtml?: () => string;
};

export function enableThemeCommerce(editor: ThemeCommerceEditor, css: string, tokens: ThemeStyleTokens, themeSelector: string): { html: string; css: string } {
  registerThemeCommerceBlocks(editor);
  const currentHtml = editor.getHtml?.() || "";
  const html = injectCommerceCartIntoHeader(setCommerceElementsHidden(currentHtml, false));
  const nextCss = `${injectThemeTokens(css, tokens, themeSelector)}\n${THEME_COMMERCE_CSS}`;
  if (html && html !== currentHtml) editor.setComponents(html);
  editor.setStyle(nextCss);
  return { html, css: nextCss };
}

export function disableThemeCommerce(editor: ThemeCommerceEditor): string {
  const html = editor.getHtml?.() || "";
  const hidden = setCommerceElementsHidden(html, true);
  if (hidden && hidden !== html) editor.setComponents(hidden);
  return hidden;
}
