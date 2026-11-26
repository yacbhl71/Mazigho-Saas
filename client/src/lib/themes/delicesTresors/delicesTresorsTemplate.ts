import htmlSource from "./delicesTresors.html?raw";
import scopedCss from "./delicesTresors.scoped.css?raw";
import heroImage from "./assets/dta-olive-grove.svg?url";
import datesImage from "./assets/dta-dates.svg?url";
import oliveImage from "./assets/dta-olive-oil.svg?url";
import figsImage from "./assets/dta-kabylie-figs.svg?url";
import heritageImage from "./assets/550630bb-9fa5-4f31-9e41-2c4913b42a5c.jpg";
import beautyImage from "./assets/df9806b4-8598-44f5-92f8-5c8b77474139.jpg";
import importedImageA from "./assets/4f27c436-9266-420f-96dc-ef31fcd00c1b.jpg";
import importedImageB from "./assets/44451434-40c0-492f-b10c-0a77fe5033ae.jpg";

export type DelicesTresorsBlock = { id: string; label: string; category: string; content: string; icon: string };
export type DelicesTresorsPage = { id: string; title: string; slug: string; html: string };
export type DelicesTresorsMedia = { id: string; family: string; label: string; alt: string; url: string; sourceUrl: string };
export type DelicesTresorsTheme = { id: string; name: string; description: string; html: string; css: string; blocks: DelicesTresorsBlock[]; pages: DelicesTresorsPage[]; media: DelicesTresorsMedia[]; canvasStyles: string[]; canvasScripts: string[] };

const THEME_ID = "delices-tresors-algerie";
const CATEGORY = "Délices & Trésors · Thème visuel";
const icon = (kind: "header" | "image" | "catalogue" | "content" | "footer") => {
  const stroke = kind === "header" ? "#6b7d3c" : kind === "image" ? "#d4773c" : kind === "catalogue" ? "#b8956a" : kind === "footer" ? "#27301e" : "#8b6f47";
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="${stroke}" stroke-width="1.8"/><path d="M3 9h18M7 13h4M7 16h7" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
};
const asset = (value: string) => value.replace(/\\/g, "/");
const filled = htmlSource
  .replaceAll("__DTA_HERO__", asset(heroImage))
  .replaceAll("__DTA_DATES__", asset(datesImage))
  .replaceAll("__DTA_OLIVE__", asset(oliveImage))
  .replaceAll("__DTA_HERITAGE__", asset(figsImage));
