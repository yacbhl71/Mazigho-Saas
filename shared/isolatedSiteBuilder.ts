/**
 * Constructeur de Sites Internet Indépendant — Noyau fonctionnel & Bibliothèques isolées
 *
 * Ce module est 100 % indépendant de Studio MAZIGHO et du moteur e-commerce.
 * Il ne contient ni catalogue produit, ni panier, ni checkout, ni paiement, ni stock,
 * ni commande, ni dépendance à un storeId.
 */

export type IndependentSiteType =
  | "vitrine"
  | "association"
  | "familial"
  | "professionnel"
  | "personnel"
  | "evenementiel"
  | "institutionnel"
  | "services";

export type IndependentSiteStatus = "draft" | "published" | "archived";

export type IndependentBuilderLibraryTab =
  | "pages"
  | "blocs"
  | "medias"
  | "calques"
  | "modules"
  | "socles"
  | "modeles";

export type ResponsiveViewportMode = "desktop" | "tablet" | "mobile";

export interface IndependentSiteTypeOption {
  value: IndependentSiteType;
  label: string;
  description: string;
}

export const INDEPENDENT_SITE_TYPE_OPTIONS: ReadonlyArray<IndependentSiteTypeOption> = [
  {
    value: "vitrine",
    label: "Site vitrine",
    description: "Présentez votre activité, votre identité, vos réalisations et vos coordonnées.",
  },
  {
    value: "association",
    label: "Site associatif",
    description: "Rassemblez vos adhérents, publiez vos actions, événements et appels à participation.",
  },
  {
    value: "familial",
    label: "Site familial",
    description: "Partagez l’histoire familiale, l’annuaire des membres, l’entraide et les annonces avec consentement.",
  },
  {
    value: "professionnel",
    label: "Site professionnel",
    description: "Valorisez votre cabinet, atelier ou entreprise avec vos expertises et prises de contact.",
  },
  {
    value: "personnel",
    label: "Site personnel",
    description: "Créez votre portfolio, carnet de projets, CV interactif ou espace d’expression.",
  },
  {
    value: "evenementiel",
    label: "Site événementiel",
    description: "Présentez un programme, des intervenants, un lieu, un compte à rebours et des inscriptions.",
  },
  {
    value: "institutionnel",
    label: "Site institutionnel",
    description: "Diffusez des informations officielles, publications, missions et rapports publics.",
  },
  {
    value: "services",
    label: "Site de présentation de services",
    description: "Détaillez vos prestations, votre méthode en étapes, vos témoignages et votre FAQ.",
  },
] as const;

export const INDEPENDENT_BUILDER_LIBRARY_TABS: ReadonlyArray<{
  id: IndependentBuilderLibraryTab;
  label: string;
  description: string;
}> = [
  { id: "pages", label: "Pages", description: "Arborescence des pages, menus et sous-menus du site" },
  { id: "blocs", label: "Blocs", description: "Éléments visuels : Hero, textes, images, cartes « + », FAQ, étapes, vidéos" },
  { id: "medias", label: "Médias", description: "Bibliothèque personnelle d’images par projet et transformations visuelles" },
  { id: "calques", label: "Calques", description: "Hiérarchie des sections de la page active : ordre, visibilité, verrouillage" },
  { id: "modules", label: "Modules", description: "Composants fonctionnels réutilisables : événements, formulaires, membres, annuaire" },
  { id: "socles", label: "Socles", description: "Structures de pages prêtes à personnaliser (Accueil, Association, Famille, Services…)" },
  { id: "modeles", label: "Modèles", description: "Sites complets multi-pages prêts à l’emploi avec identité visuelle et navigation" },
] as const;

export const RESPONSIVE_VIEWPORTS: ReadonlyArray<{
  id: ResponsiveViewportMode;
  label: string;
  widthCss: string;
  maxWidthPx: number;
}> = [
  { id: "desktop", label: "Ordinateur", widthCss: "100%", maxWidthPx: 1440 },
  { id: "tablet", label: "Tablette", widthCss: "768px", maxWidthPx: 768 },
  { id: "mobile", label: "Mobile", widthCss: "375px", maxWidthPx: 375 },
] as const;

// ---------------------------------------------------------------------------
// 1. Transformations d’images (Rotation, Inclinaison, Retournement, Zoom, Position libre)
// ---------------------------------------------------------------------------

export interface IndependentImageTransforms {
  rotationDeg: number; // -180 to 180
  skewXDeg: number; // -45 to 45
  skewYDeg: number; // -45 to 45
  flipHorizontal: boolean;
  flipVertical: boolean;
  scalePercent: number; // 25 to 250 (100 = taille normale)
  offsetX: number; // -300 to 300 px (positionnement libre horizontal)
  offsetY: number; // -300 to 300 px (positionnement libre vertical)
  widthPx?: number | null;
  heightPx?: number | null;
  borderRadiusPx?: number;
  objectFit?: "cover" | "contain" | "fill";
}

export const DEFAULT_IMAGE_TRANSFORMS: IndependentImageTransforms = {
  rotationDeg: 0,
  skewXDeg: 0,
  skewYDeg: 0,
  flipHorizontal: false,
  flipVertical: false,
  scalePercent: 100,
  offsetX: 0,
  offsetY: 0,
  widthPx: null,
  heightPx: null,
  borderRadiusPx: 14,
  objectFit: "cover",
};

export function clampNumber(val: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

export function normalizeImageTransforms(
  input: Partial<IndependentImageTransforms> | null | undefined
): IndependentImageTransforms {
  return {
    rotationDeg: clampNumber(Number(input?.rotationDeg ?? 0), -180, 180, 0),
    skewXDeg: clampNumber(Number(input?.skewXDeg ?? 0), -45, 45, 0),
    skewYDeg: clampNumber(Number(input?.skewYDeg ?? 0), -45, 45, 0),
    flipHorizontal: Boolean(input?.flipHorizontal),
    flipVertical: Boolean(input?.flipVertical),
    scalePercent: clampNumber(Number(input?.scalePercent ?? 100), 25, 250, 100),
    offsetX: clampNumber(Number(input?.offsetX ?? 0), -400, 400, 0),
    offsetY: clampNumber(Number(input?.offsetY ?? 0), -400, 400, 0),
    widthPx:
      typeof input?.widthPx === "number" && Number.isFinite(input.widthPx) && input.widthPx >= 40
        ? Math.round(input.widthPx)
        : null,
    heightPx:
      typeof input?.heightPx === "number" && Number.isFinite(input.heightPx) && input.heightPx >= 40
        ? Math.round(input.heightPx)
        : null,
    borderRadiusPx: clampNumber(Number(input?.borderRadiusPx ?? 14), 0, 999, 14),
    objectFit:
      input?.objectFit === "contain" || input?.objectFit === "fill" ? input.objectFit : "cover",
  };
}

export function buildImageTransformCss(
  input: Partial<IndependentImageTransforms> | null | undefined
): string {
  const t = normalizeImageTransforms(input);
  const scaleBase = t.scalePercent / 100;
  const scaleX = Number((scaleBase * (t.flipHorizontal ? -1 : 1)).toFixed(3));
  const scaleY = Number((scaleBase * (t.flipVertical ? -1 : 1)).toFixed(3));
  const transforms: string[] = [
    `translate(${t.offsetX}px, ${t.offsetY}px)`,
    `rotate(${t.rotationDeg}deg)`,
    `skew(${t.skewXDeg}deg, ${t.skewYDeg}deg)`,
    `scale(${scaleX}, ${scaleY})`,
  ];

  const rules: string[] = [
    "display:block",
    `object-fit:${t.objectFit}`,
    `border-radius:${t.borderRadiusPx}px`,
    `transform:${transforms.join(" ")}`,
    "transform-origin:center center",
    "transition:transform 0.2s ease",
  ];
  if (t.widthPx) {
    rules.push(`width:${t.widthPx}px`, "max-width:100%");
  } else {
    rules.push("width:100%");
  }
  if (t.heightPx) {
    rules.push(`height:${t.heightPx}px`);
  }
  return rules.join(";");
}

// ---------------------------------------------------------------------------
// 2. Cartes visuelles configurables (formes, positions texte, duplication, bouton « + »)
// ---------------------------------------------------------------------------

export type VisualCardShape = "square" | "rectangular" | "round";
export type VisualCardTextPlacement = "top" | "bottom" | "inside";

export interface VisualCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  shape: VisualCardShape;
  textPlacement: VisualCardTextPlacement;
  showButton: boolean;
  buttonLabel: string;
  buttonHref: string;
}

export interface VisualCardGridConfig {
  sectionTitle: string;
  sectionEyebrow: string;
  columns: 2 | 3 | 4;
  shape: VisualCardShape;
  textPlacement: VisualCardTextPlacement;
  showButton: boolean;
  cards: VisualCardItem[];
}

export function sanitizeBuilderHref(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "#";
  if (
    (trimmed.startsWith("/") && !trimmed.startsWith("//")) ||
    trimmed.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(trimmed)
  ) {
    return trimmed;
  }
  return "#";
}