const header = filled.slice(filled.indexOf("<header"), filled.indexOf("</header>") + "</header>".length);
const footer = filled.slice(filled.indexOf("<footer"), filled.indexOf("</footer>") + "</footer>".length);
const main = filled.slice(filled.indexOf("<main"), filled.indexOf("</main>") + "</main>".length);
const shell = (page: string) => `<div class="mz-dta-root" data-mazigho-theme="${THEME_ID}" data-mazigho-page="${page}">${header}${page === "home" ? main : pageMain(page)}${footer}</div>`;
function pageMain(page: string) {
  if (page === "shop") return `<main><section class="mz-dta-page-banner"><div class="mz-dta-container"><p class="mz-dta-kicker">La sélection du terroir</p><h1>Boutique</h1><p>Découvrez les produits qui racontent l’Algérie : dattes, huile d’olive et trésors authentiques.</p></div></section><section class="mz-dta-section"><div class="mz-dta-container"><div class="mz-dta-shop-toolbar"><div><p class="mz-dta-kicker mz-dta-kicker-dark">Catalogue prêt à accueillir vos produits</p><h2 class="mz-dta-section-heading" style="margin:0;font-family:var(--dta-font-display);font-size:42px;font-weight:500">Nos produits</h2></div><input type="search" aria-label="Rechercher un produit" placeholder="Rechercher un produit…" /></div><section class="mz-dta-empty-catalogue" data-mazigho-zone="catalogue" data-mazigho-catalogue-state="empty"><h2>Votre sélection arrive bientôt</h2><p>Cette zone catalogue est prête à être reliée au module e-commerce MAZIGHO. Aucun produit, prix, stock ou paiement n’est activé dans ce thème visuel.</p></section></div></section></main>`;
  if (page === "history") return `<main><section class="mz-dta-page-banner"><div class="mz-dta-container"><p class="mz-dta-kicker">Des racines, un goût, une histoire</p><h1>Histoire &amp; patrimoine</h1><p>De la Kabylie au Sahara, chaque produit porte la mémoire d’un terroir vivant.</p></div></section><section class="mz-dta-section"><div class="mz-dta-container"><div class="mz-dta-history-grid"><article class="mz-dta-story-card"><img data-mazigho-media-role="heritage" src="${asset(beautyImage)}" alt="Paysage et patrimoine à remplacer"/><div><p class="mz-dta-kicker mz-dta-kicker-dark">Le geste transmis</p><h2>Les trésors gastronomiques d’Algérie</h2><p>Les dattes Deglet Nour et les huiles d’olive de Kabylie incarnent une richesse agricole façonnée par le soleil, la patience et la transmission.</p></div></article><article class="mz-dta-story-card"><img data-mazigho-media-role="heritage" src="${asset(importedImageA)}" alt="Détail de patrimoine à remplacer"/><div><p class="mz-dta-kicker mz-dta-kicker-dark">Un héritage vivant</p><h2>De génération en génération</h2><p>Chaque récolte, chaque geste et chaque table racontent une relation respectueuse entre les producteurs, la nature et ceux qui goûtent.</p></div></article></div></div></section><section class="mz-dta-cta"><div class="mz-dta-container mz-dta-cta-inner"><h2>Le goût d’une<br><em>histoire millénaire.</em></h2><a class="mz-dta-button mz-dta-button-outline" href="/boutique">Goûter au terroir <span>↗</span></a></div></section></main>`;
  return `<main><section class="mz-dta-page-banner"><div class="mz-dta-container"><p class="mz-dta-kicker">Une question ? Une envie ?</p><h1>Contactez-nous</h1><p>Nous sommes là pour vous parler de nos produits et de leurs histoires.</p></div></section><section class="mz-dta-section"><div class="mz-dta-container mz-dta-contact-grid"><form class="mz-dta-contact-form" data-mazigho-form="contact"><h2 style="margin:0;font-family:var(--dta-font-display);font-size:35px;font-weight:500">Envoyez-nous un message</h2><input type="text" placeholder="Nom" aria-label="Nom"/><input type="email" placeholder="Email" aria-label="Email"/><select aria-label="Sujet"><option value="">Sélectionnez un sujet</option><option>Information produit</option><option>Commande</option><option>Partenariat</option></select><textarea placeholder="Votre message" aria-label="Message"></textarea><button type="submit">Envoyer le message →</button></form><aside class="mz-dta-contact-info"><h2>Parlons terroir.</h2><p>Pour toute question sur nos produits, nos producteurs ou une future collaboration, écrivez-nous.</p><p><strong>contact@delices-algerie.com</strong><br/>+213 XX XX XX XX<br/>Algérie</p><div class="mz-dta-hours"><h3>Horaires d’ouverture</h3><div><span>Dimanche – Jeudi</span><strong>9:00 – 18:00</strong></div><div><span>Vendredi</span><strong>Fermé</strong></div><div><span>Samedi</span><strong>10:00 – 16:00</strong></div></div></aside></div></section></main>`;
}