export function sanitizeBuilderText(raw: string, maxLen = 280): string {
  return (raw || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

/** Retire les contenus exécutables avant de rendre un site publiquement. */
export function sanitizeIndependentHtml(raw: string): string {
  return (raw || "")
    .replace(/<\/?(?:script|iframe|object|embed|base|meta|link|svg|math)(?:\s[^>]*)?>[\s\S]*?<\/(?:script|iframe|object|embed|svg|math)>/gi, "")
    .replace(/<\/?(?:script|iframe|object|embed|base|meta|link|svg|math)(?:\s[^>]*)?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src|action)\s*=\s*(["'])\s*(?:javascript:|data:text\/html|vbscript:)[^"']*\2/gi, (_match, attribute: string) => ` ${attribute}="#"`)
    .replace(/\s+(href|src|action)\s*=\s*(?:javascript:|data:text\/html|vbscript:)[^\s>]+/gi, (_match, attribute: string) => ` ${attribute}="#"`)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}

/** Bloque les constructions CSS pouvant exécuter ou exfiltrer du contenu. */
export function sanitizeIndependentCss(raw: string): string {
  return (raw || "")
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(\s*["']?\s*(?:javascript:|data:text\/html)/gi, "url(");
}

const DEFAULT_CARD_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23263653'/%3E%3Ccircle cx='320' cy='210' r='92' fill='%23f5b98f' fill-opacity='.65'/%3E%3Cpath d='M0 390 Q160 280 320 390 T640 390 V480 H0Z' fill='%23172033'/%3E%3C/svg%3E";

export function createDefaultVisualCardItem(
  index: number,
  overrides?: Partial<VisualCardItem>
): VisualCardItem {
  return {
    id: overrides?.id || `card-${index}-${Date.now().toString(36)}`,
    title: overrides?.title || `Carte visuelle ${index}`,
    subtitle: overrides?.subtitle || "Rubrique",
    description:
      overrides?.description ||
      "Personnalisez la forme (carrée, rectangulaire, ronde), la position du texte et l’image.",
    imageUrl: overrides?.imageUrl || DEFAULT_CARD_SVG,
    imageAlt: overrides?.imageAlt || `Illustration carte ${index}`,
    shape: overrides?.shape || "rectangular",
    textPlacement: overrides?.textPlacement || "bottom",
    showButton: overrides?.showButton ?? true,
    buttonLabel: overrides?.buttonLabel || "En savoir plus",
    buttonHref: sanitizeBuilderHref(overrides?.buttonHref || "#"),
  };
}

export function addCardToVisualCardGrid(
  config: VisualCardGridConfig,
  overrides?: Partial<VisualCardItem>
): VisualCardGridConfig {
  const nextIndex = config.cards.length + 1;
  const newCard = createDefaultVisualCardItem(nextIndex, {
    shape: config.shape,
    textPlacement: config.textPlacement,
    showButton: config.showButton,
    ...overrides,
  });
  return {
    ...config,
    cards: [...config.cards, newCard],
  };
}

export function duplicateCardInVisualCardGrid(
  config: VisualCardGridConfig,
  cardId: string
): VisualCardGridConfig {
  const index = config.cards.findIndex((c) => c.id === cardId);
  if (index === -1) return config;
  const source = config.cards[index];
  const copy: VisualCardItem = {
    ...source,
    id: `${source.id}-copy-${Date.now().toString(36)}`,
    title: `${source.title} (copie)`,
  };
  const nextCards = [...config.cards];
  nextCards.splice(index + 1, 0, copy);
  return {
    ...config,
    cards: nextCards,
  };
}

export function renderVisualCardHtml(card: VisualCardItem): string {
  const safeTitle = sanitizeBuilderText(card.title, 120);
  const safeSubtitle = sanitizeBuilderText(card.subtitle, 80);
  const safeDesc = sanitizeBuilderText(card.description, 320);
  const safeAlt = sanitizeBuilderText(card.imageAlt, 140);
  const safeHref = sanitizeBuilderHref(card.buttonHref);
  const safeBtnLabel = sanitizeBuilderText(card.buttonLabel, 60);

  const imageHeight =
    card.shape === "square" ? "240px" : card.shape === "round" ? "220px" : "190px";
  const imageWidth = card.shape === "round" ? "220px" : "100%";
  const imageRadius =
    card.shape === "round" ? "9999px" : card.shape === "square" ? "16px" : "14px";
  const imageMargin = card.shape === "round" ? "16px auto" : "0";

  const textBlock = `<div data-site-card-text="${card.textPlacement}" style="padding:18px 20px"><p style="margin:0;color:#9b563e;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">${safeSubtitle}</p><h3 style="margin:8px 0;font-size:20px;color:${card.textPlacement === "inside" ? "#ffffff" : "#172033"}">${safeTitle}</h3><p style="margin:0;color:${card.textPlacement === "inside" ? "#e6ebf2" : "#5b6470"};font-size:14px;line-height:1.6">${safeDesc}</p>${
    card.showButton
      ? `<a href="${safeHref}" style="display:inline-block;margin-top:14px;padding:9px 15px;border-radius:8px;background:${card.textPlacement === "inside" ? "#f5b98f" : "#172033"};color:${card.textPlacement === "inside" ? "#172033" : "#ffffff"};text-decoration:none;font-size:13px;font-weight:700">${safeBtnLabel}</a>`
      : ""
  }</div>`;

  if (card.textPlacement === "inside") {
    return `<article data-site-visual-card="true" data-card-id="${card.id}" data-card-shape="${card.shape}" data-card-text="inside" style="position:relative;overflow:hidden;border-radius:${imageRadius};min-height:280px;display:flex;align-items:flex-end;background:#172033;color:#fff;box-shadow:0 12px 28px rgba(23,32,51,.12)"><img src="${card.imageUrl}" alt="${safeAlt}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55" /><div style="position:relative;z-index:2;width:100%;background:linear-gradient(180deg,transparent 0%,rgba(23,32,51,.88) 100%)">${textBlock}</div></article>`;
  }

  const imgBlock = `<div style="padding:${card.shape === "round" ? "12px 12px 0" : "0"};text-align:center"><img src="${card.imageUrl}" alt="${safeAlt}" style="display:block;width:${imageWidth};height:${imageHeight};margin:${imageMargin};object-fit:cover;border-radius:${imageRadius}" /></div>`;

  return `<article data-site-visual-card="true" data-card-id="${card.id}" data-card-shape="${card.shape}" data-card-text="${card.textPlacement}" style="background:#ffffff;border:1px solid #e6dfd5;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 8px 22px rgba(23,32,51,.06)">${
    card.textPlacement === "top" ? `${textBlock}${imgBlock}` : `${imgBlock}${textBlock}`
  }</article>`;
}

export function renderVisualCardGridHtml(config: VisualCardGridConfig): string {
  const safeEyebrow = sanitizeBuilderText(config.sectionEyebrow, 80);
  const safeTitle = sanitizeBuilderText(config.sectionTitle, 140);
  const cardsHtml = config.cards.map((card) => renderVisualCardHtml(card)).join("");

  return `<section data-site-card-grid="true" data-card-shape="${config.shape}" data-card-text="${config.textPlacement}" style="padding:52px 28px;background:#faf8f5"><div style="max-width:1120px;margin:0 auto"><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:26px"><div><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">${safeEyebrow}</p><h2 style="margin:8px 0 0;font-size:32px;color:#172033">${safeTitle}</h2></div><span data-site-card-add-hint="true" style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid #dfd7cc;color:#172033;font-size:12px;font-weight:700">+ Cartes extensibles (${config.cards.length})</span></div><div data-site-card-grid-items="true" style="display:grid;grid-template-columns:repeat(${config.columns},minmax(0,1fr));gap:20px">${cardsHtml}</div></div></section>`;
}

// ---------------------------------------------------------------------------
// 3. Blocs Éditoriaux (24 Blocs garantis sans aucun élément e-commerce)
// ---------------------------------------------------------------------------

export interface IndependentBuilderBlock {
  id: string;
  label: string;
  category:
    | "Navigation & Structure"
    | "Hero & Bannières"
    | "Textes & Actions"
    | "Images & Médias"
    | "Cartes & Grilles"
    | "Confiance & Contenu"
    | "Contact & Décoration";
  description: string;
  content: string;
}

export const INDEPENDENT_BUILDER_BLOCKS: ReadonlyArray<IndependentBuilderBlock> = [
  {
    id: "site-header-configurable",
    label: "Header configurable + menu",
    category: "Navigation & Structure",
    description: "En-tête de site avec logo, liens de navigation et bouton d’action.",
    content: `<header data-site-block="header" style="padding:18px 28px;background:#ffffff;color:#172033;border-bottom:1px solid #e8e2d9"><div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-weight:800;font-size:21px;letter-spacing:.02em">Nom du Site</a><nav aria-label="Menu principal" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Accueil</a><a href="/a-propos" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">À propos</a><a href="/activites" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Activités</a><a href="/evenements" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Événements</a><a href="/contact" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/contact" style="display:inline-block;padding:10px 18px;background:#172033;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Nous écrire</a></div></header>`,
  },
  {
    id: "site-header-submenus",
    label: "Header avec menus et sous-menus",
    category: "Navigation & Structure",
    description: "Navigation multi-niveaux avec menus déroulants accessibles sans JavaScript lourd.",
    content: `<header data-site-block="header-submenus" style="padding:18px 28px;background:#ffffff;color:#172033;border-bottom:1px solid #e8e2d9"><div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-weight:800;font-size:21px">Association & Famille</a><nav aria-label="Navigation avec sous-menus" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><a href="/" style="padding:8px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">Accueil</a><details data-site-submenu="true" style="position:relative"><summary style="cursor:pointer;list-style:none;padding:8px 12px;color:#172033;font-size:14px;font-weight:600">Notre Organisation ▾</summary><div style="position:absolute;left:0;top:40px;z-index:20;min-width:210px;padding:8px;background:#ffffff;border:1px solid #e8e2d9;border-radius:10px;box-shadow:0 12px 28px rgba(23,32,51,.12)"><a href="/histoire" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Notre histoire</a><a href="/membres" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Membres & rôles</a><a href="/charte" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Charte & valeurs</a></div></details><details data-site-submenu="true" style="position:relative"><summary style="cursor:pointer;list-style:none;padding:8px 12px;color:#172033;font-size:14px;font-weight:600">Vie Collective ▾</summary><div style="position:absolute;left:0;top:40px;z-index:20;min-width:210px;padding:8px;background:#ffffff;border:1px solid #e8e2d9;border-radius:10px;box-shadow:0 12px 28px rgba(23,32,51,.12)"><a href="/evenements" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Calendrier des rencontres</a><a href="/entraide" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Entraide & matériel</a><a href="/annonces" style="display:block;padding:9px 12px;color:#172033;text-decoration:none;font-size:13px">Annonces & mémoire</a></div></details><a href="/contact" style="padding:8px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/participer" style="display:inline-block;padding:10px 18px;background:#9b563e;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Rejoindre</a></div></header>`,
  },
  {
    id: "site-footer-configurable",
    label: "Footer configurable multi-colonnes",
    category: "Navigation & Structure",
    description: "Pied de page complet avec présentation, liens rapides, informations légales et contact.",
    content: `<footer data-site-block="footer" style="padding:54px 28px 24px;background:#172033;color:#ffffff"><div style="max-width:1160px;margin:0 auto"><div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1.2fr;gap:28px"><div><h2 style="margin:0 0 12px;font-size:24px">Nom du Site</h2><p style="margin:0;color:#cbd2dc;line-height:1.7;font-size:14px">Un site internet indépendant conçu pour informer, fédérer et valoriser vos initiatives.</p></div><div><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Navigation</h3><a href="/" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Accueil</a><a href="/a-propos" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">À propos</a><a href="/evenements" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Événements</a></div><div><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Informations</h3><a href="/mentions-legales" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Mentions légales</a><a href="/confidentialite" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Confidentialité</a><a href="/contact" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Contact</a></div><div><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Restons en lien</h3><p style="margin:0;color:#cbd2dc;font-size:14px;line-height:1.6">Écrivez-nous ou participez à nos prochaines rencontres.</p></div></div><div style="margin-top:38px;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;color:#9ba6b5;font-size:12px"><span>© Tous droits réservés</span><span>Site internet indépendant</span></div></div></footer>`,
  },
  {
    id: "site-hero-split",
    label: "Section Hero principale (Texte + Image)",
    category: "Hero & Bannières",
    description: "Grande section d’ouverture avec surtitre, titre, texte, deux boutons et visuel.",
    content: `<section data-site-block="hero" style="padding:84px 28px;background:linear-gradient(135deg,#172033 0%,#263653 60%,#3d5269 100%);color:#ffffff"><div style="max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center"><div><p style="margin:0;color:#f5b98f;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">Identité · Mission · Partage</p><h1 style="font-size:clamp(36px,5.5vw,62px);line-height:1.06;margin:14px 0 18px;color:#ffffff">Construisez un site à votre image</h1><p style="max-width:580px;margin:0 0 26px;color:#e6ebf2;line-height:1.75;font-size:17px">Présentez votre association, votre famille, votre activité professionnelle ou vos événements dans un espace clair et accueillant.</p><div style="display:flex;flex-wrap:wrap;gap:12px"><a href="/a-propos" style="display:inline-block;padding:13px 22px;background:#ffffff;color:#172033;border-radius:8px;text-decoration:none;font-weight:800">Découvrir notre projet</a><a href="/contact" style="display:inline-block;padding:12px 20px;border:1px solid rgba(255,255,255,.7);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700">Nous contacter</a></div></div><div style="padding:16px;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)"><img src="${DEFAULT_CARD_SVG}" alt="Illustration principale du site" data-site-transformable-image="true" style="display:block;width:100%;height:260px;object-fit:cover;border-radius:14px" /></div></div></section>`,
  },
  {
    id: "site-banner-announcement",
    label: "Bannière d’annonce / mise en avant",
    category: "Hero & Bannières",
    description: "Bandeau éditorial pour annoncer une rencontre, une actualité ou une initiative.",
    content: `<section data-site-block="banner" style="padding:52px 28px;background:linear-gradient(100deg,#ead9c9 0%,#f7f3ee 55%,#d9e1df 100%);color:#172033"><div style="max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap"><div style="flex:1 1 520px"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase">Annonce importante</p><h2 style="font-size:32px;margin:10px 0;color:#172033">Un rendez-vous à partager avec votre communauté</h2><p style="margin:0;color:#475569;line-height:1.7">Mettez en lumière une assemblée générale, une fête familiale, une conférence ou un nouveau service.</p></div><a href="/evenements" style="display:inline-block;padding:13px 22px;background:#172033;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:800">Consulter le programme</a></div></section>`,
  },
  {
    id: "site-text-editorial",
    label: "Section Titre, Texte & Liens",
    category: "Textes & Actions",
    description: "Bloc éditorial structuré avec surtitre, grand titre, paragraphes et liens.",
    content: `<section data-site-block="editorial-text" style="padding:52px 28px;background:#ffffff;color:#172033"><div style="max-width:860px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Présentation</p><h2 style="font-size:34px;margin:10px 0 18px">Une parole claire et structurée</h2><p style="margin:0 0 16px;color:#475569;line-height:1.8;font-size:16px">Rédigez ici votre histoire, votre mission associative, la présentation de votre famille ou le détail de votre savoir-faire professionnel.</p><p style="margin:0;color:#475569;line-height:1.8;font-size:16px">Vous pouvez enrichir ce texte avec des <a href="/contact" style="color:#9b563e;font-weight:700;text-decoration:underline">liens internes ou externes</a> pour guider vos visiteurs.</p></div></section>`,
  },
  {
    id: "site-buttons-links",
    label: "Rangée de boutons & liens d’action",
    category: "Textes & Actions",
    description: "Groupe de boutons principal et secondaire configurables.",
    content: `<section data-site-block="button-row" style="padding:32px 28px;text-align:center;background:#ffffff"><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px"><a href="/contact" style="display:inline-block;padding:13px 24px;background:#172033;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700">Prendre contact</a><a href="/en-savoir-plus" style="display:inline-block;padding:13px 24px;border:1px solid #172033;color:#172033;border-radius:8px;text-decoration:none;font-weight:700">Télécharger la brochure</a></div></section>`,
  },
  {
    id: "site-transformable-image",
    label: "Image redimensionnable & transformable",
    category: "Images & Médias",
    description: "Image avec rotation, inclinaison, retournement, zoom et positionnement libre.",
    content: `<figure data-site-block="transformable-image" style="margin:0;padding:36px 28px;text-align:center;background:#ffffff"><div style="max-width:880px;margin:0 auto;overflow:hidden;border-radius:18px;padding:12px;background:#f8f6f2"><img src="${DEFAULT_CARD_SVG}" alt="Image personnalisable avec transformations" data-site-transformable-image="true" style="${buildImageTransformCss(DEFAULT_IMAGE_TRANSFORMS)}" /></div><figcaption style="margin-top:12px;color:#64748b;font-size:13px">Légende de l’image — ajustable via l’outil de transformation d’images.</figcaption></figure>`,
  },
  {
    id: "site-image-gallery",
    label: "Galerie d’images (Grille photo)",
    category: "Images & Médias",
    description: "Galerie responsive multi-colonnes avec légendes pour vos albums et réalisations.",
    content: `<section data-site-block="image-gallery" style="padding:54px 28px;background:#ffffff"><div style="max-width:1120px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Album visuel</p><h2 style="font-size:32px;margin:10px 0 24px;color:#172033">Galerie de souvenirs et de réalisations</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px"><figure style="margin:0;background:#faf8f5;border-radius:14px;overflow:hidden;border:1px solid #e6dfd5"><img src="${DEFAULT_CARD_SVG}" alt="Photo galerie 1" data-site-transformable-image="true" style="display:block;width:100%;height:210px;object-fit:cover" /><figcaption style="padding:12px 14px;font-size:13px;color:#475569">Rencontre annuelle & partage</figcaption></figure><figure style="margin:0;background:#faf8f5;border-radius:14px;overflow:hidden;border:1px solid #e6dfd5"><img src="${DEFAULT_CARD_SVG}" alt="Photo galerie 2" data-site-transformable-image="true" style="display:block;width:100%;height:210px;object-fit:cover" /><figcaption style="padding:12px 14px;font-size:13px;color:#475569">Ateliers et transmission</figcaption></figure><figure style="margin:0;background:#faf8f5;border-radius:14px;overflow:hidden;border:1px solid #e6dfd5"><img src="${DEFAULT_CARD_SVG}" alt="Photo galerie 3" data-site-transformable-image="true" style="display:block;width:100%;height:210px;object-fit:cover" /><figcaption style="padding:12px 14px;font-size:13px;color:#475569">Patrimoine et initiatives</figcaption></figure></div></div></section>`,
  },
  {
    id: "site-video-showcase",
    label: "Section Vidéo intégrée",
    category: "Images & Médias",
    description: "Lecteur ou cadre vidéo responsive avec titre et explication.",
    content: `<section data-site-block="video" style="padding:54px 28px;background:#172033;color:#ffffff"><div style="max-width:980px;margin:0 auto;text-align:center"><p style="margin:0;color:#f5b98f;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Présentation vidéo</p><h2 style="font-size:32px;margin:10px 0 18px">Découvrez notre projet en images</h2><div style="position:relative;aspect-ratio:16/9;max-width:860px;margin:0 auto;border-radius:18px;overflow:hidden;background:#263653;border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center"><div style="padding:24px"><div style="width:68px;height:68px;margin:0 auto 14px;border-radius:999px;background:#f5b98f;color:#172033;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800">▶</div><p style="margin:0;color:#e6ebf2;font-size:15px">Intégrez ici une vidéo MP4, YouTube ou Vimeo de présentation.</p></div></div></div></section>`,
  },
  {
    id: "site-visual-cards-rectangular",
    label: "Cartes visuelles rectangulaires (bouton « + »)",
    category: "Cartes & Grilles",
    description: "Grille de cartes rectangulaires avec texte dessous, bouton facultatif et ajout « + ».",
    content: renderVisualCardGridHtml({
      sectionEyebrow: "Rubriques à la une",
      sectionTitle: "Nos domaines d’action",
      columns: 3,
      shape: "rectangular",
      textPlacement: "bottom",
      showButton: true,
      cards: [
        createDefaultVisualCardItem(1, {
          title: "Histoire & Patrimoine",
          subtitle: "Transmission",
          description: "Conserver la mémoire collective, les récits et les archives pour les générations futures.",
          shape: "rectangular",
          textPlacement: "bottom",
        }),
        createDefaultVisualCardItem(2, {
          title: "Rencontres & Événements",
          subtitle: "Convivialité",
          description: "Organiser les rassemblements, ateliers culturels et temps d’échange tout au long de l’année.",
          shape: "rectangular",
          textPlacement: "bottom",
        }),
        createDefaultVisualCardItem(3, {
          title: "Solidarité & Entraide",
          subtitle: "Engagement",
          description: "Accompagner les membres, mutualiser le matériel et soutenir les initiatives locales.",
          shape: "rectangular",
          textPlacement: "bottom",
        }),
      ],
    }),
  },
  {
    id: "site-visual-cards-square-top",
    label: "Cartes visuelles carrées (texte au-dessus)",
    category: "Cartes & Grilles",
    description: "Cartes carrées avec texte placé au-dessus de l’image et duplication rapide.",
    content: renderVisualCardGridHtml({
      sectionEyebrow: "Format carré",
      sectionTitle: "Présentation structurée",
      columns: 3,
      shape: "square",
      textPlacement: "top",
      showButton: true,
      cards: [
        createDefaultVisualCardItem(1, {
          title: "Pôle Culturel",
          subtitle: "Axe 01",
          description: "Expositions, conférences et valorisation des savoir-faire.",
          shape: "square",
          textPlacement: "top",
        }),
        createDefaultVisualCardItem(2, {
          title: "Pôle Jeunesse",
          subtitle: "Axe 02",
          description: "Accompagnement scolaire, mentorat et activités sportives.",
          shape: "square",
          textPlacement: "top",
        }),
        createDefaultVisualCardItem(3, {
          title: "Pôle Solidarité",
          subtitle: "Axe 03",
          description: "Aide mutuelle, prêt d’équipements et visites de courtoisie.",
          shape: "square",
          textPlacement: "top",
        }),
      ],
    }),
  },
  {
    id: "site-visual-cards-round",
    label: "Cartes visuelles rondes (portraits / équipe)",
    category: "Cartes & Grilles",
    description: "Cartes avec médaillon image rond, idéales pour présenter une équipe ou des intervenants.",
    content: renderVisualCardGridHtml({
      sectionEyebrow: "Portraits & Équipe",
      sectionTitle: "Les visages de notre collectif",
      columns: 3,
      shape: "round",
      textPlacement: "bottom",
      showButton: false,
      cards: [
        createDefaultVisualCardItem(1, {
          title: "Présidence & Coordination",
          subtitle: "Bureau",
          description: "Animation des réunions, représentation et suivi des projets annuels.",
          shape: "round",
          textPlacement: "bottom",
          showButton: false,
        }),
        createDefaultVisualCardItem(2, {
          title: "Secrétariat & Archives",
          subtitle: "Mémoire",
          description: "Comptes-rendus, communication aux membres et préservation documentaire.",
          shape: "round",
          textPlacement: "bottom",
          showButton: false,
        }),
        createDefaultVisualCardItem(3, {
          title: "Logistique & Matériel",
          subtitle: "Entraide",
          description: "Gestion des équipements collectifs et organisation des salles.",
          shape: "round",
          textPlacement: "bottom",
          showButton: false,
        }),
      ],
    }),
  },
  {
    id: "site-visual-cards-inside",
    label: "Cartes visuelles immersives (texte à l’intérieur)",
    category: "Cartes & Grilles",
    description: "Cartes avec texte superposé à l’intérieur de l’image et bouton d’action.",
    content: renderVisualCardGridHtml({
      sectionEyebrow: "Mise en scène immersive",
      sectionTitle: "Temps forts & Dossiers",
      columns: 2,
      shape: "rectangular",
      textPlacement: "inside",
      showButton: true,
      cards: [
        createDefaultVisualCardItem(1, {
          title: "Grand Rassemblement Annuel",
          subtitle: "Événement",
          description: "Une journée de rencontres intergénérationnelles, de repas partagés et d’hommages.",
          shape: "rectangular",
          textPlacement: "inside",
          buttonLabel: "Voir le programme",
        }),
        createDefaultVisualCardItem(2, {
          title: "Archives & Arbre Généalogique",
          subtitle: "Patrimoine",
          description: "Explorez l’histoire des branches familiales et contribuez aux récits.",
          shape: "rectangular",
          textPlacement: "inside",
          buttonLabel: "Explorer l’histoire",
        }),
      ],
    }),
  },
  {
    id: "site-content-grid",
    label: "Grille multi-contenus responsive",
    category: "Cartes & Grilles",
    description: "Grille 2x2 pour organiser services, valeurs ou engagements.",
    content: `<section data-site-block="content-grid" style="padding:54px 28px;background:#ffffff"><div style="max-width:1100px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Organisation</p><h2 style="font-size:32px;margin:10px 0 26px;color:#172033">Nos piliers fondamentaux</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px"><div style="padding:24px;border-radius:16px;background:#faf8f5;border:1px solid #e6dfd5"><h3 style="margin:0 0 10px;color:#172033">1. Respect & Bienveillance</h3><p style="margin:0;color:#475569;line-height:1.7">Un cadre d’écoute mutuelle où chaque membre trouve sa place et peut contribuer.</p></div><div style="padding:24px;border-radius:16px;background:#faf8f5;border:1px solid #e6dfd5"><h3 style="margin:0 0 10px;color:#172033">2. Transparence & Dialogue</h3><p style="margin:0;color:#475569;line-height:1.7">Des décisions concertées et des bilans d’activité partagés clairement.</p></div><div style="padding:24px;border-radius:16px;background:#faf8f5;border:1px solid #e6dfd5"><h3 style="margin:0 0 10px;color:#172033">3. Transmission Intergénérationnelle</h3><p style="margin:0;color:#475569;line-height:1.7">Relier les anciens et la jeunesse autour d’initiatives concrètes.</p></div><div style="padding:24px;border-radius:16px;background:#faf8f5;border:1px solid #e6dfd5"><h3 style="margin:0 0 10px;color:#172033">4. Protection de la Vie Privée</h3><p style="margin:0;color:#475569;line-height:1.7">Chaque publication personnelle ou familiale respecte le consentement explicite.</p></div></div></div></section>`,
  },
  {
    id: "site-faq-accordion",
    label: "FAQ (Questions fréquentes)",
    category: "Confiance & Contenu",
    description: "Accordéon de questions/réponses repliables.",
    content: `<section data-site-block="faq" style="padding:52px 28px;background:#ffffff"><div style="max-width:860px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Questions fréquentes</p><h2 style="font-size:32px;margin:10px 0 24px;color:#172033">Tout savoir sur notre fonctionnement</h2><div style="display:grid;gap:12px"><details style="padding:18px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#faf8f5"><summary style="cursor:pointer;font-weight:700;color:#172033">Comment rejoindre l’association ou participer aux rencontres ?</summary><p style="margin:12px 0 0;color:#475569;line-height:1.7">Il vous suffit de remplir le formulaire de contact ou de vous rapprocher d’un membre coordinateur lors de nos permanences.</p></details><details style="padding:18px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#faf8f5"><summary style="cursor:pointer;font-weight:700;color:#172033">Comment demander le prêt de matériel collectif ?</summary><p style="margin:12px 0 0;color:#475569;line-height:1.7">Consultez la rubrique Entraide & Matériel pour vérifier les disponibilités et soumettre votre demande au responsable logistique.</p></details><details style="padding:18px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#faf8f5"><summary style="cursor:pointer;font-weight:700;color:#172033">Comment sont protégées les annonces familiales ?</summary><p style="margin:12px 0 0;color:#475569;line-height:1.7">Aucune annonce personnelle n’est publiée sans le consentement validé des personnes ou familles concernées.</p></details></div></div></section>`,
  },
  {
    id: "site-numbered-steps",
    label: "Étapes numérotées (01 · 02 · 03)",
    category: "Confiance & Contenu",
    description: "Frise méthodologique en 3 étapes numérotées.",
    content: `<section data-site-block="numbered-steps" style="padding:54px 28px;background:#faf8f5"><div style="max-width:1100px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Démarche</p><h2 style="font-size:32px;margin:10px 0 26px;color:#172033">Comment nous fonctionnons en 3 étapes</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px"><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><strong style="font-size:30px;color:#9b563e">01</strong><h3 style="margin:12px 0 8px;color:#172033">Prise de contact</h3><p style="margin:0;color:#475569;line-height:1.65">Échangez avec notre équipe pour exprimer votre besoin ou votre souhait de participation.</p></article><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><strong style="font-size:30px;color:#9b563e">02</strong><h3 style="margin:12px 0 8px;color:#172033">Organisation concertée</h3><p style="margin:0;color:#475569;line-height:1.65">Nous planifions ensemble les actions, les créneaux ou la mise à disposition des ressources.</p></article><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><strong style="font-size:30px;color:#9b563e">03</strong><h3 style="margin:12px 0 8px;color:#172033">Suivi & Partage</h3><p style="margin:0;color:#475569;line-height:1.65">Chaque initiative fait l’objet d’un retour partagé avec la communauté.</p></article></div></div></section>`,
  },
  {
    id: "site-testimonials",
    label: "Témoignages & Paroles de membres",
    category: "Confiance & Contenu",
    description: "Citations et retours d’expérience.",
    content: `<section data-site-block="testimonials" style="padding:54px 28px;background:#ffffff"><div style="max-width:1080px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Témoignages</p><h2 style="font-size:32px;margin:10px 0 26px;color:#172033">Ce qu’en disent nos membres et partenaires</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px"><blockquote style="margin:0;padding:26px;background:#faf8f5;border-radius:16px;border-left:4px solid #9b563e"><p style="margin:0 0 14px;font-size:17px;line-height:1.65;color:#172033">“Ce site nous permet de garder un lien vivant entre toutes les générations, même lorsque nous habitons loin les uns des autres.”</p><footer style="font-size:13px;font-weight:700;color:#9b563e">— Membre de l’association</footer></blockquote><blockquote style="margin:0;padding:26px;background:#faf8f5;border-radius:16px;border-left:4px solid #172033"><p style="margin:0 0 14px;font-size:17px;line-height:1.65;color:#172033">“L’organisation des événements et le prêt de matériel collectif sont devenus beaucoup plus simples et transparents.”</p><footer style="font-size:13px;font-weight:700;color:#172033">— Coordinateur des rencontres</footer></blockquote></div></div></section>`,
  },
  {
    id: "site-statistics",
    label: "Statistiques & Chiffres clés",
    category: "Confiance & Contenu",
    description: "Bandeau de 4 indicateurs clés pour illustrer votre impact.",
    content: `<section data-site-block="statistics" style="padding:46px 28px;background:#172033;color:#ffffff"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;text-align:center"><div><strong style="display:block;font-size:34px;color:#f5b98f">120+</strong><span style="font-size:13px;color:#cbd2dc">Membres actifs</span></div><div><strong style="display:block;font-size:34px;color:#f5b98f">18</strong><span style="font-size:13px;color:#cbd2dc">Rencontres annuelles</span></div><div><strong style="display:block;font-size:34px;color:#f5b98f">35 ans</strong><span style="font-size:13px;color:#cbd2dc">D’histoire & transmission</span></div><div><strong style="display:block;font-size:34px;color:#f5b98f">100%</strong><span style="font-size:13px;color:#cbd2dc">Bénévolat & entraide</span></div></div></section>`,
  },
  {
    id: "site-cta-section",
    label: "Appel à l’action (CTA)",
    category: "Confiance & Contenu",
    description: "Section d’engagement incitant à prendre contact ou participer.",
    content: `<section data-site-block="cta" style="padding:56px 28px;background:linear-gradient(135deg,#9b563e 0%,#7c422e 100%);color:#ffffff;text-align:center"><div style="max-width:760px;margin:0 auto"><h2 style="font-size:34px;margin:0 0 12px">Envie de participer à nos prochaines actions ?</h2><p style="margin:0 0 24px;color:#f9ebe4;line-height:1.7;font-size:16px">Rejoignez notre dynamique collective, proposez une idée ou inscrivez-vous au prochain événement.</p><a href="/contact" style="display:inline-block;padding:14px 26px;background:#ffffff;color:#172033;border-radius:8px;text-decoration:none;font-weight:800">Nous rejoindre maintenant</a></div></section>`,
  },
  {
    id: "site-contact-form",
    label: "Formulaire de contact complet",
    category: "Contact & Décoration",
    description: "Formulaire de prise de contact avec nom, e-mail, sujet, message et consentement.",
    content: `<section data-site-block="contact-form" style="padding:56px 28px;background:#faf8f5;color:#172033"><div style="max-width:760px;margin:0 auto;background:#ffffff;padding:34px;border-radius:18px;border:1px solid #e6dfd5"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">Contact</p><h2 style="font-size:30px;margin:8px 0 18px">Envoyez-nous un message</h2><form style="display:grid;gap:16px" onsubmit="return false;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><label style="display:grid;gap:6px;font-size:13px;font-weight:700">Nom complet<input type="text" placeholder="Votre nom" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px" /></label><label style="display:grid;gap:6px;font-size:13px;font-weight:700">Adresse e-mail<input type="email" placeholder="vous@exemple.org" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px" /></label></div><label style="display:grid;gap:6px;font-size:13px;font-weight:700">Objet<input type="text" placeholder="Renseignement, participation, événement…" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px" /></label><label style="display:grid;gap:6px;font-size:13px;font-weight:700">Message<textarea rows="4" placeholder="Écrivez votre message ici…" style="padding:12px;border:1px solid #cbd5e1;border-radius:8px"></textarea></label><button type="button" style="justify-self:start;padding:12px 22px;background:#172033;color:#ffffff;border:0;border-radius:8px;font-weight:800;cursor:pointer">Envoyer le message</button></form></div></section>`,
  },
  {
    id: "site-separator-wave",
    label: "Séparateur & forme décorative",
    category: "Contact & Décoration",
    description: "Séparateur visuel élégant entre deux sections de page.",
    content: `<div data-site-block="separator" style="padding:24px 28px;background:#ffffff;text-align:center"><div style="max-width:420px;margin:0 auto;display:flex;align-items:center;gap:14px"><span style="flex:1;height:1px;background:#d8d0c7"></span><span style="display:inline-block;width:10px;height:10px;transform:rotate(45deg);background:#9b563e"></span><span style="flex:1;height:1px;background:#d8d0c7"></span></div></div>`,
  },
] as const;

// ---------------------------------------------------------------------------
// 4. Modules Fonctionnels Réutilisables (8 Modules sans e-commerce)
// ---------------------------------------------------------------------------

export interface IndependentBuilderModule {
  id: string;
  label: string;
  category: "Vie Associative & Familiale" | "Interactions & Médias" | "Information & Services";
  description: string;
  html: string;
}

export const INDEPENDENT_BUILDER_MODULES: ReadonlyArray<IndependentBuilderModule> = [
  {
    id: "module-events-calendar",
    label: "Module — Événements & Calendrier",
    category: "Vie Associative & Familiale",
    description: "Calendrier structuré des rencontres à venir, en cours et passées avec lieux et responsables.",
    html: `<section data-site-module="events-calendar" style="padding:52px 28px;background:#f7f4ef;color:#172033"><div style="max-width:1060px;margin:0 auto"><p style="margin:0;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Agenda & Rencontres</p><h2 style="font-size:32px;margin:10px 0 18px">Calendrier des événements</h2><div style="display:grid;gap:14px"><article style="display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:18px 22px;background:#ffffff;border-radius:14px;border-left:5px solid #9b563e"><div><span style="font-size:12px;font-weight:800;color:#9b563e;text-transform:uppercase">Samedi 14 Juin · 10h00</span><h3 style="margin:6px 0">Assemblée annuelle & repas fraternel</h3><p style="margin:0;color:#5b6470;font-size:14px">Salle communale · Accueil des familles, bilan des projets et ateliers jeunesse.</p></div><a href="/contact" style="padding:10px 16px;background:#172033;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Confirmer ma présence</a></article><article style="display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:18px 22px;background:#ffffff;border-radius:14px;border-left:5px solid #263653"><div><span style="font-size:12px;font-weight:800;color:#263653;text-transform:uppercase">Dimanche 21 Septembre · 14h00</span><h3 style="margin:6px 0">Journée du patrimoine & mémoire familiale</h3><p style="margin:0;color:#5b6470;font-size:14px">Exposition de photographies anciennes, récits et arbre généalogique.</p></div><a href="/contact" style="padding:10px 16px;border:1px solid #172033;color:#172033;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Proposer un document</a></article></div></div></section>`,
  },
  {
    id: "module-members-roles",
    label: "Module — Membres & Rôles",
    category: "Vie Associative & Familiale",
    description: "Présentation claire des rôles (Présidence, Secrétariat, Trésorerie, Coordination, Matériel).",
    html: `<section data-site-module="members-roles" style="padding:52px 28px;background:#ffffff;color:#172033"><div style="max-width:1060px;margin:0 auto"><p style="margin:0;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Organisation collective</p><h2 style="font-size:32px;margin:10px 0 22px">Membres et responsabilités</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><article style="padding:20px;background:#faf8f5;border:1px solid #e5ddd2;border-radius:14px"><strong style="color:#9b563e;font-size:13px;text-transform:uppercase">Présidence</strong><h3 style="margin:8px 0;font-size:19px">Coordination générale</h3><p style="margin:0;color:#5b6470;font-size:14px;line-height:1.6">Animation du collectif, lien entre les branches familiales et suivi des décisions.</p></article><article style="padding:20px;background:#faf8f5;border:1px solid #e5ddd2;border-radius:14px"><strong style="color:#9b563e;font-size:13px;text-transform:uppercase">Secrétariat</strong><h3 style="margin:8px 0;font-size:19px">Comptes-rendus & Archives</h3><p style="margin:0;color:#5b6470;font-size:14px;line-height:1.6">Convocations, procès-verbaux et conservation des documents historiques.</p></article><article style="padding:20px;background:#faf8f5;border:1px solid #e5ddd2;border-radius:14px"><strong style="color:#9b563e;font-size:13px;text-transform:uppercase">Intendance</strong><h3 style="margin:8px 0;font-size:19px">Matériel & Entraide</h3><p style="margin:0;color:#5b6470;font-size:14px;line-height:1.6">Inventaire des équipements partagés, réservations et remise en état.</p></article></div></div></section>`,
  },
  {
    id: "module-news-consent",
    label: "Module — Actualités & Annonces avec consentement",
    category: "Vie Associative & Familiale",
    description: "Diffusion de nouvelles (naissance, mariage, hommage, vie associative) avec contrôle de visibilité et consentement.",
    html: `<section data-site-module="news-consent" style="padding:52px 28px;background:#faf8f5;color:#172033"><div style="max-width:960px;margin:0 auto"><p style="margin:0;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Actualités & Vie des familles</p><h2 style="font-size:32px;margin:10px 0 18px">Carnet d’annonces protégées</h2><p style="margin:0 0 22px;color:#5b6470;line-height:1.7">Chaque annonce publiée dans cet espace a fait l’objet d’une confirmation explicite de consentement par les personnes concernées.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px"><article style="padding:22px;background:#ffffff;border-radius:14px;border:1px solid #e5ddd2"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e6f4ea;color:#137333;font-size:11px;font-weight:800">Consentement vérifié · Heureux événement</span><h3 style="margin:12px 0 8px">Bienvenue aux nouveaux-nés de l’année</h3><p style="margin:0;color:#5b6470;font-size:14px;line-height:1.6">Toute l’association adresse ses vœux de bonheur et de santé aux parents et grands-parents.</p></article><article style="padding:22px;background:#ffffff;border-radius:14px;border:1px solid #e5ddd2"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#fef7e0;color:#b06000;font-size:11px;font-weight:800">Consentement vérifié · Hommage & Mémoire</span><h3 style="margin:12px 0 8px">Espace de souvenir et de solidarité</h3><p style="margin:0;color:#5b6470;font-size:14px;line-height:1.6">Pensées fraternelles et recueil de témoignages en mémoire de nos aînés.</p></article></div></div></section>`,
  },
  {
    id: "module-directory-equipment",
    label: "Module — Annuaire & Prêt de matériel",
    category: "Vie Associative & Familiale",
    description: "Répertoire des équipements collectifs disponibles au prêt entre membres (tables, chaises, vaisselle, tentes).",
    html: `<section data-site-module="directory-equipment" style="padding:52px 28px;background:#ffffff;color:#172033"><div style="max-width:1060px;margin:0 auto"><p style="margin:0;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Logistique solidaire</p><h2 style="font-size:32px;margin:10px 0 22px">Inventaire du matériel associatif disponible au prêt</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><article style="padding:20px;border:1px solid #e5ddd2;border-radius:14px"><strong>Tables & Chaises pliantes</strong><p style="margin:8px 0 14px;color:#5b6470;font-size:14px">Lot complet pour 120 convives, réservable pour les réceptions familiales.</p><a href="/contact" style="display:inline-block;padding:8px 14px;background:#172033;color:#ffffff;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700">Réserver un créneau</a></article><article style="padding:20px;border:1px solid #e5ddd2;border-radius:14px"><strong>Service de vaisselle & marmites</strong><p style="margin:8px 0 14px;color:#5b6470;font-size:14px">Grandes marmites, couscoussiers, thermos et plats de service collectifs.</p><a href="/contact" style="display:inline-block;padding:8px 14px;background:#172033;color:#ffffff;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700">Réserver un créneau</a></article><article style="padding:20px;border:1px solid #e5ddd2;border-radius:14px"><strong>Chapiteau & Sonorisation</strong><p style="margin:8px 0 14px;color:#5b6470;font-size:14px">Barnum extérieur, microphones et enceintes pour les assemblées.</p><a href="/contact" style="display:inline-block;padding:8px 14px;background:#172033;color:#ffffff;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700">Réserver un créneau</a></article></div></div></section>`,
  },
  {
    id: "module-interactive-form",
    label: "Module — Formulaire d’adhésion / participation",
    category: "Interactions & Médias",
    description: "Formulaire structuré permettant aux visiteurs ou membres de proposer leur aide ou de s’inscrire.",
    html: `<section data-site-module="interactive-form" style="padding:52px 28px;background:#f7f4ef;color:#172033"><div style="max-width:780px;margin:0 auto;background:#ffffff;padding:32px;border-radius:18px;border:1px solid #e5ddd2"><h2 style="margin:0 0 10px;font-size:28px">Formulaire de participation</h2><p style="margin:0 0 20px;color:#5b6470;font-size:14px">Indiquez vos coordonnées et le pôle auquel vous souhaitez contribuer.</p><form style="display:grid;gap:14px" onsubmit="return false;"><input type="text" placeholder="Prénom et Nom" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px" /><input type="email" placeholder="Adresse e-mail" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px" /><select aria-label="Pôle souhaité" style="min-height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px"><option>Organisation des rencontres</option><option>Archives & Histoire familiale</option><option>Entraide & Logistique matériel</option><option>Accompagnement jeunesse</option></select><textarea rows="3" placeholder="Votre message ou proposition…" style="padding:12px;border:1px solid #cbd5e1;border-radius:8px"></textarea><button type="button" style="justify-self:start;padding:12px 20px;background:#9b563e;color:#ffffff;border:0;border-radius:8px;font-weight:800">Transmettre ma participation</button></form></div></section>`,
  },
  {
    id: "module-photo-gallery",
    label: "Module — Galerie thématique commentée",
    category: "Interactions & Médias",
    description: "Exposition visuelle avec filtres thématiques et légendes détaillées.",
    html: `<section data-site-module="photo-gallery" style="padding:52px 28px;background:#ffffff"><div style="max-width:1100px;margin:0 auto"><h2 style="margin:0 0 18px;font-size:30px;color:#172033">Archives photographiques & Temps forts</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><img src="${DEFAULT_CARD_SVG}" alt="Archive 1" style="width:100%;height:220px;object-fit:cover;border-radius:14px" /><img src="${DEFAULT_CARD_SVG}" alt="Archive 2" style="width:100%;height:220px;object-fit:cover;border-radius:14px" /><img src="${DEFAULT_CARD_SVG}" alt="Archive 3" style="width:100%;height:220px;object-fit:cover;border-radius:14px" /></div></div></section>`,
  },
  {
    id: "module-testimonials-wall",
    label: "Module — Livre d’or & Témoignages",
    category: "Interactions & Médias",
    description: "Recueil de messages et témoignages des membres et visiteurs.",
    html: `<section data-site-module="testimonials-wall" style="padding:52px 28px;background:#faf8f5"><div style="max-width:1040px;margin:0 auto"><h2 style="margin:0 0 20px;font-size:30px;color:#172033">Paroles & Récits transmis</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><div style="padding:20px;background:#ffffff;border-radius:14px;border:1px solid #e5ddd2"><p style="margin:0 0 10px;color:#172033;font-style:italic">“Un point de repère précieux pour nos enfants.”</p><strong style="font-size:13px;color:#9b563e">— Famille Ath Vahloul</strong></div><div style="padding:20px;background:#ffffff;border-radius:14px;border:1px solid #e5ddd2"><p style="margin:0 0 10px;color:#172033;font-style:italic">“Toujours présents dans les moments de joie comme d’entraide.”</p><strong style="font-size:13px;color:#9b563e">— Bureau de l’association</strong></div><div style="padding:20px;background:#ffffff;border-radius:14px;border:1px solid #e5ddd2"><p style="margin:0 0 10px;color:#172033;font-style:italic">“Une mémoire vivante et respectueuse de chacun.”</p><strong style="font-size:13px;color:#9b563e">— Commission Histoire</strong></div></div></div></section>`,
  },
  {
    id: "module-contact-location",
    label: "Module — Coordonnées, Permanences & Accès",
    category: "Information & Services",
    description: "Bloc récapitulatif des horaires de permanence, lieux de réunion et contacts directs.",
    html: `<section data-site-module="contact-location" style="padding:52px 28px;background:#172033;color:#ffffff"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px"><div style="padding:22px;background:rgba(255,255,255,.07);border-radius:14px"><h3 style="margin:0 0 8px;color:#f5b98f">Siège & Réunions</h3><p style="margin:0;color:#e6ebf2;font-size:14px;line-height:1.6">Maison des Associations · Salle polyvalente sur convocation.</p></div><div style="padding:22px;background:rgba(255,255,255,.07);border-radius:14px"><h3 style="margin:0 0 8px;color:#f5b98f">Permanence téléphonique</h3><p style="margin:0;color:#e6ebf2;font-size:14px;line-height:1.6">Chaque samedi de 10h00 à 12h30 auprès du secrétariat.</p></div><div style="padding:22px;background:rgba(255,255,255,.07);border-radius:14px"><h3 style="margin:0 0 8px;color:#f5b98f">Courriel officiel</h3><p style="margin:0;color:#e6ebf2;font-size:14px;line-height:1.6">contact@association-ath-vahloul.org</p></div></div></section>`,
  },
] as const;

// ---------------------------------------------------------------------------
// 5. Socles de Pages (9 Structures de page complètes prêtes à personnaliser)
// ---------------------------------------------------------------------------

export interface IndependentPageSocle {
  id: string;
  label: string;
  defaultSlug: string;
  siteType: IndependentSiteType;
  description: string;
  html: string;
}

export const INDEPENDENT_PAGE_SOCLES: ReadonlyArray<IndependentPageSocle> = [
  {
    id: "socle-accueil",
    label: "Socle — Page d’accueil",
    defaultSlug: "/",
    siteType: "vitrine",
    description: "Structure complète : Header, Hero, 3 cartes visuelles, chiffres clés, appel à l’action et Footer.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[3].content,
      INDEPENDENT_BUILDER_BLOCKS[9].content,
      INDEPENDENT_BUILDER_BLOCKS[17].content,
      INDEPENDENT_BUILDER_BLOCKS[18].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-association",
    label: "Socle — Page association",
    defaultSlug: "/association",
    siteType: "association",
    description: "Présentation de la mission associative, des pôles d’action, de l’équipe et formulaire de participation.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[1].content,
      INDEPENDENT_BUILDER_BLOCKS[4].content,
      INDEPENDENT_BUILDER_MODULES[1].html,
      INDEPENDENT_BUILDER_MODULES[4].html,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-famille",
    label: "Socle — Page famille",
    defaultSlug: "/notre-famille",
    siteType: "familial",
    description: "Histoire familiale, branches, membres & rôles, carnet d’annonces avec consentement et entraide.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[1].content,
      INDEPENDENT_BUILDER_BLOCKS[5].content,
      INDEPENDENT_BUILDER_MODULES[1].html,
      INDEPENDENT_BUILDER_MODULES[2].html,
      INDEPENDENT_BUILDER_MODULES[3].html,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-entreprise",
    label: "Socle — Page entreprise",
    defaultSlug: "/entreprise",
    siteType: "professionnel",
    description: "Présentation corporate, valeurs, chiffres clés, témoignages et coordonnées.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[3].content,
      INDEPENDENT_BUILDER_BLOCKS[13].content,
      INDEPENDENT_BUILDER_BLOCKS[17].content,
      INDEPENDENT_BUILDER_BLOCKS[16].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-services",
    label: "Socle — Page services",
    defaultSlug: "/services",
    siteType: "services",
    description: "Détail des prestations en cartes visuelles, méthode en 3 étapes numérotées, FAQ et prise de contact.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[9].content,
      INDEPENDENT_BUILDER_BLOCKS[15].content,
      INDEPENDENT_BUILDER_BLOCKS[14].content,
      INDEPENDENT_BUILDER_BLOCKS[19].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-contact",
    label: "Socle — Page contact",
    defaultSlug: "/contact",
    siteType: "vitrine",
    description: "Coordonnées directes, horaires de permanence, formulaire de message et FAQ.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_MODULES[7].html,
      INDEPENDENT_BUILDER_BLOCKS[19].content,
      INDEPENDENT_BUILDER_BLOCKS[14].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-evenements",
    label: "Socle — Page événements",
    defaultSlug: "/evenements",
    siteType: "evenementiel",
    description: "Bannière d’annonce, calendrier des rencontres, galerie photo et inscription.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[4].content,
      INDEPENDENT_BUILDER_MODULES[0].html,
      INDEPENDENT_BUILDER_BLOCKS[7].content,
      INDEPENDENT_BUILDER_MODULES[4].html,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-equipe",
    label: "Socle — Page équipe",
    defaultSlug: "/equipe",
    siteType: "institutionnel",
    description: "Cartes portraits rondes, répartition des responsabilités et valeurs collectives.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[11].content,
      INDEPENDENT_BUILDER_MODULES[1].html,
      INDEPENDENT_BUILDER_BLOCKS[13].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
  {
    id: "socle-actualites",
    label: "Socle — Page actualités",
    defaultSlug: "/actualites",
    siteType: "association",
    description: "Carnet d’actualités, cartes immersives des dossiers et galerie média.",
    html: [
      INDEPENDENT_BUILDER_BLOCKS[0].content,
      INDEPENDENT_BUILDER_BLOCKS[12].content,
      INDEPENDENT_BUILDER_MODULES[2].html,
      INDEPENDENT_BUILDER_BLOCKS[7].content,
      INDEPENDENT_BUILDER_BLOCKS[2].content,
    ].join(""),
  },
] as const;

// ---------------------------------------------------------------------------
// 6. Structure de Projet Multi-Pages, Menus/Sous-Menus & Modèles Complets
// ---------------------------------------------------------------------------

export interface IndependentSiteMenuItem {
  id: string;
  label: string;
  href: string;
  pageId?: string;
  children?: Array<{
    id: string;
    label: string;
    href: string;
    pageId?: string;
  }>;
}

export interface IndependentSitePage {
  id: string;
  title: string;
  slug: string;
  parentPageId: string | null;
  showInMenu: boolean;
  menuOrder: number;
  visibility: "public" | "members" | "private";
  seoTitle: string;
  seoDescription: string;
  html: string;
  css: string;
  gjsProjectData?: Record<string, unknown>;
}

export interface IndependentSiteReusableBlock {
  id: string;
  name: string;
  category: string;
  html: string;
  createdAt: string;
}

export interface IndependentSiteMediaItem {
  id: string;
  label: string;
  altText: string;
  url: string;
  mimeType: string;
  transforms: IndependentImageTransforms;
  createdAt: string;
}

export interface IndependentSiteThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface IndependentSiteTemplate {
  id: string;
  name: string;
  siteType: IndependentSiteType;
  tagline: string;
  description: string;
  theme: IndependentSiteThemeConfig;
  navigation: IndependentSiteMenuItem[];
  pages: IndependentSitePage[];
}

export const ATH_VAHLOUL_DEMO_TEMPLATE_ID = "modele-association-ath-vahloul";

export const INDEPENDENT_SITE_TEMPLATES: ReadonlyArray<IndependentSiteTemplate> = [
  {
    id: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
    name: "Association familiale ATH VAHLOUL",
    siteType: "familial",
    tagline: "Notre famille, notre mémoire, notre entraide.",
    description:
      "Site associatif et familial complet multi-pages (Accueil, Notre Famille & Histoire, Événements & Rencontres, Entraide & Matériel, Annonces & Mémoire, Contact) fonctionnant 100 % sans boutique.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Inter, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-home", label: "Accueil", href: "/", pageId: "page-accueil" },
      {
        id: "nav-famille",
        label: "Notre Famille",
        href: "/notre-famille",
        pageId: "page-famille",
        children: [
          { id: "nav-membres", label: "Membres & Rôles", href: "/notre-famille#membres", pageId: "page-famille" },
          { id: "nav-annonces", label: "Annonces & Mémoire", href: "/annonces", pageId: "page-annonces" },
        ],
      },
      {
        id: "nav-vie",
        label: "Vie Associative",
        href: "/evenements",
        pageId: "page-evenements",
        children: [
          { id: "nav-calendrier", label: "Calendrier des événements", href: "/evenements", pageId: "page-evenements" },
          { id: "nav-entraide", label: "Entraide & Matériel", href: "/entraide", pageId: "page-entraide" },
        ],
      },
      { id: "nav-contact", label: "Contact", href: "/contact", pageId: "page-contact" },
    ],
    pages: [
      {
        id: "page-accueil",
        title: "Accueil — Association familiale ATH VAHLOUL",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Association familiale ATH VAHLOUL | Mémoire, Rencontres & Entraide",
        seoDescription:
          "Site officiel de l’Association familiale ATH VAHLOUL : histoire familiale, calendrier des rencontres, prêt de matériel collectif et solidarité intergénérationnelle.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; background: #faf8f5; }",
        html: [
          `<header data-site-block="header-ath-vahloul" style="padding:18px 28px;background:#ffffff;color:#172033;border-bottom:1px solid #e8e2d9"><div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-weight:800;font-size:20px;letter-spacing:.02em">Association familiale ATH VAHLOUL</a><nav aria-label="Menu principal ATH VAHLOUL" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-size:14px;font-weight:700">Accueil</a><a href="/notre-famille" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Notre Famille</a><a href="/evenements" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Événements</a><a href="/entraide" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Entraide & Matériel</a><a href="/annonces" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Annonces & Mémoire</a><a href="/contact" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/contact" style="display:inline-block;padding:10px 18px;background:#9b563e;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Participer</a></div></header>`,
          `<section data-site-block="hero-ath-vahloul" style="padding:84px 28px;background:linear-gradient(135deg,#172033 0%,#263653 58%,#52657b 100%);color:#ffffff"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.2fr .8fr;gap:38px;align-items:center"><div><p style="margin:0;color:#f5b98f;text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:800">Association familiale ATH VAHLOUL</p><h1 style="font-size:clamp(38px,6vw,64px);line-height:1.05;margin:14px 0 18px">Notre famille, notre mémoire, notre entraide.</h1><p style="max-width:640px;margin:0 0 26px;color:#e6ebf2;line-height:1.75;font-size:17px">Un espace indépendant dédié aux membres et amis de la famille ATH VAHLOUL pour transmettre notre histoire, organiser nos rassemblements et mutualiser nos ressources d’entraide.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><a href="/notre-famille" style="padding:13px 22px;background:#ffffff;color:#172033;border-radius:8px;text-decoration:none;font-weight:800">Découvrir la famille</a><a href="/evenements" style="padding:12px 20px;border:1px solid rgba(255,255,255,.7);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700">Calendrier des rencontres</a></div></div><div style="padding:20px;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)"><img src="${DEFAULT_CARD_SVG}" alt="Rassemblement Association familiale ATH VAHLOUL" data-site-transformable-image="true" style="display:block;width:100%;height:250px;object-fit:cover;border-radius:14px" /></div></div></section>`,
          renderVisualCardGridHtml({
            sectionEyebrow: "Vie de l’association",
            sectionTitle: "Les trois piliers d’ATH VAHLOUL",
            columns: 3,
            shape: "rectangular",
            textPlacement: "bottom",
            showButton: true,
            cards: [
              createDefaultVisualCardItem(1, {
                title: "Histoire & Généalogie",
                subtitle: "Mémoire",
                description: "Préserver les récits de nos anciens, les photographies d’archives et les liens entre toutes les branches.",
                buttonLabel: "Lire notre histoire",
                buttonHref: "/notre-famille",
              }),
              createDefaultVisualCardItem(2, {
                title: "Rencontres & Assemblées",
                subtitle: "Calendrier",
                description: "Préparer nos fêtes familiales, réunions annuelles et journées culturelles intergénérationnelles.",
                buttonLabel: "Voir l’agenda",
                buttonHref: "/evenements",
              }),
              createDefaultVisualCardItem(3, {
                title: "Entraide & Matériel partagé",
                subtitle: "Solidarité",
                description: "Mettre à disposition tables, chaises, vaisselle et équipements pour les événements des membres.",
                buttonLabel: "Consulter l’inventaire",
                buttonHref: "/entraide",
              }),
            ],
          }),
          INDEPENDENT_BUILDER_BLOCKS[17].content,
          INDEPENDENT_BUILDER_MODULES[0].html,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-famille",
        title: "Notre Famille & Rôles",
        slug: "/notre-famille",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Notre Famille & Organisation | Association familiale ATH VAHLOUL",
        seoDescription: "Histoire, valeurs et organisation des rôles au sein de l’Association familiale ATH VAHLOUL.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_BLOCKS[5].content,
          INDEPENDENT_BUILDER_MODULES[1].html,
          INDEPENDENT_BUILDER_BLOCKS[11].content,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-evenements",
        title: "Événements & Rencontres",
        slug: "/evenements",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Calendrier des événements | Association familiale ATH VAHLOUL",
        seoDescription: "Agenda des rencontres, assemblées et fêtes familiales d’ATH VAHLOUL.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_BLOCKS[4].content,
          INDEPENDENT_BUILDER_MODULES[0].html,
          INDEPENDENT_BUILDER_BLOCKS[7].content,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-entraide",
        title: "Entraide & Matériel",
        slug: "/entraide",
        parentPageId: "page-evenements",
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Entraide & Prêt de matériel | Association familiale ATH VAHLOUL",
        seoDescription: "Inventaire et réservation du matériel collectif de l’association familiale ATH VAHLOUL.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_MODULES[3].html,
          INDEPENDENT_BUILDER_BLOCKS[15].content,
          INDEPENDENT_BUILDER_MODULES[4].html,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-annonces",
        title: "Annonces & Mémoire",
        slug: "/annonces",
        parentPageId: "page-famille",
        showInMenu: true,
        menuOrder: 5,
        visibility: "members",
        seoTitle: "Carnet d’annonces & Mémoire | Association familiale ATH VAHLOUL",
        seoDescription: "Annonces familiales protégées par consentement explicite et espace mémoire ATH VAHLOUL.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_MODULES[2].html,
          INDEPENDENT_BUILDER_MODULES[6].html,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-contact",
        title: "Contact & Permanences",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 6,
        visibility: "public",
        seoTitle: "Contact | Association familiale ATH VAHLOUL",
        seoDescription: "Contacter le bureau et les coordinateurs de l’Association familiale ATH VAHLOUL.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_MODULES[7].html,
          INDEPENDENT_BUILDER_BLOCKS[19].content,
          INDEPENDENT_BUILDER_BLOCKS[14].content,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
    ],
  },
  {
    id: "modele-vitrine-services-pro",
    name: "Atelier & Conseil Professionnel",
    siteType: "services",
    tagline: "Clarté, expertise et accompagnement sur mesure.",
    description:
      "Site vitrine professionnel multi-pages (Accueil, Services, Méthode & Réalisations, Contact) conçu pour les indépendants, cabinets et artisans.",
    theme: {
      primaryColor: "#0f172a",
      accentColor: "#0d9488",
      backgroundColor: "#f8fafc",
      headingFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-pro-home", label: "Accueil", href: "/", pageId: "pro-accueil" },
      { id: "nav-pro-services", label: "Nos Services", href: "/services", pageId: "pro-services" },
      { id: "nav-pro-contact", label: "Contact", href: "/contact", pageId: "pro-contact" },
    ],
    pages: [
      {
        id: "pro-accueil",
        title: "Accueil",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Atelier & Conseil Professionnel | Accueil",
        seoDescription: "Présentation de nos services professionnels et accompagnement sur mesure.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "pro-services",
        title: "Nos Services",
        slug: "/services",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Nos Prestations & Méthode",
        seoDescription: "Découvrez nos prestations détaillées et notre méthode en 3 étapes.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[4].html,
      },
      {
        id: "pro-contact",
        title: "Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Contactez notre équipe",
        seoDescription: "Prenez rendez-vous ou posez vos questions via notre formulaire.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-rencontre-evenementiel",
    name: "Forum & Rencontre Culturelle",
    siteType: "evenementiel",
    tagline: "Un événement fédérateur ouvert à tous.",
    description:
      "Site événementiel et institutionnel multi-pages avec programme détaillé, portraits des intervenants, galerie et formulaire d’inscription.",
    theme: {
      primaryColor: "#1e1b4b",
      accentColor: "#d97706",
      backgroundColor: "#fffbeb",
      headingFont: "Georgia, serif",
      bodyFont: "Inter, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-evt-home", label: "Accueil", href: "/", pageId: "evt-accueil" },
      { id: "nav-evt-prog", label: "Programme", href: "/evenements", pageId: "evt-programme" },
      { id: "nav-evt-equipe", label: "Intervenants", href: "/equipe", pageId: "evt-intervenants" },
      { id: "nav-evt-contact", label: "Inscription", href: "/contact", pageId: "evt-contact" },
    ],
    pages: [
      {
        id: "evt-accueil",
        title: "Accueil de l’événement",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Forum & Rencontre Culturelle | Accueil",
        seoDescription: "Programme, dates et inscriptions à notre grand forum annuel.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[6].html,
      },
      {
        id: "evt-programme",
        title: "Programme détaillé",
        slug: "/evenements",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Programme des conférences et ateliers",
        seoDescription: "Horaires et salles des tables rondes et ateliers.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[6].html,
      },
      {
        id: "evt-intervenants",
        title: "Intervenants & Équipe",
        slug: "/equipe",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Les intervenants invités",
        seoDescription: "Portraits et biographies des intervenants.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[7].html,
      },
      {
        id: "evt-contact",
        title: "Infos pratiques & Inscription",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Accès & Inscription",
        seoDescription: "Formulaire de participation et plan d’accès.",
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// 7. Helpers de Création de Projet, Domaines Personnalisés & Gardes de Sécurité
// ---------------------------------------------------------------------------

export function slugifyIndependentSite(raw: string): string {
  const cleaned = (raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return cleaned || "site-independant";
}

export function normalizeIndependentPageSlug(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed || trimmed === "/") return "/";
  const slug = slugifyIndependentSite(trimmed.replace(/^\/+/, ""));
  return `/${slug}`;
}

export function buildNavigationFromPages(pages: ReadonlyArray<IndependentSitePage>): IndependentSiteMenuItem[] {
  const visible = [...pages]
    .filter((p) => p.showInMenu)
    .sort((a, b) => a.menuOrder - b.menuOrder);

  const roots = visible.filter((p) => !p.parentPageId);
  return roots.map((root) => {
    const children = visible
      .filter((child) => child.parentPageId === root.id)
      .map((child) => ({
        id: `menu-${child.id}`,
        label: child.title,
        href: child.slug,
        pageId: child.id,
      }));
    return {
      id: `menu-${root.id}`,
      label: root.title,
      href: root.slug,
      pageId: root.id,
      ...(children.length > 0 ? { children } : {}),
    };
  });
}

const RESERVED_PLATFORM_DOMAIN_SUFFIXES = [
  "mazigho.ch",
  "mazigho.com",
  "localhost",
  "run.app",
  "vercel.app",
];

export function validateIndependentCustomDomain(rawHostname: string): {
  valid: boolean;
  normalizedHostname: string;
  error?: string;
} {
  const normalized = (rawHostname || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

  if (!normalized || normalized.length < 4 || normalized.length > 253) {
    return {
      valid: false,
      normalizedHostname: normalized,
      error: "Veuillez saisir un nom de domaine valide (ex. association-ath-vahloul.org).",
    };
  }

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
  if (!domainRegex.test(normalized)) {
    return {
      valid: false,
      normalizedHostname: normalized,
      error: "Format de nom de domaine invalide.",
    };
  }

  for (const suffix of RESERVED_PLATFORM_DOMAIN_SUFFIXES) {
    if (normalized === suffix || normalized.endsWith(`.${suffix}`)) {
      return {
        valid: false,
        normalizedHostname: normalized,
        error: `Le domaine ${normalized} appartient à l’infrastructure réservée et ne peut pas être utilisé comme domaine personnalisé indépendant.`,
      };
    }
  }

  return {
    valid: true,
    normalizedHostname: normalized,
  };
}

const FORBIDDEN_SECRET_KEY_NAMES =
  /^(?:stripeSecretKey|stripeWebhookSecret|paypalClientSecret|paypalWebhookId|apiSecret|privateKey|secretKey|clientSecret|accessToken|refreshToken|encryptionKey|sentryAuthToken|byokSecret)$/i;

const FORBIDDEN_SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  new RegExp(["sk", "(?:live|test)", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp(["rk", "(?:live|test)", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp(["whsec", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp("xkeysib-[A-Za-z0-9-]{20,}"),
  new RegExp(["(?:ghp|github_pat)", "[A-Za-z0-9_]{20,}"].join("_")),
  new RegExp("-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
];

/**
 * Rejette tout secret, clé privée, token ou clé de paiement dans un projet de site indépendant.
 */
export function assertNoSecretsInIndependentSite(payload: unknown): void {
  const visited = new Set<unknown>();

  function walk(node: unknown): void {
    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
          if (pattern.test(node)) {
            throw new Error("INDEPENDENT_SITE_SECRET_DETECTED");
          }
        }
      }
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_SECRET_KEY_NAMES.test(k) && typeof v === "string" && v.trim().length > 0) {
        throw new Error("INDEPENDENT_SITE_SECRET_DETECTED");
      }
      walk(v);
    }
  }

  walk(payload);
}

const FORBIDDEN_ECOMMERCE_KEYS = new Set<string>([
  "storeId",
  "attachedStoreId",
  "cartItems",
  "checkoutSessionId",
  "paymentIntentId",
  "stripeAccountId",
  "productVariants",
  "stockQuantity",
]);

/**
 * Garantit que le Constructeur de Sites Internet Indépendant ne dépend d’aucune boutique,
 * catalogue, panier, checkout, stock ou commande.
 */
export function assertZeroEcommerceInIndependentSite(payload: unknown): void {
  const visited = new Set<unknown>();

  function walk(node: unknown): void {
    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        if (node.includes('data-mazigho-dynamic="catalogue"')) {
          throw new Error("INDEPENDENT_SITE_ECOMMERCE_DEPENDENCY_FORBIDDEN");
        }
      }
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_ECOMMERCE_KEYS.has(k) && v !== null && v !== undefined) {
        throw new Error("INDEPENDENT_SITE_ECOMMERCE_DEPENDENCY_FORBIDDEN");
      }
      walk(v);
    }
  }

  walk(payload);
}