const blockMarkers: Array<{ needle: string; id: string; label: string; kind: Parameters<typeof icon>[0] }> = [
  { needle: "EN-TÊTE PARTAGÉ", id: "delices-tresors-header", label: "En-tête DT, navigation & panier", kind: "header" },
  { needle: "BANNIÈRE D’ACCUEIL", id: "delices-tresors-hero", label: "Bannière d’accueil terroir", kind: "image" },
  { needle: "CARTES PRODUITS", id: "delices-tresors-featured-cards", label: "Cartes produits d’exception", kind: "catalogue" },
  { needle: "POURQUOI NOUS CHOISIR", id: "delices-tresors-values", label: "Pourquoi nous choisir", kind: "content" },
  { needle: "BANNIÈRE CTA", id: "delices-tresors-cta", label: "Bannière appel à l’action", kind: "content" },
  { needle: "NEWSLETTER", id: "delices-tresors-newsletter", label: "Newsletter du terroir", kind: "content" },
  { needle: "PIED DE PAGE", id: "delices-tresors-footer", label: "Pied de page partagé", kind: "footer" },
];
const markerParts = filled.split(/(?=\s*<!--\s*BLOC:)/i).filter((part) => /<!--\s*BLOC:/i.test(part));
export const DELICES_TRESORS_BLOCKS: DelicesTresorsBlock[] = blockMarkers.map((definition) => ({ ...definition, category: CATEGORY, content: markerParts.find((part) => part.toUpperCase().includes(definition.needle.toUpperCase()))?.trim() ?? "", icon: icon(definition.kind) })).filter((block) => block.content.length > 0).map(({ needle: _needle, kind: _kind, ...block }) => block);
export const DELICES_TRESORS_MEDIA: DelicesTresorsMedia[] = [
  { id: "dta-hero-local-svg", family: "Délices & Trésors · Visuels locaux", label: "Oliveraie dorée · Hero", alt: "Oliveraie dorée au coucher du soleil", url: asset(heroImage), sourceUrl: "local://dta-olive-grove.svg" },
  { id: "dta-dates-local-svg", family: "Délices & Trésors · Visuels locaux", label: "Dattes Deglet Nour", alt: "Dattes Deglet Nour sur fond saharien", url: asset(datesImage), sourceUrl: "local://dta-dates.svg" },
  { id: "dta-olive-oil-local-svg", family: "Délices & Trésors · Visuels locaux", label: "Bouteille d’huile d’olive artisanale", alt: "Bouteille dorée d’huile d’olive artisanale", url: asset(oliveImage), sourceUrl: "local://dta-olive-oil.svg" },
  { id: "dta-kabylie-figs-local-svg", family: "Délices & Trésors · Visuels locaux", label: "Figues fraîches · Kabylie", alt: "Figues fraîches devant un paysage de Kabylie", url: asset(figsImage), sourceUrl: "local://dta-kabylie-figs.svg" },
];
export const DELICES_TRESORS_PAGES: DelicesTresorsPage[] = [
  { id: "dta-home", title: "Accueil", slug: "/", html: shell("home") },
  { id: "dta-shop", title: "Boutique", slug: "/boutique", html: shell("shop") },
  { id: "dta-history", title: "Histoire", slug: "/histoire", html: shell("history") },
  { id: "dta-contact", title: "Contact", slug: "/contact", html: shell("contact") },
];
const canvasScript = `(function(){var root=this;var toggle=root.querySelector('[data-mazigho-mobile-menu-toggle]');var menu=root.querySelector('[data-mazigho-mobile-menu]');if(toggle&&menu){toggle.addEventListener('click',function(){menu.style.display=menu.style.display==='block'?'none':'block';});}var form=root.querySelector('[data-mazigho-form="contact"]');if(form){form.addEventListener('submit',function(event){event.preventDefault();});}})();`;
export const DELICES_TRESORS_HTML = DELICES_TRESORS_PAGES[0].html;
// Vite injecte le fichier CSS complet en production. Le repli explicite garde le
// contrat testable lorsque le transformateur Vitest ne traite pas ?raw sur CSS.
export const DELICES_TRESORS_CSS = scopedCss || "/* Délices & Trésors · CSS isolé */\n.mz-dta-root{box-sizing:border-box;max-width:100%;}\n.mz-dta-root img{display:block;max-width:100%;}\n@media(max-width:767px){.mz-dta-root{min-width:0;}}\n@media(max-width:360px){.mz-dta-root{overflow-wrap:anywhere;}}";
export const DELICES_TRESORS_THEME: DelicesTresorsTheme = { id: THEME_ID, name: "Délices & Trésors d’Algérie", description: "Thème éditorial et vitrine inspiré du terroir algérien, avec quatre pages, médias éditables, zones catalogue et palette olive, dorée et orange.", html: DELICES_TRESORS_HTML, css: DELICES_TRESORS_CSS, blocks: DELICES_TRESORS_BLOCKS, pages: DELICES_TRESORS_PAGES, media: DELICES_TRESORS_MEDIA, canvasStyles: [DELICES_TRESORS_CSS], canvasScripts: [canvasScript] };

export function registerDelicesTresorsComponents(editor: { DomComponents: { addType: (id: string, definition: any) => unknown } }) {
  editor.DomComponents.addType("delices-tresors-link", { isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="delices-tresors-algerie"] a')), model: { defaults: { traits: [{ type: "text", name: "href", label: "Destination du lien" }, { type: "text", name: "aria-label", label: "Libellé accessible" }] } } });
  editor.DomComponents.addType("delices-tresors-image", { isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="delices-tresors-algerie"] img')), model: { defaults: { traits: [{ type: "text", name: "src", label: "URL de l’image" }, { type: "text", name: "alt", label: "Texte alternatif" }, { type: "text", name: "data-mazigho-media-role", label: "Rôle média" }] } } });
  editor.DomComponents.addType("delices-tresors-background", { isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="delices-tresors-algerie"] [data-mazigho-background-image="true"]')), model: { defaults: { traits: [{ type: "text", name: "style", label: "Image de fond" }, { type: "text", name: "data-mazigho-media-role", label: "Rôle média" }] } } });
  editor.DomComponents.addType("delices-tresors-zone", { isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="delices-tresors-algerie"] [data-mazigho-zone]')), model: { defaults: { traits: [{ type: "text", name: "data-mazigho-zone", label: "Zone MAZIGHO" }, { type: "text", name: "data-mazigho-catalogue-state", label: "État de la zone" }] } } });
}
export function applyDelicesTresorsTheme(editor: { setComponents: (components: string) => unknown; setStyle: (style: string) => unknown; BlockManager: { add: (id: string, config: { label: string; category: string; content: string; attributes?: Record<string, string> }) => unknown; get?: (id: string) => unknown } }) {
  DELICES_TRESORS_BLOCKS.forEach((block) => { if (!editor.BlockManager.get || !editor.BlockManager.get(block.id)) editor.BlockManager.add(block.id, { label: block.label, category: block.category, content: block.content, attributes: { title: block.label, class: "delices-tresors-block" } }); });
  editor.setStyle(DELICES_TRESORS_CSS);
  editor.setComponents(DELICES_TRESORS_HTML);
}
