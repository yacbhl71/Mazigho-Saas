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

export type ResponsiveDevicePresetId =
  | "narrow-phone"
  | "wide-phone"
  | "tablet-portrait"
  | "tablet-landscape"
  | "desktop";

export interface ResponsiveDevicePreset {
  id: ResponsiveDevicePresetId;
  label: string;
  shortLabel: string;
  widthCss: string;
  maxWidthPx: number;
  viewportMode: ResponsiveViewportMode;
  description: string;
}

export const RESPONSIVE_DEVICE_PRESETS: ReadonlyArray<ResponsiveDevicePreset> = [
  {
    id: "desktop",
    label: "Ordinateur (1440 px)",
    shortLabel: "Ordinateur",
    widthCss: "100%",
    maxWidthPx: 1440,
    viewportMode: "desktop",
    description: "Affichage grand écran complet",
  },
  {
    id: "tablet-landscape",
    label: "Tablette paysage (1024 px)",
    shortLabel: "Tablette 1024",
    widthCss: "1024px",
    maxWidthPx: 1024,
    viewportMode: "tablet",
    description: "Tablette horizontale ou petit ordinateur portable",
  },
  {
    id: "tablet-portrait",
    label: "Tablette portrait (768 px)",
    shortLabel: "Tablette 768",
    widthCss: "768px",
    maxWidthPx: 768,
    viewportMode: "tablet",
    description: "Tablette verticale standard",
  },
  {
    id: "wide-phone",
    label: "Téléphone large (414 px)",
    shortLabel: "Mobile 414",
    widthCss: "414px",
    maxWidthPx: 414,
    viewportMode: "mobile",
    description: "Smartphone grand format",
  },
  {
    id: "narrow-phone",
    label: "Téléphone étroit (320 px)",
    shortLabel: "Mobile 320",
    widthCss: "320px",
    maxWidthPx: 320,
    viewportMode: "mobile",
    description: "Écran mobile compact sans débordement horizontal",
  },
] as const;

export const INDEPENDENT_RESPONSIVE_BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; max-width: 100%; overflow-x: hidden; }
img, video, figure { max-width: 100%; }
[data-site-block], [data-site-module], [data-site-card-grid] {
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
}
:where([data-site-block], [data-site-module], [data-site-card-grid]) :where(h1, h2, h3, p, a, span, strong, li) {
  overflow-wrap: break-word;
}

/* En-têtes (fallbacks basse spécificité pour préserver les palettes inline) */
[data-site-block="header-ath-vahloul"],
[data-site-block="header"],
[data-site-block="header-submenus"] {
  padding: 18px 28px;
}
:where([data-site-block="header-ath-vahloul"], [data-site-block="header"], [data-site-block="header-submenus"]) {
  background: #ffffff;
  color: #172033;
  border-bottom: 1px solid #e8e2d9;
}
[data-site-block="header-ath-vahloul"] > div,
[data-site-block="header"] > div,
[data-site-block="header-submenus"] > div {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px 20px;
  flex-wrap: wrap;
}
[data-site-block="header-ath-vahloul"] nav,
[data-site-block="header"] nav,
[data-site-block="header-submenus"] nav {
  display: flex;
  align-items: center;
  gap: 14px 18px;
  flex-wrap: wrap;
}
:where([data-site-block="header-ath-vahloul"], [data-site-block="header"], [data-site-block="header-submenus"]) a {
  color: inherit;
  text-decoration: none;
}
:where([data-site-block="header-ath-vahloul"], [data-site-block="header"], [data-site-block="header-submenus"]) nav a {
  font-size: 14px;
  font-weight: 600;
}
:where([data-site-block="header-ath-vahloul"]) > div > a:last-child {
  display: inline-block;
  padding: 10px 18px;
  background: #e0301f;
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

/* Hero ATH & générique */
[data-site-block="hero-ath-vahloul"],
[data-site-block="hero"] {
  padding: 72px 28px;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) {
  background: linear-gradient(135deg, #342e31 0%, #59634c 58%, #7b8770 100%);
  color: #ffffff;
}
[data-site-block="hero-ath-vahloul"] > div,
[data-site-block="hero"] > div {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 36px;
  align-items: center;
}
[data-site-block="hero-ath-vahloul"] > div > div:first-child,
[data-site-block="hero"] > div > div:first-child {
  min-width: 0;
}
[data-site-block="hero-ath-vahloul"] h1,
[data-site-block="hero"] h1 {
  margin: 14px 0 18px;
  font-size: clamp(34px, 5.2vw, 60px);
  line-height: 1.06;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) p {
  line-height: 1.72;
  color: #f4f1ec;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) a {
  text-decoration: none;
}
[data-site-block="hero-ath-vahloul"] > div > div:first-child > div:last-child,
[data-site-block="hero"] > div > div:first-child > div:last-child {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) > div > div:first-child > div:last-child a:first-child {
  display: inline-block;
  padding: 13px 22px;
  background: #ffffff;
  color: #342e31;
  border-radius: 8px;
  font-weight: 800;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) > div > div:first-child > div:last-child a:last-child {
  display: inline-block;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
}
:where([data-site-block="hero-ath-vahloul"], [data-site-block="hero"]) > div > div:last-child {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
[data-site-block="hero-ath-vahloul"] img,
[data-site-block="hero"] img {
  display: block;
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 14px;
}

/* Cartes visuelles & Grilles (desktop 3 cols compactes, media+texte unifiés) */
[data-site-card-grid="true"],
.ath-card-grid-section {
  padding: 44px 28px !important;
}
:where([data-site-card-grid="true"], .ath-card-grid-section) {
  background: #faf8f5;
}
[data-site-card-grid="true"] > div,
.ath-card-grid-section > div {
  max-width: 1120px !important;
  margin: 0 auto !important;
}
[data-site-card-grid="true"] > div > div:first-child,
.ath-card-grid-section > div > div:first-child {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
[data-site-card-grid-items="true"],
.ath-card-grid {
  width: 100% !important;
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 20px !important;
  align-items: stretch !important;
}
[data-site-card-grid="true"][data-card-columns="1"] [data-site-card-grid-items="true"],
[data-site-card-grid="true"][data-card-columns="1"] .ath-card-grid {
  grid-template-columns: minmax(0, 1fr) !important;
}
[data-site-card-grid="true"][data-card-columns="2"] [data-site-card-grid-items="true"],
[data-site-card-grid="true"][data-card-columns="2"] .ath-card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}
[data-site-card-grid="true"][data-card-columns="4"] [data-site-card-grid-items="true"],
[data-site-card-grid="true"][data-card-columns="4"] .ath-card-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}
[data-site-visual-card="true"],
[data-site-card-grid-items="true"] > article,
.ath-card {
  min-width: 0 !important;
  height: 100% !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}
:where([data-site-visual-card="true"], [data-site-card-grid-items="true"] > article, .ath-card) {
  background: #ffffff;
  border: 1px solid #e6dfd5;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(23, 32, 51, 0.06);
}
[data-site-visual-card="true"][data-card-text="inside"] {
  position: relative !important;
  justify-content: flex-end !important;
  min-height: 270px !important;
}
[data-site-visual-card="true"] .ath-card-media,
[data-site-card-grid-items="true"] > article > div:first-child:has(img) {
  flex: 0 0 auto !important;
  margin: 0 !important;
  line-height: 0;
}
[data-site-visual-card="true"]:not([data-card-shape="round"]):not([data-card-text="inside"]) img,
[data-site-card-grid-items="true"] > article:not([data-card-shape="round"]):not([data-card-text="inside"]) img {
  display: block !important;
  width: 100% !important;
  height: 178px !important;
  object-fit: cover !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
[data-site-visual-card="true"][data-card-shape="square"]:not([data-card-text="inside"]) img {
  height: 210px !important;
}
[data-site-visual-card="true"][data-card-shape="round"] img {
  display: block !important;
  width: 168px !important;
  height: 168px !important;
  margin: 14px auto 4px !important;
  border-radius: 9999px !important;
  object-fit: cover !important;
}
[data-site-visual-card="true"][data-card-text="inside"] img {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
[data-site-card-text],
.ath-card-content {
  padding: 16px 18px 18px !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  gap: 6px !important;
}
:where([data-site-card-text], .ath-card-content) p:first-child {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e0301f;
}
[data-site-card-text] h3,
.ath-card-content h3 {
  margin: 2px 0 4px !important;
  font-size: 19px !important;
  line-height: 1.25 !important;
}
:where([data-site-card-text], .ath-card-content) h3 {
  color: #172033;
}
[data-site-card-text] p:not(:first-child),
.ath-card-content p:not(:first-child) {
  margin: 0 0 12px !important;
  font-size: 14px !important;
  line-height: 1.55 !important;
}
:where([data-site-card-text], .ath-card-content) p:not(:first-child) {
  color: #5b6470;
}
[data-site-card-text] a,
.ath-card-action {
  display: inline-block !important;
  margin-top: auto !important;
  align-self: flex-start !important;
  padding: 9px 15px !important;
  border-radius: 8px !important;
  text-decoration: none !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}
:where([data-site-card-text] a, .ath-card-action) {
  background: #342e31;
  color: #ffffff;
}

/* Chiffres clés & Modules associatifs */
[data-site-block="statistics"] {
  padding: 40px 28px;
}
:where([data-site-block="statistics"]) {
  background: #342e31;
  color: #ffffff;
}
[data-site-block="statistics"] > div {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  text-align: center;
}
[data-site-module="events-calendar"] {
  padding: 46px 28px;
}
:where([data-site-module="events-calendar"]) {
  background: #f7f4ef;
  color: #172033;
}
[data-site-module="events-calendar"] > div {
  max-width: 1060px;
  margin: 0 auto;
}
[data-site-module="events-calendar"] > div > div {
  display: grid;
  gap: 14px;
}
[data-site-module="events-calendar"] article {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 18px 22px;
  border-radius: 14px;
}
:where([data-site-module="events-calendar"] article) {
  background: #ffffff;
  border-left: 5px solid #9b563e;
}

/* Sections ATH multi-pages (fallbacks si inline styles absents) */
[data-site-block^="ath-"] { width: 100%; overflow: hidden; }
[data-site-block^="ath-"] > div { width: 100%; max-width: 1120px; margin: 0 auto; }
[data-site-block^="ath-"] h2, [data-site-block^="ath-"] h3 { letter-spacing: -0.015em; }
[data-site-block="ath-events-overview"] > div > div:last-child,
[data-site-block="ath-family-guidance"] > div,
[data-site-block="ath-organisation"] > div > div:last-child,
[data-site-block="ath-loan-charter"] > div > div:last-child,
[data-site-block="ath-assemblies-reports"] > div > div:last-child {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
[data-site-block="ath-announcements-types"] > div > div:last-child {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
[data-site-block="ath-archives-guidance"] > div,
[data-site-block="ath-loan-request"] ol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
[data-site-block="ath-contact-guidance"] > div {
  display: grid;
  grid-template-columns: 1.15fr .85fr;
  gap: 28px;
  align-items: start;
}
[data-site-block^="ath-"] article { min-width: 0; height: 100%; }
[data-site-block="ath-access-levels"] table { width: 100%; min-width: 680px; border-collapse: collapse; }
[data-site-block="ath-access-levels"] th { font-weight: 800; }
[data-site-block="ath-access-levels"] td, [data-site-block="ath-access-levels"] th { vertical-align: top; }

/* Footer structuré et compact (4 colonnes desktop -> 2 tablet -> 1 mobile) */
[data-site-block="footer"],
.ath-footer {
  padding: 48px 28px 24px !important;
}
:where([data-site-block="footer"], .ath-footer) {
  background: #342e31;
  color: #ffffff;
}
[data-site-block="footer"] > div,
.ath-footer-inner {
  max-width: 1160px !important;
  margin: 0 auto !important;
}
[data-site-block="footer"] > div > div:first-child,
.ath-footer-grid {
  display: grid !important;
  grid-template-columns: 1.5fr 1fr 1fr 1.1fr !important;
  gap: 28px !important;
  align-items: start !important;
}
[data-site-block="footer"] > div > div:first-child > div,
.ath-footer-col {
  min-width: 0 !important;
}
[data-site-block="footer"] > div > div:last-child,
.ath-footer-bottom {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 32px !important;
  padding-top: 18px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.16) !important;
  font-size: 12px !important;
}
:where([data-site-block="footer"] > div > div:last-child, .ath-footer-bottom) {
  color: #cbd2dc;
}
[data-site-block="footer"] a,
.ath-footer a {
  display: block !important;
  margin-top: 8px !important;
  line-height: 1.5 !important;
  font-size: 14px !important;
  text-decoration: none !important;
}
:where([data-site-block="footer"] a, .ath-footer a) {
  color: #ffffff;
}
[data-site-block="footer"] a:hover,
.ath-footer a:hover {
  text-decoration: underline !important;
}
[data-site-block="footer"] h2,
.ath-footer h2 {
  margin: 0 0 12px !important;
  font-size: 22px !important;
  line-height: 1.25 !important;
}
[data-site-block="footer"] h3,
.ath-footer h3 {
  margin: 0 0 12px !important;
  font-size: 13px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}
:where([data-site-block="footer"] h3, .ath-footer h3) {
  color: #f4f1ec;
}
[data-site-block="footer"] p,
.ath-footer p {
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
}
:where([data-site-block="footer"] p, .ath-footer p) {
  color: #cbd2dc;
}

/* Footer accessible complet (preset 3 colonnes) */
[data-site-block="footer-complet-accessible"] {
  padding: 48px 24px !important;
}
:where([data-site-block="footer-complet-accessible"]) {
  background: #172033;
  color: #e2e8f0;
}
[data-site-block="footer-complet-accessible"] > div {
  max-width: 1200px !important;
  margin: 0 auto !important;
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 28px !important;
  align-items: start !important;
}
[data-site-block="footer-complet-accessible"] nav a {
  display: block !important;
  line-height: 1.5 !important;
  text-decoration: none !important;
}

/* Tablette (max-width: 900px — ex. 768px portrait) */
@media (max-width: 900px) {
  [data-site-block="header-ath-vahloul"] > div {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    gap: 12px 16px !important;
  }
  [data-site-block="header-ath-vahloul"] > div > nav {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    justify-content: flex-start !important;
    gap: 10px 14px !important;
  }
  [data-site-block="header-ath-vahloul"] > div > nav a {
    white-space: nowrap !important;
  }
  [data-site-block="hero-ath-vahloul"] > div,
  [data-site-block="hero"] > div {
    grid-template-columns: 1.1fr .9fr !important;
    gap: 24px !important;
  }
  [data-site-block="hero-ath-vahloul"] h1,
  [data-site-block="hero"] h1 {
    font-size: clamp(28px, 4.4vw, 42px) !important;
  }
  [data-site-card-grid-items="true"],
  .ath-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16px !important;
  }
  [data-site-card-grid="true"][data-card-columns="1"] [data-site-card-grid-items="true"],
  [data-site-card-grid="true"][data-card-columns="1"] .ath-card-grid {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  [data-site-block] > div[style*="grid-template-columns"],
  [data-site-module] > div[style*="grid-template-columns"],
  [data-site-module] div[style*="grid-template-columns:repeat(3"],
  [data-site-block] div[style*="grid-template-columns:repeat(4"],
  [data-site-block="statistics"] > div,
  [data-site-block="ath-events-overview"] > div > div:last-child,
  [data-site-block="ath-family-guidance"] > div,
  [data-site-block="ath-organisation"] > div > div:last-child,
  [data-site-block="ath-loan-charter"] > div > div:last-child,
  [data-site-block="ath-assemblies-reports"] > div > div:last-child,
  [data-site-block="ath-announcements-types"] > div > div:last-child,
  [data-site-block="footer"] > div > div:first-child,
  .ath-footer-grid,
  [data-site-block="footer-complet-accessible"] > div {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 22px !important;
  }
}

/* Mobile (max-width: 640px — ex. 414px et 320px) */
@media (max-width: 640px) {
  [data-site-block],
  [data-site-module],
  [data-site-card-grid],
  .ath-card-grid-section {
    padding: 28px 16px !important;
  }
  [data-site-block="header"],
  [data-site-block="header-submenus"],
  [data-site-block="header-ath-vahloul"] {
    padding: 14px 16px !important;
  }
  [data-site-block="header-ath-vahloul"] > div {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px 12px !important;
  }
  [data-site-block="header-ath-vahloul"] > div > a:first-child {
    font-size: 16px !important;
    line-height: 1.25 !important;
    max-width: 100% !important;
  }
  [data-site-block="header"] nav,
  [data-site-block="header-submenus"] nav,
  [data-site-block="header-ath-vahloul"] nav {
    width: 100% !important;
    gap: 8px 12px !important;
  }
  [data-site-block="header-ath-vahloul"] > div > a:last-child {
    margin-left: auto !important;
  }
  [data-site-block="hero-ath-vahloul"],
  [data-site-block="hero"] {
    padding: 36px 16px !important;
  }
  [data-site-block="hero-ath-vahloul"] > div,
  [data-site-block="hero"] > div {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 22px !important;
  }
  [data-site-block="hero-ath-vahloul"] h1,
  [data-site-block="hero"] h1 {
    font-size: clamp(24px, 7.2vw, 34px) !important;
    line-height: 1.1 !important;
  }
  [data-site-block="hero-ath-vahloul"] img,
  [data-site-block="hero"] img {
    height: 190px !important;
  }
  [data-site-block] div[style*="grid-template-columns"],
  [data-site-module] div[style*="grid-template-columns"],
  [data-site-card-grid-items="true"],
  .ath-card-grid,
  [data-site-block="statistics"] > div,
  [data-site-block="ath-events-overview"] > div > div:last-child,
  [data-site-block="ath-family-guidance"] > div,
  [data-site-block="ath-organisation"] > div > div:last-child,
  [data-site-block="ath-loan-charter"] > div > div:last-child,
  [data-site-block="ath-assemblies-reports"] > div > div:last-child,
  [data-site-block="ath-announcements-types"] > div > div:last-child,
  [data-site-block="ath-archives-guidance"] > div,
  [data-site-block="ath-contact-guidance"] > div,
  [data-site-block="ath-loan-request"] ol,
  [data-site-block="footer"] > div > div:first-child,
  .ath-footer-grid,
  [data-site-block="footer-complet-accessible"] > div {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  [data-site-block="ath-access-levels"] { padding: 28px 16px !important; }
  [data-site-block="ath-access-levels"] > div { overflow-x: auto !important; }
  [data-site-block="ath-access-levels"] table { font-size: 13px !important; }
  [data-site-block="ath-access-levels"] td, [data-site-block="ath-access-levels"] th { padding: 12px !important; }
  [data-site-card-grid-items="true"],
  .ath-card-grid {
    gap: 14px !important;
  }
  [data-site-visual-card="true"],
  [data-site-card-grid-items="true"] > article,
  .ath-card {
    border-radius: 14px !important;
  }
  [data-site-visual-card="true"]:not([data-card-shape="round"]):not([data-card-text="inside"]) img,
  [data-site-card-grid-items="true"] > article:not([data-card-shape="round"]):not([data-card-text="inside"]) img {
    height: 150px !important;
  }
  [data-site-visual-card="true"][data-card-shape="round"] img {
    width: 140px !important;
    height: 140px !important;
  }
  [data-site-card-text],
  .ath-card-content {
    padding: 14px 16px 16px !important;
  }
  [data-site-card-text] h3,
  .ath-card-content h3 {
    font-size: 17px !important;
  }
  [data-site-card-text] p:not(:first-child),
  .ath-card-content p:not(:first-child) {
    font-size: 13px !important;
    line-height: 1.5 !important;
  }
  [data-site-block="footer"],
  .ath-footer {
    padding: 36px 16px 20px !important;
  }
  [data-site-block="footer"] > div > div:first-child,
  .ath-footer-grid {
    gap: 20px !important;
  }
  [data-site-block="footer"] > div > div:last-child,
  .ath-footer-bottom {
    margin-top: 24px !important;
    padding-top: 14px !important;
    gap: 8px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`.trim();

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
// 2. Cartes visuelles configurables (formes, positions texte, duplication, suppression, édition, bouton « + »)
// ---------------------------------------------------------------------------

export type VisualCardShape = "square" | "rectangular" | "round";
export type VisualCardTextPlacement = "top" | "bottom" | "inside";
export type VisualCardUseCaseId =
  | "categories"
  | "evenements"
  | "membres"
  | "activites"
  | "galeries"
  | "services"
  | "famille"
  | "association";

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
  columns: 1 | 2 | 3 | 4;
  gapPx?: number;
  shape: VisualCardShape;
  textPlacement: VisualCardTextPlacement;
  showButton: boolean;
  useCase?: VisualCardUseCaseId;
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

export function sanitizeBuilderImageSrc(raw: string, fallback = DEFAULT_CARD_SVG): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return fallback;
  if (/^(?:javascript:|vbscript:|data:text\/html)/i.test(trimmed)) {
    return fallback;
  }
  if (/^data:image\/(?:svg\+xml|png|jpeg|jpg|webp|gif)/i.test(trimmed)) {
    if (/(?:<script|%3cscript|onload\s*=|onerror\s*=|javascript:|vbscript:)/i.test(trimmed)) {
      return fallback;
    }
    return trimmed.replace(/"/g, "%22");
  }
  if (
    (trimmed.startsWith("/") && !trimmed.startsWith("//")) ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed.replace(/["'<>]/g, "");
  }
  return fallback;
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

const ATH_HERO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#52657b"/><stop offset="1" stop-color="#172033"/></linearGradient></defs><rect width="900" height="620" fill="url(#g)"/><circle cx="690" cy="145" r="96" fill="#f5b98f" opacity=".8"/><path d="M0 460 Q160 340 320 440 T640 410 T900 430 V620 H0Z" fill="#172033" opacity=".95"/><path d="M110 425V260l90-76 90 76v165M145 425v-95h110v95M540 430V250l85-65 85 65v180M575 430v-92h100v92" fill="none" stroke="#faf8f5" stroke-width="12" opacity=".75"/><path d="M70 480h760" stroke="#f5b98f" stroke-width="6" opacity=".75"/></svg>`)}`;
const ATH_MEMORY_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#d8c2a8"/><rect x="96" y="76" width="448" height="306" rx="18" fill="#faf8f5" transform="rotate(-4 320 230)"/><circle cx="250" cy="205" r="62" fill="#9b563e" opacity=".75"/><circle cx="394" cy="198" r="62" fill="#52657b" opacity=".75"/><path d="M170 330q70-92 140 0 70-92 140 0" fill="none" stroke="#172033" stroke-width="14" stroke-linecap="round"/><path d="M210 140h220" stroke="#9b563e" stroke-width="10" stroke-linecap="round" opacity=".6"/></svg>`)}`;
const ATH_MEETING_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#52657b"/><rect x="92" y="92" width="456" height="264" rx="24" fill="#faf8f5" opacity=".95"/><ellipse cx="320" cy="270" rx="170" ry="58" fill="#d8c2a8"/><circle cx="205" cy="205" r="35" fill="#9b563e"/><circle cx="320" cy="184" r="35" fill="#172033"/><circle cx="435" cy="205" r="35" fill="#9b563e"/><path d="M170 260q35-45 70 0M285 240q35-45 70 0M400 260q35-45 70 0" fill="none" stroke="#172033" stroke-width="12" stroke-linecap="round"/><path d="M210 346h220" stroke="#f5b98f" stroke-width="12" stroke-linecap="round"/></svg>`)}`;
const ATH_HELP_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#9b563e"/><rect x="112" y="116" width="416" height="250" rx="18" fill="#faf8f5"/><path d="M185 315h270M220 165v150M420 165v150M185 200h270M185 260h270" stroke="#172033" stroke-width="12"/><path d="M270 110v-34h100v34" fill="none" stroke="#f5b98f" stroke-width="12"/><circle cx="320" cy="245" r="48" fill="#f5b98f" opacity=".9"/><path d="M294 245l18 18 36-42" fill="none" stroke="#172033" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`)}`;

const ATH_EVENTS_SECTION_HTML = `<section data-site-block="ath-events-overview" style="padding:72px 28px;background:#f3eee8"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#9b563e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Agenda démonstratif</p><h2 style="margin:0;color:#172033;font:700 clamp(30px,4vw,46px)/1.1 Georgia,serif">Des rendez-vous qui font vivre le lien</h2><p style="max-width:700px;margin:16px 0 30px;color:#526070;line-height:1.75">Les dates ci-dessous sont des exemples de contenu. Elles pourront être remplacées par les vrais rendez-vous de l’association, avec un statut clair pour distinguer les archives, les rencontres en préparation et les prochaines dates.</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px"><article style="padding:22px;background:#fff;border:1px solid #e8e2d9;border-radius:16px"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;text-transform:uppercase">Passé · archives</p><h3 style="margin:12px 0 8px;color:#172033;font-size:21px">Assemblée familiale d’automne</h3><p style="margin:0;color:#526070;line-height:1.65">Bilan des actions, transmission des archives et échanges entre les branches de la famille.</p></article><article style="padding:22px;background:#fff;border:1px solid #e8e2d9;border-radius:16px"><p style="margin:0;color:#b06b34;font-size:12px;font-weight:800;text-transform:uppercase">En préparation · comité</p><h3 style="margin:12px 0 8px;color:#172033;font-size:21px">Journée entraide & matériel</h3><p style="margin:0;color:#526070;line-height:1.65">Inventaire, réservations et organisation du prêt de tables, chaises, vaisselle et équipements.</p></article><article style="padding:22px;background:#fff;border:1px solid #e8e2d9;border-radius:16px"><p style="margin:0;color:#47705f;font-size:12px;font-weight:800;text-transform:uppercase">À venir · inscription</p><h3 style="margin:12px 0 8px;color:#172033;font-size:21px">Rencontre intergénérationnelle</h3><p style="margin:0;color:#526070;line-height:1.65">Un moment pour raconter les souvenirs, accueillir les plus jeunes et partager un repas familial.</p></article></div></div></section>`;
const ATH_EVENT_STATUS_HTML = `<section data-site-block="ath-event-status" style="padding:48px 28px;background:#fff"><div style="max-width:920px;margin:0 auto;padding:24px 28px;border:1px solid #e8e2d9;border-radius:16px"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Lecture de l’agenda</p><h2 style="margin:0 0 16px;color:#172033;font:700 30px/1.15 Georgia,serif">Un statut visible au premier regard</h2><div style="display:flex;gap:10px;flex-wrap:wrap"><span style="padding:8px 12px;border-radius:999px;background:#f3eee8;color:#9b563e;font-size:13px;font-weight:800">Passé · compte-rendu</span><span style="padding:8px 12px;border-radius:999px;background:#fff3e4;color:#b06b34;font-size:13px;font-weight:800">En préparation · comité</span><span style="padding:8px 12px;border-radius:999px;background:#e7f2ec;color:#47705f;font-size:13px;font-weight:800">À venir · inscription</span></div></div></section>`;
const ATH_FAMILY_GUIDANCE_HTML = `<section data-site-block="ath-family-guidance" style="padding:54px 28px;background:#fff"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px"><article style="padding:22px;background:#f3eee8;border-radius:16px"><h2 style="margin:0 0 10px;color:#172033;font-size:23px">Ce qui est public</h2><p style="margin:0;color:#526070;line-height:1.7">L’histoire générale, les valeurs, les rendez-vous et les actions collectives peuvent être présentés à tous.</p></article><article style="padding:22px;background:#f3eee8;border-radius:16px"><h2 style="margin:0 0 10px;color:#172033;font-size:23px">Ce qui est réservé</h2><p style="margin:0;color:#526070;line-height:1.7">L’annuaire, les cotisations, les annonces familiales et la mémoire des défunts restent destinés aux membres autorisés.</p></article><article style="padding:22px;background:#f3eee8;border-radius:16px"><h2 style="margin:0 0 10px;color:#172033;font-size:23px">Une histoire vivante</h2><p style="margin:0;color:#526070;line-height:1.7">Chaque branche pourra proposer un récit, une photo ou une archive après validation et accord des personnes concernées.</p></article></div></section>`;
const ATH_ORGANISATION_HTML = `<section data-site-block="ath-organisation" style="padding:58px 28px;background:#172033;color:#fff"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#f5b98f;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Organisation proposée</p><h2 style="margin:0 0 26px;font:700 clamp(30px,4vw,44px)/1.1 Georgia,serif">Une association claire, utile et participative</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px"><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-weight:800">01 · Rôles</p><h3 style="margin:0 0 10px;font-size:21px">Bureau & coordinateurs</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Présidence, secrétariat, trésorerie, mémoire et responsables de branches pourront être présentés avec des droits adaptés.</p></article><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-weight:800">02 · Cotisation</p><h3 style="margin:0 0 10px;font-size:21px">Participation annuelle</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Le montant, les échéances et les modalités seront ajoutés après décision collective. Aucune donnée de paiement n’est affichée dans cette démonstration.</p></article><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-weight:800">03 · Transparence</p><h3 style="margin:0 0 10px;font-size:21px">Assemblées & rapports</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Les convocations, comptes-rendus et rapports pourront être publiés selon leur niveau de visibilité : public, membres ou bureau.</p></article></div></div></section>`;
const ATH_HELP_GUIDANCE_HTML = `<section data-site-block="ath-help-guidance" style="padding:54px 28px;background:#fff"><div style="max-width:920px;margin:0 auto;padding:28px 30px;border-left:5px solid #9b563e;background:#f3eee8;border-radius:0 16px 16px 0"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Fonctionnement proposé</p><h2 style="margin:0 0 12px;color:#172033;font:700 32px/1.15 Georgia,serif">Demander, vérifier, partager</h2><p style="margin:0;color:#526070;line-height:1.75">Une demande indique la date, le matériel souhaité, la quantité et l’usage prévu. Le coordinateur vérifie la disponibilité, confirme les conditions de prêt ou de location, puis organise le retour. Le dispositif pourra aussi servir aux associations partenaires.</p></div></section>`;
const ATH_LOAN_CHARTER_HTML = `<section data-site-block="ath-loan-charter" style="padding:54px 28px;background:#f3eee8"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#9b563e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Charte de prêt · démonstration</p><h2 style="margin:0 0 24px;color:#172033;font:700 clamp(30px,4vw,42px)/1.1 Georgia,serif">Un matériel partagé, entretenu et traçable</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><article style="padding:20px;background:#fff;border-radius:16px"><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Respecter</h3><p style="margin:0;color:#526070;line-height:1.65">Utiliser les tables, chaises, vaisselle, marmites ou fontaines selon leur usage prévu et signaler toute dégradation.</p></article><article style="padding:20px;background:#fff;border-radius:16px"><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Réserver</h3><p style="margin:0;color:#526070;line-height:1.65">Indiquer une date, un responsable et un besoin précis afin d’éviter les conflits entre événements.</p></article><article style="padding:20px;background:#fff;border-radius:16px"><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Restituer</h3><p style="margin:0;color:#526070;line-height:1.65">Rendre le matériel propre, complet et dans le délai convenu. Les règles définitives seront votées par l’association.</p></article></div></div></section>`;
const ATH_LOAN_REQUEST_HTML = `<section data-site-block="ath-loan-request" style="padding:48px 28px;background:#fff"><div style="max-width:920px;margin:0 auto"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Fiche de demande · à connecter</p><h2 style="margin:0 0 18px;color:#172033;font:700 30px/1.15 Georgia,serif">Les informations à préparer</h2><ol style="margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;counter-reset:request"><li style="padding:16px 18px;border:1px solid #e8e2d9;border-radius:12px;color:#526070"><strong style="display:block;color:#172033">01 · Responsable</strong>Nom du membre ou de l’association demandeuse.</li><li style="padding:16px 18px;border:1px solid #e8e2d9;border-radius:12px;color:#526070"><strong style="display:block;color:#172033">02 · Événement</strong>Date, lieu et type de rassemblement.</li><li style="padding:16px 18px;border:1px solid #e8e2d9;border-radius:12px;color:#526070"><strong style="display:block;color:#172033">03 · Matériel</strong>Articles, quantités et besoin particulier.</li><li style="padding:16px 18px;border:1px solid #e8e2d9;border-radius:12px;color:#526070"><strong style="display:block;color:#172033">04 · Retour</strong>Date prévue et personne chargée de la restitution.</li></ol></div></section>`;
const ATH_ACCESS_LEVELS_HTML = `<section data-site-block="ath-access-levels" style="padding:52px 28px;background:#fff"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#9b563e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Accès & responsabilités · démonstration</p><h2 style="margin:0 0 24px;color:#172033;font:700 clamp(30px,4vw,42px)/1.1 Georgia,serif">Chaque information au bon niveau</h2><div style="overflow-x:auto;border:1px solid #e8e2d9;border-radius:16px"><table style="width:100%;min-width:680px;border-collapse:collapse;color:#526070"><thead><tr style="background:#f3eee8;text-align:left"><th style="padding:16px;color:#172033">Espace</th><th style="padding:16px;color:#172033">Public</th><th style="padding:16px;color:#172033">Membres</th><th style="padding:16px;color:#172033">Bureau</th></tr></thead><tbody><tr><td style="padding:16px;border-top:1px solid #e8e2d9;font-weight:800;color:#172033">Histoire & agenda</td><td style="padding:16px;border-top:1px solid #e8e2d9">Lecture</td><td style="padding:16px;border-top:1px solid #e8e2d9">Proposition</td><td style="padding:16px;border-top:1px solid #e8e2d9">Validation</td></tr><tr><td style="padding:16px;border-top:1px solid #e8e2d9;font-weight:800;color:#172033">Annonces & mémoire</td><td style="padding:16px;border-top:1px solid #e8e2d9">Aucun accès</td><td style="padding:16px;border-top:1px solid #e8e2d9">Selon audience</td><td style="padding:16px;border-top:1px solid #e8e2d9">Modération</td></tr><tr><td style="padding:16px;border-top:1px solid #e8e2d9;font-weight:800;color:#172033">Cotisations & rapports</td><td style="padding:16px;border-top:1px solid #e8e2d9">Bilan public choisi</td><td style="padding:16px;border-top:1px solid #e8e2d9">Consultation</td><td style="padding:16px;border-top:1px solid #e8e2d9">Gestion</td></tr></tbody></table></div></div></section>`;
const ATH_ARCHIVES_GUIDANCE_HTML = `<section data-site-block="ath-archives-guidance" style="padding:54px 28px;background:#fff"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch"><article style="padding:26px;border-radius:16px;background:#172033;color:#fff"><p style="margin:0 0 8px;color:#f5b98f;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Archives</p><h2 style="margin:0 0 12px;font:700 30px/1.15 Georgia,serif">Récits, photos et documents</h2><p style="margin:0;color:#e6ebf2;line-height:1.7">Cette bibliothèque pourra accueillir des récits de villages, des photographies anciennes et des documents familiaux, avec l’auteur, la date approximative et le niveau de partage.</p></article><article style="padding:26px;border-radius:16px;background:#f3eee8"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Arbre familial</p><h2 style="margin:0 0 12px;color:#172033;font:700 30px/1.15 Georgia,serif">Relier les branches avec prudence</h2><p style="margin:0;color:#526070;line-height:1.7">L’arbre sera construit progressivement, sans publier de coordonnées ni d’informations sensibles. Chaque personne pourra demander une correction ou une restriction de visibilité.</p></article></div></section>`;
const ATH_ARCHIVE_CORRECTION_HTML = `<section data-site-block="ath-archive-correction" style="padding:48px 28px;background:#f3eee8"><div style="max-width:920px;margin:0 auto"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Droit de correction · à organiser</p><h2 style="margin:0 0 16px;color:#172033;font:700 30px/1.15 Georgia,serif">Corriger, compléter ou retirer</h2><p style="margin:0;color:#526070;line-height:1.75">Toute personne concernée pourra signaler une erreur, demander l’ajout d’une précision ou solliciter le retrait d’une photo ou d’un récit. La demande sera traitée par le responsable de la mémoire avant toute modification.</p></div></section>`;
const ATH_MEMORY_GUIDANCE_HTML = `<section data-site-block="ath-memory-guidance" style="padding:54px 28px;background:#fff"><div style="max-width:920px;margin:0 auto;padding:24px 28px;border:1px solid #e8e2d9;border-radius:16px;background:#fffaf5"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Espace protégé</p><h2 style="margin:0 0 12px;color:#172033;font:700 30px/1.15 Georgia,serif">La mémoire se partage avec consentement</h2><p style="margin:0;color:#526070;line-height:1.75">Cette rubrique est une démonstration. Toute annonce de décès, naissance, mariage ou hommage devra être proposée par une personne concernée, validée par les proches désignés et visible uniquement par le public choisi.</p></div></section>`;
const ATH_ANNOUNCEMENTS_HTML = `<section data-site-block="ath-announcements-types" style="padding:54px 28px;background:#f3eee8"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#9b563e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Carnet familial</p><h2 style="margin:0 0 26px;color:#172033;font:700 clamp(30px,4vw,44px)/1.1 Georgia,serif">Choisir ce qui doit être partagé</h2><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px"><article style="padding:20px;background:#fff;border-radius:16px"><p style="margin:0 0 8px;color:#47705f;font-size:12px;font-weight:800;text-transform:uppercase">Vie familiale</p><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Naissance</h3><p style="margin:0;color:#526070;line-height:1.6">Annonce proposée par les parents ou représentants désignés.</p></article><article style="padding:20px;background:#fff;border-radius:16px"><p style="margin:0 0 8px;color:#47705f;font-size:12px;font-weight:800;text-transform:uppercase">Vie familiale</p><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Mariage</h3><p style="margin:0;color:#526070;line-height:1.6">Publication uniquement après accord explicite des personnes concernées.</p></article><article style="padding:20px;background:#fff;border-radius:16px"><p style="margin:0 0 8px;color:#9b563e;font-size:12px;font-weight:800;text-transform:uppercase">Mémoire</p><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Décès</h3><p style="margin:0;color:#526070;line-height:1.6">Hommage et informations pratiques avec validation d’un proche autorisé.</p></article><article style="padding:20px;background:#fff;border-radius:16px"><p style="margin:0 0 8px;color:#9b563e;font-size:12px;font-weight:800;text-transform:uppercase">Souvenirs</p><h3 style="margin:0 0 10px;color:#172033;font-size:20px">Archives</h3><p style="margin:0;color:#526070;line-height:1.6">Photographies et récits conservés avec indication de leur audience.</p></article></div></div></section>`;
const ATH_CONTACT_GUIDANCE_HTML = `<section data-site-block="ath-contact-guidance" style="padding:54px 28px;background:#f3eee8"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.15fr .85fr;gap:28px;align-items:start"><div><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Permanence associative</p><h2 style="margin:0;color:#172033;font:700 34px/1.15 Georgia,serif">Une question, une idée ou une demande de matériel ?</h2><p style="margin:16px 0 0;color:#526070;line-height:1.75">Écrivez au bureau ou au coordinateur concerné. Les coordonnées affichées ici sont fictives et seront remplacées lorsque l’association aura validé ses canaux officiels.</p></div><div style="padding:22px;background:#fff;border:1px solid #e8e2d9;border-radius:16px"><p style="margin:0 0 8px;color:#172033;font-weight:800">Avant la mise en ligne</p><p style="margin:0;color:#526070;line-height:1.65">Prévoir une adresse associative, un numéro de permanence et une règle claire pour les demandes réservées aux membres.</p></div></div></section>`;
const ATH_ASSEMBLIES_REPORTS_HTML = `<section data-site-block="ath-assemblies-reports" style="padding:58px 28px;background:#172033;color:#fff"><div style="max-width:1120px;margin:0 auto"><p style="margin:0 0 10px;color:#f5b98f;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Assemblées & rapports · démonstration</p><h2 style="margin:0 0 24px;font:700 clamp(30px,4vw,44px)/1.1 Georgia,serif">Décider, rendre compte, transmettre</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px"><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-size:12px;font-weight:800;text-transform:uppercase">À venir · réservé aux membres</p><h3 style="margin:0 0 10px;font-size:21px">Convocation</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Ordre du jour, date, lieu et modalités de participation, avec diffusion adaptée au public concerné.</p></article><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-size:12px;font-weight:800;text-transform:uppercase">Après réunion · validation</p><h3 style="margin:0 0 10px;font-size:21px">Compte-rendu</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Décisions adoptées, actions à suivre et responsables désignés, après relecture par le bureau.</p></article><article style="padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)"><p style="margin:0 0 8px;color:#f5b98f;font-size:12px;font-weight:800;text-transform:uppercase">Bilan · visibilité choisie</p><h3 style="margin:0 0 10px;font-size:21px">Rapport annuel</h3><p style="margin:0;color:#e6ebf2;line-height:1.65">Actions menées, matériel partagé, événements organisés et perspectives, sans données personnelles inutiles.</p></article></div></div></section>`;
const ATH_CONTACT_FAQ_HTML = `<section data-site-block="ath-contact-faq" style="padding:54px 28px;background:#fff"><div style="max-width:920px;margin:0 auto"><p style="margin:0 0 10px;color:#9b563e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800">Questions fréquentes</p><h2 style="margin:0 0 22px;color:#172033;font:700 34px/1.15 Georgia,serif">Avant d’écrire au bureau</h2><div style="display:grid;gap:12px"><details style="padding:18px 20px;border:1px solid #e8e2d9;border-radius:12px"><summary style="cursor:pointer;color:#172033;font-weight:800">Comment proposer une annonce familiale ?</summary><p style="margin:12px 0 0;color:#526070;line-height:1.65">Préciser le type d’annonce, les personnes concernées et le public souhaité. La publication intervient seulement après validation.</p></details><details style="padding:18px 20px;border:1px solid #e8e2d9;border-radius:12px"><summary style="cursor:pointer;color:#172033;font-weight:800">Comment réserver du matériel ?</summary><p style="margin:12px 0 0;color:#526070;line-height:1.65">Indiquer la date, le matériel, les quantités et un responsable. Le coordinateur répondra selon les disponibilités.</p></details><details style="padding:18px 20px;border:1px solid #e8e2d9;border-radius:12px"><summary style="cursor:pointer;color:#172033;font-weight:800">Les coordonnées affichées sont-elles réelles ?</summary><p style="margin:12px 0 0;color:#526070;line-height:1.65">Non. Cette version est une démonstration ; les coordonnées officielles seront ajoutées après validation de l’association.</p></details></div></div></section>`;

export const VISUAL_CARD_SAMPLE_IMAGES: ReadonlyArray<{ id: string; label: string; url: string }> = [
  {
    id: "bleu-sable",
    label: "Horizon Bleu Nuit & Sable",
    url: DEFAULT_CARD_SVG,
  },
  {
    id: "terracotta-soleil",
    label: "Terracotta & Soleil",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%239b563e'/%3E%3Ccircle cx='320' cy='190' r='88' fill='%23faf8f5' fill-opacity='.78'/%3E%3Cpath d='M0 360 Q220 260 440 360 T640 350 V480 H0Z' fill='%23172033'/%3E%3C/svg%3E",
  },
  {
    id: "olivier-patrimoine",
    label: "Patrimoine & Nature",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%232c4c3e'/%3E%3Ccircle cx='320' cy='195' r='82' fill='%23f5b98f' fill-opacity='.72'/%3E%3Cpath d='M0 375 Q180 290 360 375 T640 370 V480 H0Z' fill='%23172033'/%3E%3C/svg%3E",
  },
  {
    id: "ecru-minimal",
    label: "Écru & Médaillon",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23eae2d6'/%3E%3Ccircle cx='320' cy='215' r='96' fill='%23172033' fill-opacity='.85'/%3E%3Ccircle cx='320' cy='215' r='44' fill='%239b563e'/%3E%3C/svg%3E",
  },
] as const;

export const VISUAL_CARD_USE_CASE_PRESETS: ReadonlyArray<{
  id: VisualCardUseCaseId;
  label: string;
  description: string;
  sectionEyebrow: string;
  sectionTitle: string;
  shape: VisualCardShape;
  textPlacement: VisualCardTextPlacement;
  columns: 1 | 2 | 3 | 4;
  showButton: boolean;
  cards: Array<Pick<VisualCardItem, "title" | "subtitle" | "description" | "buttonLabel" | "buttonHref">>;
}> = [
  {
    id: "categories",
    label: "Catégories & Rubriques",
    description: "Présentez les grands thèmes ou pôles de votre site.",
    sectionEyebrow: "Rubriques du site",
    sectionTitle: "Explorez nos grands thèmes",
    shape: "rectangular",
    textPlacement: "bottom",
    columns: 3,
    showButton: true,
    cards: [
      { title: "Présentation & Histoire", subtitle: "Rubrique 01", description: "Découvrez l’origine, la mission et les valeurs de notre initiative.", buttonLabel: "Découvrir", buttonHref: "/a-propos" },
      { title: "Actions & Projets", subtitle: "Rubrique 02", description: "Suivez nos chantiers en cours et nos réalisations collectives.", buttonLabel: "Voir les actions", buttonHref: "/activites" },
      { title: "Ressources & Contact", subtitle: "Rubrique 03", description: "Consultez nos documents utiles ou prenez contact avec l’équipe.", buttonLabel: "Nous joindre", buttonHref: "/contact" },
    ],
  },
  {
    id: "evenements",
    label: "Événements & Rencontres",
    description: "Annoncez vos prochains rassemblements, dates et lieux.",
    sectionEyebrow: "Agenda & Temps forts",
    sectionTitle: "Nos prochains événements",
    shape: "rectangular",
    textPlacement: "inside",
    columns: 2,
    showButton: true,
    cards: [
      { title: "Rencontre Annuelle & Partage", subtitle: "Samedi 14 Juin · 10h00", description: "Accueil des participants, table ronde, repas convivial et ateliers.", buttonLabel: "S’inscrire", buttonHref: "/evenements" },
      { title: "Journée Portes Ouvertes & Exposition", subtitle: "Dimanche 21 Septembre · 14h00", description: "Exposition photographique, échanges avec les intervenants et visite guidée.", buttonLabel: "Voir le programme", buttonHref: "/evenements" },
    ],
  },
  {
    id: "membres",
    label: "Membres & Équipe",
    description: "Trombinoscope avec médaillons ronds pour vos membres ou intervenants.",
    sectionEyebrow: "Portraits & Rôles",
    sectionTitle: "Les visages de notre collectif",
    shape: "round",
    textPlacement: "bottom",
    columns: 3,
    showButton: false,
    cards: [
      { title: "Présidence & Coordination", subtitle: "Animation", description: "Lien entre les membres, représentation et suivi des orientations annuelles.", buttonLabel: "Contacter", buttonHref: "/contact" },
      { title: "Secrétariat & Mémoire", subtitle: "Documentation", description: "Comptes-rendus, archives et information régulière des adhérents.", buttonLabel: "Contacter", buttonHref: "/contact" },
      { title: "Trésorerie & Intendance", subtitle: "Logistique", description: "Suivi du matériel partagé, organisation des salles et entraide.", buttonLabel: "Contacter", buttonHref: "/contact" },
    ],
  },
  {
    id: "activites",
    label: "Activités & Ateliers",
    description: "Mettez en avant vos ateliers réguliers, créneaux et activités.",
    sectionEyebrow: "Programme régulier",
    sectionTitle: "Nos activités tout au long de l’année",
    shape: "square",
    textPlacement: "top",
    columns: 3,
    showButton: true,
    cards: [
      { title: "Ateliers Culturels & Langue", subtitle: "Chaque samedi", description: "Transmission intergénérationnelle, récits, chant et patrimoine vivant.", buttonLabel: "Participer", buttonHref: "/contact" },
      { title: "Accompagnement Jeunesse", subtitle: "Mercredi & Samedi", description: "Soutien méthodologique, rencontres sportives et mentorat.", buttonLabel: "En savoir plus", buttonHref: "/contact" },
      { title: "Permanence d’Entraide", subtitle: "Sur rendez-vous", description: "Orientation, prêt d’équipements collectifs et solidarité concrète.", buttonLabel: "Demander", buttonHref: "/contact" },
    ],
  },
  {
    id: "galeries",
    label: "Galeries & Albums",
    description: "Grille visuelle pour vos albums photos et réalisations.",
    sectionEyebrow: "En images",
    sectionTitle: "Albums & Souvenirs partagés",
    shape: "square",
    textPlacement: "inside",
    columns: 3,
    showButton: false,
    cards: [
      { title: "Rassemblement de Printemps", subtitle: "Album 2026", description: "Moments de convivialité et retrouvailles entre générations.", buttonLabel: "Voir l’album", buttonHref: "#" },
      { title: "Archives & Photographies Anciennes", subtitle: "Patrimoine", description: "Mémoire des anciens et histoire de nos villages et familles.", buttonLabel: "Voir l’album", buttonHref: "#" },
      { title: "Chantiers & Initiatives Solidaires", subtitle: "Terrain", description: "Retour en images sur nos actions collectives de l’année.", buttonLabel: "Voir l’album", buttonHref: "#" },
    ],
  },
  {
    id: "services",
    label: "Services & Prestations",
    description: "Présentez vos offres de service sans obligation e-commerce.",
    sectionEyebrow: "Savoir-faire",
    sectionTitle: "Nos prestations sur mesure",
    shape: "rectangular",
    textPlacement: "bottom",
    columns: 3,
    showButton: true,
    cards: [
      { title: "Conseil & Diagnostic", subtitle: "Étape 01", description: "Analyse personnalisée de votre besoin et recommandations claires.", buttonLabel: "Demander un échange", buttonHref: "/contact" },
      { title: "Conception & Réalisation", subtitle: "Étape 02", description: "Mise en œuvre soignée avec points d’étape réguliers.", buttonLabel: "Voir notre méthode", buttonHref: "/services" },
      { title: "Suivi & Accompagnement", subtitle: "Étape 03", description: "Présence durable à vos côtés pour faire évoluer votre projet.", buttonLabel: "Prendre rendez-vous", buttonHref: "/contact" },
    ],
  },
  {
    id: "famille",
    label: "Rubriques Familiales",
    description: "Idéal pour les sites familiaux : histoire, annonces, entraide.",
    sectionEyebrow: "Vie de famille",
    sectionTitle: "Nos espaces familiaux",
    shape: "rectangular",
    textPlacement: "bottom",
    columns: 3,
    showButton: true,
    cards: [
      { title: "Histoire & Généalogie", subtitle: "Mémoire", description: "L’histoire de nos branches familiales, nos récits et nos archives.", buttonLabel: "Explorer", buttonHref: "/notre-famille" },
      { title: "Carnet d’Annonces Protégées", subtitle: "Avec consentement", description: "Naissances, mariages, réussites et hommages partagés dans le respect.", buttonLabel: "Consulter", buttonHref: "/annonces" },
      { title: "Entraide & Matériel Partagé", subtitle: "Solidarité", description: "Réservation de la vaisselle, des tables et équipements collectifs.", buttonLabel: "Voir l’inventaire", buttonHref: "/entraide" },
    ],
  },
  {
    id: "association",
    label: "Pages Associatives",
    description: "Pôles d’engagement, bénévolat et vie d’association.",
    sectionEyebrow: "Engagement associatif",
    sectionTitle: "Comment agir avec notre association",
    shape: "rectangular",
    textPlacement: "bottom",
    columns: 3,
    showButton: true,
    cards: [
      { title: "Devenir Membre Actif", subtitle: "Adhésion", description: "Participez aux décisions, aux assemblées et à la vie du collectif.", buttonLabel: "Rejoindre", buttonHref: "/contact" },
      { title: "Proposer une Initiative", subtitle: "Projets", description: "Soumettez une idée d’atelier, d’événement ou d’action solidaire.", buttonLabel: "Proposer", buttonHref: "/contact" },
      { title: "Participer aux Rencontres", subtitle: "Agenda", description: "Retrouvez toutes les dates de nos permanences et rassemblements.", buttonLabel: "Voir les dates", buttonHref: "/evenements" },
    ],
  },
] as const;

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
    imageUrl: sanitizeBuilderImageSrc(overrides?.imageUrl || DEFAULT_CARD_SVG),
    imageAlt: overrides?.imageAlt || overrides?.title || `Illustration carte ${index}`,
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

export function removeCardFromVisualCardGrid(
  config: VisualCardGridConfig,
  cardId: string
): VisualCardGridConfig {
  if (config.cards.length <= 1) return config;
  const nextCards = config.cards.filter((c) => c.id !== cardId);
  if (nextCards.length === 0) return config;
  return {
    ...config,
    cards: nextCards,
  };
}

export function updateCardInVisualCardGrid(
  config: VisualCardGridConfig,
  cardId: string,
  patch: Partial<VisualCardItem>
): VisualCardGridConfig {
  return {
    ...config,
    cards: config.cards.map((card) => {
      if (card.id !== cardId) return card;
      return {
        ...card,
        ...patch,
        imageUrl: patch.imageUrl !== undefined ? sanitizeBuilderImageSrc(patch.imageUrl) : card.imageUrl,
        buttonHref: patch.buttonHref !== undefined ? sanitizeBuilderHref(patch.buttonHref) : card.buttonHref,
      };
    }),
  };
}

export function setVisualCardGridShape(
  config: VisualCardGridConfig,
  shape: VisualCardShape
): VisualCardGridConfig {
  return {
    ...config,
    shape,
    cards: config.cards.map((card) => ({ ...card, shape })),
  };
}

export function setVisualCardGridTextPlacement(
  config: VisualCardGridConfig,
  textPlacement: VisualCardTextPlacement
): VisualCardGridConfig {
  return {
    ...config,
    textPlacement,
    cards: config.cards.map((card) => ({ ...card, textPlacement })),
  };
}

export function applyVisualCardUseCasePreset(
  presetId: VisualCardUseCaseId
): VisualCardGridConfig {
  const preset =
    VISUAL_CARD_USE_CASE_PRESETS.find((p) => p.id === presetId) ?? VISUAL_CARD_USE_CASE_PRESETS[0];
  return {
    sectionEyebrow: preset.sectionEyebrow,
    sectionTitle: preset.sectionTitle,
    columns: preset.columns,
    gapPx: 20,
    shape: preset.shape,
    textPlacement: preset.textPlacement,
    showButton: preset.showButton,
    useCase: preset.id,
    cards: preset.cards.map((c, idx) =>
      createDefaultVisualCardItem(idx + 1, {
        id: `card-${preset.id}-${idx + 1}`,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        buttonLabel: c.buttonLabel,
        buttonHref: c.buttonHref,
        shape: preset.shape,
        textPlacement: preset.textPlacement,
        showButton: preset.showButton,
        imageUrl: VISUAL_CARD_SAMPLE_IMAGES[idx % VISUAL_CARD_SAMPLE_IMAGES.length].url,
        imageAlt: c.title,
      })
    ),
  };
}

export function renderVisualCardHtml(card: VisualCardItem): string {
  const safeTitle = sanitizeBuilderText(card.title, 120);
  const safeSubtitle = sanitizeBuilderText(card.subtitle, 80);
  const safeDesc = sanitizeBuilderText(card.description, 320);
  const safeAlt = sanitizeBuilderText(card.imageAlt || card.title, 140);
  const safeHref = sanitizeBuilderHref(card.buttonHref);
  const safeBtnLabel = sanitizeBuilderText(card.buttonLabel, 60);
  const safeImgSrc = sanitizeBuilderImageSrc(card.imageUrl);

  const imageHeight =
    card.shape === "square" ? "210px" : card.shape === "round" ? "168px" : "178px";
  const imageWidth = card.shape === "round" ? "168px" : "100%";
  const imageRadius =
    card.shape === "round" ? "9999px" : "0";
  const imageMargin = card.shape === "round" ? "14px auto 4px" : "0";

  const textBlock = `<div class="ath-card-content" data-site-card-text="${card.textPlacement}" style="padding:16px 18px 18px;display:flex;flex-direction:column;flex:1 1 auto;gap:6px"><p style="margin:0;color:${card.textPlacement === "inside" ? "#f5b98f" : "#9b563e"};font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">${safeSubtitle}</p><h3 style="margin:2px 0 4px;font-size:19px;line-height:1.25;color:${card.textPlacement === "inside" ? "#ffffff" : "#172033"}">${safeTitle}</h3><p style="margin:0 0 12px;color:${card.textPlacement === "inside" ? "#e6ebf2" : "#5b6470"};font-size:14px;line-height:1.55">${safeDesc}</p>${
    card.showButton
      ? `<a class="ath-card-action" href="${safeHref}" style="display:inline-block;margin-top:auto;align-self:flex-start;padding:9px 15px;border-radius:8px;background:${card.textPlacement === "inside" ? "#f5b98f" : "#172033"};color:${card.textPlacement === "inside" ? "#172033" : "#ffffff"};text-decoration:none;font-size:13px;font-weight:700">${safeBtnLabel}</a>`
      : ""
  }</div>`;

  if (card.textPlacement === "inside") {
    return `<article class="ath-card" data-site-visual-card="true" data-card-id="${card.id}" data-card-shape="${card.shape}" data-card-text="inside" style="position:relative;overflow:hidden;border-radius:${card.shape === "round" ? "28px" : "16px"};min-height:270px;display:flex;align-items:flex-end;background:#172033;color:#fff;box-shadow:0 12px 28px rgba(23,32,51,.12)"><img src="${safeImgSrc}" alt="${safeAlt}" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55" /><div style="position:relative;z-index:2;width:100%;background:linear-gradient(180deg,transparent 0%,rgba(23,32,51,.88) 100%)">${textBlock}</div></article>`;
  }

  const imgBlock = `<div class="ath-card-media" style="padding:${card.shape === "round" ? "12px 14px 0" : "0"};text-align:center;line-height:0"><img src="${safeImgSrc}" alt="${safeAlt}" loading="lazy" decoding="async" style="display:block;width:${imageWidth};max-width:100%;height:${imageHeight};margin:${imageMargin};object-fit:cover;border-radius:${imageRadius}" /></div>`;

  return `<article class="ath-card" data-site-visual-card="true" data-card-id="${card.id}" data-card-shape="${card.shape}" data-card-text="${card.textPlacement}" style="background:#ffffff;border:1px solid #e6dfd5;border-radius:16px;overflow:hidden;height:100%;display:flex;flex-direction:column;justify-content:flex-start;box-shadow:0 8px 22px rgba(23,32,51,.06)">${
    card.textPlacement === "top" ? `${textBlock}${imgBlock}` : `${imgBlock}${textBlock}`
  }</article>`;
}

export function renderVisualCardGridHtml(config: VisualCardGridConfig): string {
  const safeEyebrow = sanitizeBuilderText(config.sectionEyebrow, 80);
  const safeTitle = sanitizeBuilderText(config.sectionTitle, 140);
  const columns = clampNumber(Number(config.columns ?? 3), 1, 4, 3);
  const gapPx = clampNumber(Number(config.gapPx ?? 20), 8, 48, 20);
  const cardsHtml = config.cards.map((card) => renderVisualCardHtml(card)).join("");

  return `<section class="ath-card-grid-section" data-site-card-grid="true" data-card-shape="${config.shape}" data-card-text="${config.textPlacement}" data-card-columns="${columns}" data-card-gap="${gapPx}" style="padding:44px 28px;background:#faf8f5;box-sizing:border-box"><div style="max-width:1120px;margin:0 auto"><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px 16px;flex-wrap:wrap;margin-bottom:22px"><div><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">${safeEyebrow}</p><h2 style="margin:8px 0 0;font-size:clamp(24px,3.5vw,32px);color:#172033">${safeTitle}</h2></div><span data-site-card-add-hint="true" style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid #dfd7cc;color:#172033;font-size:12px;font-weight:700">+ Cartes extensibles (${config.cards.length})</span></div><div class="ath-card-grid" data-site-card-grid-items="true" style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:${gapPx}px;align-items:stretch">${cardsHtml}</div></div></section>`;
}

// ---------------------------------------------------------------------------
// 3. Blocs Éditoriaux (24 Blocs garantis sans aucun élément e-commerce)
// ---------------------------------------------------------------------------

export interface IndependentBuilderBlock {
  id: string;
  label: string;
  category:
    | "Code"
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
    content: `<footer class="ath-footer" data-site-block="footer" style="padding:48px 28px 24px;background:#172033;color:#ffffff"><div class="ath-footer-inner" style="max-width:1160px;margin:0 auto"><div class="ath-footer-grid" style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1.1fr;gap:28px;align-items:start"><div class="ath-footer-col"><h2 style="margin:0 0 12px;font-size:22px;line-height:1.25">Nom du Site</h2><p style="margin:0;color:#cbd2dc;line-height:1.65;font-size:14px">Un site internet indépendant conçu pour informer, fédérer et valoriser vos initiatives.</p></div><div class="ath-footer-col"><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Navigation</h3><a href="/" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Accueil</a><a href="/a-propos" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">À propos</a><a href="/evenements" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Événements</a></div><div class="ath-footer-col"><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Informations</h3><a href="/mentions-legales" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Mentions légales</a><a href="/confidentialite" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Confidentialité</a><a href="/contact" style="display:block;margin-top:8px;color:#ffffff;text-decoration:none;font-size:14px">Contact</a></div><div class="ath-footer-col"><h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#f5b98f">Restons en lien</h3><p style="margin:0;color:#cbd2dc;font-size:14px;line-height:1.6">Écrivez-nous ou participez à nos prochaines rencontres.</p></div></div><div class="ath-footer-bottom" style="margin-top:32px;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;color:#cbd2dc;font-size:12px"><span>© Tous droits réservés</span><span>Site internet indépendant</span></div></div></footer>`,
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
  {
    id: "section-trombinoscope-bureau",
    label: "Trombinoscope Bureau / Équipe",
    category: "Cartes & Grilles",
    description: "Grille éditoriale des membres du bureau, leurs rôles et leurs missions associatives.",
    content: `<section data-site-block="trombinoscope-bureau" style="padding:56px 28px;background:#faf8f5;color:#172033"><div style="max-width:1100px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Gouvernance &amp; Équipe</p><h2 style="font-size:32px;margin:8px 0 12px;color:#172033">Les membres du bureau</h2><p style="margin:0 0 28px;max-width:680px;color:#475569;line-height:1.65">Présentez les responsables bénévoles qui coordonnent les actions, les archives et les rencontres tout au long de l’année.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px"><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><div style="width:52px;height:52px;border-radius:14px;background:#172033;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin-bottom:16px">PR</div><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Présidence</p><h3 style="margin:6px 0 8px;font-size:19px;color:#172033">Prénom Nom</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Coordination générale des projets, représentation de l’association et animation des assemblées annuelles.</p></article><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><div style="width:52px;height:52px;border-radius:14px;background:#9b563e;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin-bottom:16px">SG</div><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Secrétariat général</p><h3 style="margin:6px 0 8px;font-size:19px;color:#172033">Prénom Nom</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Suivi des convocations, rédaction des comptes-rendus et préservation des archives documentaires.</p></article><article style="padding:24px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd5"><div style="width:52px;height:52px;border-radius:14px;background:#263653;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin-bottom:16px">TR</div><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Trésorerie &amp; Intendance</p><h3 style="margin:6px 0 8px;font-size:19px;color:#172033">Prénom Nom</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Suivi transparent des cotisations volontaires, budget des rencontres et gestion du matériel collectif.</p></article></div></div></section>`,
  },
  {
    id: "section-chronologie-histoire",
    label: "Chronologie & Histoire",
    category: "Confiance & Contenu",
    description: "Frise chronologique des étapes fondatrices d’une association, d’un village ou d’une famille.",
    content: `<section data-site-block="chronologie-histoire" style="padding:56px 28px;background:#ffffff;color:#172033"><div style="max-width:960px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Mémoire &amp; Transmission</p><h2 style="font-size:32px;margin:8px 0 28px;color:#172033">Les grandes dates de notre histoire</h2><div style="display:grid;gap:18px;border-left:2px solid #e2d8cc;padding-left:24px"><article style="padding:20px 22px;background:#faf8f5;border-radius:14px;border:1px solid #ebe4db"><strong style="display:block;font-size:15px;color:#9b563e;margin-bottom:6px">1989 · Fondation du collectif</strong><h3 style="margin:0 0 8px;font-size:19px;color:#172033">Première rencontre intergénérationnelle</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.65">Réunion des familles fondatrices autour d’une charte d’entraide, de solidarité et de transmission culturelle.</p></article><article style="padding:20px 22px;background:#faf8f5;border-radius:14px;border:1px solid #ebe4db"><strong style="display:block;font-size:15px;color:#9b563e;margin-bottom:6px">2008 · Maison &amp; Archives partagées</strong><h3 style="margin:0 0 8px;font-size:19px;color:#172033">Collecte des photographies et récits anciens</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.65">Numérisation des documents d’époque, création de l’arbre familial et mise en place du matériel partagé.</p></article><article style="padding:20px 22px;background:#faf8f5;border-radius:14px;border:1px solid #ebe4db"><strong style="display:block;font-size:15px;color:#9b563e;margin-bottom:6px">Aujourd’hui · Lien vivant à distance</strong><h3 style="margin:0 0 8px;font-size:19px;color:#172033">Un espace numérique dédié et indépendant</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.65">Coordination des rendez-vous annuels, partage des actualités et accueil des nouvelles générations.</p></article></div></div></section>`,
  },
  {
    id: "section-galerie-evenements",
    label: "Galerie d’événements par année",
    category: "Images & Médias",
    description: "Albums chronologiques de rencontres annuelles avec dates, lieux et légendes modifiables.",
    content: `<section data-site-block="galerie-evenements" style="padding:56px 28px;background:#f7f4ef;color:#172033"><div style="max-width:1100px;margin:0 auto"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Albums &amp; Souvenirs</p><h2 style="font-size:32px;margin:8px 0 12px;color:#172033">Galerie des événements par année</h2><p style="margin:0 0 28px;max-width:680px;color:#475569;line-height:1.65">Classez vos photographies par édition pour permettre aux membres de retrouver chaque rencontre en un coup d’œil.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px"><article style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6dfd5"><div style="height:180px;background:linear-gradient(135deg,#172033 0%,#2b3d59 100%);display:flex;align-items:flex-end;padding:18px;color:#ffffff"><strong style="font-size:24px">2025</strong></div><div style="padding:20px"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Juin 2025 · Rencontre d’été</p><h3 style="margin:6px 0 8px;font-size:18px;color:#172033">Assemblée annuelle &amp; repas fraternel</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Remplacez ce visuel par une photo de votre médiathèque et ajoutez les légendes des moments forts.</p></div></article><article style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6dfd5"><div style="height:180px;background:linear-gradient(135deg,#9b563e 0%,#6f3b2a 100%);display:flex;align-items:flex-end;padding:18px;color:#ffffff"><strong style="font-size:24px">2024</strong></div><div style="padding:20px"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Septembre 2024 · Patrimoine</p><h3 style="margin:6px 0 8px;font-size:18px;color:#172033">Exposition d’archives &amp; témoignages</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Un après-midi consacré aux récits des anciens, aux cartes postales et à la transmission orale.</p></div></article><article style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6dfd5"><div style="height:180px;background:linear-gradient(135deg,#234236 0%,#3c6857 100%);display:flex;align-items:flex-end;padding:18px;color:#ffffff"><strong style="font-size:24px">2023</strong></div><div style="padding:20px"><p style="margin:0;color:#9b563e;font-size:13px;font-weight:700">Mai 2023 · Entraide</p><h3 style="margin:6px 0 8px;font-size:18px;color:#172033">Journée citoyenne &amp; accueil des jeunes</h3><p style="margin:0;color:#475569;font-size:14px;line-height:1.6">Ateliers intergénérationnels, entretien des espaces communs et partage de spécialités familiales.</p></div></article></div></div></section>`,
  },
  {
    id: "section-adhesion-dons",
    label: "Appel aux dons & Adhésions (IBAN / CCP)",
    category: "Contact & Décoration",
    description: "Bloc informatif de soutien associatif avec coordonnées bancaires ou CCP éditables, sans module marchand.",
    content: `<section data-site-block="adhesion-dons" style="padding:56px 28px;background:#ffffff;color:#172033"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;align-items:stretch"><div style="padding:30px;background:#172033;color:#ffffff;border-radius:18px"><p style="margin:0;color:#f5b98f;font-size:13px;font-weight:700">Soutien &amp; Adhésion</p><h2 style="font-size:30px;margin:10px 0 14px;color:#ffffff">Soutenir la vie de l’association</h2><p style="margin:0 0 20px;color:#d6dce6;font-size:15px;line-height:1.65">Les cotisations et contributions volontaires financent exclusivement les salles de rencontre, l’entretien du matériel partagé et la préservation des archives familiales.</p><a href="/contact" style="display:inline-block;padding:12px 20px;background:#f5b98f;color:#172033;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px">Demander un bulletin d’adhésion</a></div><div style="padding:30px;background:#faf8f5;border:1px solid #e6dfd5;border-radius:18px"><h3 style="margin:0 0 14px;font-size:20px;color:#172033">Coordonnées de virement (à personnaliser)</h3><div style="display:grid;gap:12px;font-size:14px;color:#334155"><div style="padding:12px 14px;background:#ffffff;border-radius:10px;border:1px solid #e6dfd5"><strong style="display:block;font-size:12px;color:#64748b;margin-bottom:4px">Titulaire du compte</strong><span>Association Familiale · Nom à renseigner</span></div><div style="padding:12px 14px;background:#ffffff;border-radius:10px;border:1px solid #e6dfd5"><strong style="display:block;font-size:12px;color:#64748b;margin-bottom:4px">IBAN / Compte bancaire</strong><span style="font-family:monospace">CH00 0000 0000 0000 0000 0</span></div><div style="padding:12px 14px;background:#ffffff;border-radius:10px;border:1px solid #e6dfd5"><strong style="display:block;font-size:12px;color:#64748b;margin-bottom:4px">CCP / Référence de motif</strong><span>Cotisation annuelle + Prénom et Nom</span></div></div><p style="margin:14px 0 0;font-size:12px;color:#64748b;line-height:1.5">Section purement informative : aucun encaissement automatique n’est effectué sur ce site.</p></div></div></section>`,
  },
  {
    id: "independent-custom-code",
    label: "Code personnalisé HTML",
    category: "Code",
    description: "Zone neutre pour ajouter du HTML/CSS personnalisé, sans script, secret ni donnée métier.",
    content: `<section data-site-custom-code="true" style="box-sizing:border-box;max-width:100%;padding:28px 24px;background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;overflow-wrap:anywhere"><div data-site-custom-code-slot="true" style="max-width:100%"><p style="margin:0 0 8px;color:#334155;font-size:14px;font-weight:700">Zone de code personnalisé</p><p style="margin:0;color:#64748b;font-size:13px;line-height:1.6">Sélectionnez cette zone, puis modifiez son HTML/CSS avec les outils du constructeur. Les scripts, accès sensibles et données métier restent interdits.</p></div></section>`,
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
  socialImageUrl?: string;
  indexable?: boolean;
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
  categoryLabel?: string;
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
    categoryLabel: "Association familiale",
    siteType: "familial",
    tagline: "Notre famille, notre mémoire, notre entraide.",
    description:
      "Site associatif et familial complet multi-pages (Accueil, Notre Famille & Histoire, Événements & Rencontres, Entraide & Matériel, Annonces & Mémoire, Contact) fonctionnant 100 % sans boutique.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
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
          { id: "nav-assemblees", label: "Assemblées & Rapports", href: "/assemblees-rapports", pageId: "page-assemblees" },
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
        seoTitle: "Démonstration — Association familiale ATH VAHLOUL | Mémoire, Rencontres & Entraide",
        seoDescription:
          "Démonstration de site pour l’Association familiale ATH VAHLOUL : histoire familiale, rencontres, prêt de matériel collectif et solidarité intergénérationnelle. Contenus imaginés à personnaliser.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; background: #faf8f5; }",
        html: [
          `<header data-site-block="header-ath-vahloul" style="padding:18px 28px;background:#ffffff;color:#172033;border-bottom:1px solid #e8e2d9"><div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-weight:800;font-size:20px;letter-spacing:.02em">Association familiale ATH VAHLOUL</a><nav aria-label="Menu principal ATH VAHLOUL" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap"><a href="/" style="color:#172033;text-decoration:none;font-size:14px;font-weight:700">Accueil</a><a href="/notre-famille" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Notre Famille</a><a href="/evenements" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Événements</a><a href="/entraide" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Entraide & Matériel</a><a href="/assemblees-rapports" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Assemblées & Rapports</a><a href="/annonces" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Annonces & Mémoire</a><a href="/contact" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/contact" style="display:inline-block;padding:10px 18px;background:#9b563e;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Participer</a></div></header>`,
          `<section data-site-block="hero-ath-vahloul" style="padding:84px 28px;background:linear-gradient(135deg,#172033 0%,#263653 58%,#52657b 100%);color:#ffffff"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.2fr .8fr;gap:38px;align-items:center"><div><p style="margin:0;color:#f5b98f;text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:800">Démonstration à personnaliser · Association familiale ATH VAHLOUL</p><h1 style="font-size:clamp(38px,6vw,64px);line-height:1.05;margin:14px 0 18px">Notre famille, notre mémoire, notre entraide.</h1><p style="max-width:640px;margin:0 0 26px;color:#e6ebf2;line-height:1.75;font-size:17px">Un espace indépendant imaginé pour les membres et amis de la famille ATH VAHLOUL. Les textes, dates, coordonnées et illustrations présentés ici sont des exemples à remplacer par les informations validées de l’association.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><a href="/notre-famille" style="padding:13px 22px;background:#ffffff;color:#172033;border-radius:8px;text-decoration:none;font-weight:800">Découvrir la famille</a><a href="/evenements" style="padding:12px 20px;border:1px solid rgba(255,255,255,.7);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700">Calendrier des rencontres</a></div></div><div style="padding:20px;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)"><img src="${ATH_HERO_SVG}" alt="Illustration d’un rassemblement de la famille ATH VAHLOUL" data-site-transformable-image="true" style="display:block;width:100%;height:250px;object-fit:cover;border-radius:14px" /></div></div></section>`,
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
                imageUrl: ATH_MEMORY_SVG,
                imageAlt: "Album d’archives et de souvenirs familiaux",
              }),
              createDefaultVisualCardItem(2, {
                title: "Rencontres & Assemblées",
                subtitle: "Calendrier",
                description: "Préparer nos fêtes familiales, réunions annuelles et journées culturelles intergénérationnelles.",
                buttonLabel: "Voir l’agenda",
                buttonHref: "/evenements",
                imageUrl: ATH_MEETING_SVG,
                imageAlt: "Réunion familiale autour d’une table",
              }),
              createDefaultVisualCardItem(3, {
                title: "Entraide & Matériel partagé",
                subtitle: "Solidarité",
                description: "Mettre à disposition tables, chaises, vaisselle et équipements pour les événements des membres.",
                buttonLabel: "Consulter l’inventaire",
                buttonHref: "/entraide",
                imageUrl: ATH_HELP_SVG,
                imageAlt: "Matériel collectif prêté par l’association",
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          ATH_FAMILY_GUIDANCE_HTML,
          ATH_ORGANISATION_HTML,
          ATH_ACCESS_LEVELS_HTML,
          ATH_ARCHIVES_GUIDANCE_HTML,
          ATH_ARCHIVE_CORRECTION_HTML,
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_BLOCKS[4].content,
          ATH_EVENTS_SECTION_HTML,
          ATH_EVENT_STATUS_HTML,
          INDEPENDENT_BUILDER_MODULES[0].html,
          INDEPENDENT_BUILDER_BLOCKS[7].content,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
      {
        id: "page-assemblees",
        title: "Assemblées & Rapports",
        slug: "/assemblees-rapports",
        parentPageId: "page-evenements",
        showInMenu: true,
        menuOrder: 5,
        visibility: "members",
        seoTitle: "Assemblées & Rapports | Association familiale ATH VAHLOUL",
        seoDescription: "Espace réservé aux membres pour les convocations, comptes-rendus et rapports de l’association familiale ATH VAHLOUL.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: false,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          `<section data-site-block="ath-assemblies-intro" style="padding:54px 28px;background:#f3eee8"><div style="max-width:920px;margin:0 auto;padding:28px 30px;border-left:5px solid #9b563e;background:#fff;border-radius:0 16px 16px 0"><p style="margin:0 0 8px;color:#9b563e;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800">Espace membres · démonstration</p><h1 style="margin:0 0 12px;color:#172033;font:700 clamp(32px,5vw,48px)/1.1 Georgia,serif">Préparer, décider, transmettre</h1><p style="margin:0;color:#526070;line-height:1.75">Les convocations, décisions et rapports seront ajoutés après validation par le bureau. Cette page ne contient actuellement aucun document réel ni donnée personnelle.</p></div></section>`,
          ATH_ASSEMBLIES_REPORTS_HTML,
          INDEPENDENT_BUILDER_MODULES[6].html,
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          INDEPENDENT_BUILDER_MODULES[3].html,
          ATH_HELP_GUIDANCE_HTML,
          ATH_LOAN_CHARTER_HTML,
          ATH_LOAN_REQUEST_HTML,
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: false,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          ATH_MEMORY_GUIDANCE_HTML,
          ATH_ANNOUNCEMENTS_HTML,
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #172033; }",
        html: [
          INDEPENDENT_BUILDER_BLOCKS[1].content,
          ATH_CONTACT_GUIDANCE_HTML,
          INDEPENDENT_BUILDER_MODULES[7].html,
          ATH_CONTACT_FAQ_HTML,
          INDEPENDENT_BUILDER_BLOCKS[19].content,
          INDEPENDENT_BUILDER_BLOCKS[14].content,
          INDEPENDENT_BUILDER_BLOCKS[2].content,
        ].join(""),
      },
    ],
  },
  {
    id: "modele-association-culturelle",
    name: "Cercle Culturel & Patrimoine Vivant",
    categoryLabel: "Association culturelle",
    siteType: "association",
    tagline: "Transmettre les arts, la langue et la mémoire locale.",
    description:
      "Modèle complet pour association culturelle : expositions, ateliers artistiques, calendrier des conférences, galerie photo et adhésion.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-cult-1", label: "Accueil", href: "/", pageId: "cult-accueil" },
      { id: "nav-cult-2", label: "Ateliers & Arts", href: "/association", pageId: "cult-ateliers" },
      { id: "nav-cult-3", label: "Agenda Culturel", href: "/evenements", pageId: "cult-agenda" },
      { id: "nav-cult-4", label: "Adhérer & Contact", href: "/contact", pageId: "cult-contact" },
    ],
    pages: [
      {
        id: "cult-accueil",
        title: "Accueil Culture & Patrimoine",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Cercle Culturel & Patrimoine Vivant | Accueil",
        seoDescription: "Découvrez nos ateliers culturels, expositions et rencontres patrimoniales.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "cult-ateliers",
        title: "Nos Ateliers & Pôles Artistiques",
        slug: "/association",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Ateliers Artistiques & Transmission | Cercle Culturel",
        seoDescription: "Ateliers hebdomadaires de musique, littérature, calligraphie et histoire locale.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[1].html,
      },
      {
        id: "cult-agenda",
        title: "Agenda des Expositions & Rencontres",
        slug: "/evenements",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Agenda Culturel & Conférences",
        seoDescription: "Calendrier des expositions, concerts acoustiques et tables rondes.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[6].html,
      },
      {
        id: "cult-contact",
        title: "Nous Rejoindre & Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Adhésion & Contact | Cercle Culturel",
        seoDescription: "Rejoignez l’association culturelle ou inscrivez-vous à un atelier.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-association-sportive",
    name: "Club Sportif & Jeunesse Solidaire",
    categoryLabel: "Association sportive",
    siteType: "association",
    tagline: "Esprit d’équipe, dépassement de soi et convivialité.",
    description:
      "Site complet pour club sportif ou association de loisirs : créneaux d’entraînement, encadrants, calendrier des matchs/sorties et inscriptions.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#1d4ed8",
      backgroundColor: "#f8fafc",
      headingFont: "Plus Jakarta Sans, system-ui, sans-serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-sp-1", label: "Accueil", href: "/", pageId: "sp-accueil" },
      { id: "nav-sp-2", label: "Équipes & Entraînements", href: "/equipe", pageId: "sp-equipe" },
      { id: "nav-sp-3", label: "Calendrier Sportif", href: "/evenements", pageId: "sp-calendrier" },
      { id: "nav-sp-4", label: "Inscriptions", href: "/contact", pageId: "sp-contact" },
    ],
    pages: [
      {
        id: "sp-accueil",
        title: "Accueil du Club",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Club Sportif & Jeunesse | Accueil",
        seoDescription: "Horaires d’entraînement, sections jeunes et adultes, vie du club sportif.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "sp-equipe",
        title: "Éducateurs & Sections",
        slug: "/equipe",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Encadrement & Sections Sportives",
        seoDescription: "Présentation des entraîneurs bénévoles et des créneaux par catégorie d’âge.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[7].html,
      },
      {
        id: "sp-calendrier",
        title: "Rencontres & Tournois",
        slug: "/evenements",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Calendrier des Rencontres & Stages",
        seoDescription: "Prochaines compétitions amicales, tournois inter-villages et stages vacances.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[6].html,
      },
      {
        id: "sp-contact",
        title: "Inscriptions & Stade",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "S’inscrire au Club Sportif",
        seoDescription: "Modalités d’essai gratuit, dossier d’inscription et accès aux installations.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-association-humanitaire",
    name: "Collectif Humanitaire & Entraide Citoyenne",
    categoryLabel: "Association humanitaire",
    siteType: "association",
    tagline: "Agir concrètement sur le terrain avec transparence.",
    description:
      "Site associatif dédié aux projets solidaires et humanitaires : missions sur le terrain, bilans d’impact, appels à bénévoles et points de collecte.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-hum-1", label: "Accueil", href: "/", pageId: "hum-accueil" },
      { id: "nav-hum-2", label: "Nos Missions", href: "/association", pageId: "hum-missions" },
      { id: "nav-hum-3", label: "Actualités Terrain", href: "/actualites", pageId: "hum-actus" },
      { id: "nav-hum-4", label: "Devenir Bénévole", href: "/contact", pageId: "hum-contact" },
    ],
    pages: [
      {
        id: "hum-accueil",
        title: "Accueil & Impact Solidaire",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Collectif Humanitaire & Entraide | Accueil",
        seoDescription: "Actions d’entraide, soutien éducatif, convois solidaires et bénévolat.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "hum-missions",
        title: "Missions & Gouvernance",
        slug: "/association",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Nos Missions Humanitaires & Transparence",
        seoDescription: "Découvrez nos programmes d’accès à l’éducation, à la santé et à l’eau.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[1].html,
      },
      {
        id: "hum-actus",
        title: "Journal des Actions Terrain",
        slug: "/actualites",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Comptes-rendus & Actualités des Missions",
        seoDescription: "Suivi photographique et bilans détaillés de chaque opération solidaire.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[8].html,
      },
      {
        id: "hum-contact",
        title: "Agir Avec Nous & Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Devenir Bénévole | Collectif Humanitaire",
        seoDescription: "Participez aux collectes de matériel ou rejoignez une équipe de bénévoles.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-vitrine-services-pro",
    name: "Atelier & Conseil Professionnel",
    categoryLabel: "Professionnel indépendant",
    siteType: "services",
    tagline: "Clarté, expertise et accompagnement sur mesure.",
    description:
      "Site vitrine professionnel multi-pages (Accueil, Services, Méthode & Références, Contact) conçu pour les consultants, cabinets libéraux et indépendants.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#0d9488",
      backgroundColor: "#f8fafc",
      headingFont: "Plus Jakarta Sans, system-ui, sans-serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-pro-home", label: "Accueil", href: "/", pageId: "pro-accueil" },
      { id: "nav-pro-services", label: "Nos Services", href: "/services", pageId: "pro-services" },
      { id: "nav-pro-entreprise", label: "Le Cabinet", href: "/entreprise", pageId: "pro-cabinet" },
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
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
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[4].html,
      },
      {
        id: "pro-cabinet",
        title: "Approche & Engagements",
        slug: "/entreprise",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Notre Cabinet & Valeurs",
        seoDescription: "Parcours, déontologie et témoignages de nos clients accompagnés.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[3].html,
      },
      {
        id: "pro-contact",
        title: "Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Contactez notre équipe",
        seoDescription: "Prenez rendez-vous ou posez vos questions via notre formulaire.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-petite-entreprise-locale",
    name: "Artisan & Petite Entreprise Locale",
    categoryLabel: "Petite entreprise locale",
    siteType: "professionnel",
    tagline: "Un savoir-faire de proximité, durable et reconnu.",
    description:
      "Site vitrine complet pour artisan, PME locale ou atelier : présentation du métier, réalisations en images, équipe et demande de devis gratuit.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Plus Jakarta Sans, system-ui, sans-serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-pme-1", label: "Accueil", href: "/", pageId: "pme-accueil" },
      { id: "nav-pme-2", label: "Savoir-faire", href: "/entreprise", pageId: "pme-entreprise" },
      { id: "nav-pme-3", label: "Prestations", href: "/services", pageId: "pme-services" },
      { id: "nav-pme-4", label: "Devis & Contact", href: "/contact", pageId: "pme-contact" },
    ],
    pages: [
      {
        id: "pme-accueil",
        title: "Accueil Entreprise",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Artisan & Petite Entreprise Locale | Accueil",
        seoDescription: "Entreprise locale à votre écoute pour vos projets de création, rénovation et entretien.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "pme-entreprise",
        title: "Notre Atelier & Équipe",
        slug: "/entreprise",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Notre Histoire & Garanties Qualité",
        seoDescription: "Découvrez notre équipe d’artisans qualifiés et nos engagements de proximité.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[3].html,
      },
      {
        id: "pme-services",
        title: "Prestations & Réalisations",
        slug: "/services",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Nos Prestations & Chantiers Réalisés",
        seoDescription: "Galerie de réalisations, étapes d’intervention et questions fréquentes.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[4].html,
      },
      {
        id: "pme-contact",
        title: "Demande de Devis & Accès",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Demander un Devis Gratuit | Contact",
        seoDescription: "Horaires d’ouverture de l’atelier, zone d’intervention et formulaire de contact.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-portfolio-creatif",
    name: "Portfolio Créatif & Galerie d’Auteur",
    categoryLabel: "Portfolio",
    siteType: "personnel",
    tagline: "Créations visuelles, projets sélectionnés et démarche artistique.",
    description:
      "Portfolio épuré multi-pages pour photographe, architecte, designer ou artisan d’art : sélection d’œuvres, démarche, biographie et contact.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-pf-1", label: "Accueil", href: "/", pageId: "pf-accueil" },
      { id: "nav-pf-2", label: "Réalisations", href: "/services", pageId: "pf-projets" },
      { id: "nav-pf-3", label: "Démarche", href: "/equipe", pageId: "pf-demarche" },
      { id: "nav-pf-4", label: "Contact", href: "/contact", pageId: "pf-contact" },
    ],
    pages: [
      {
        id: "pf-accueil",
        title: "Portfolio — Accueil",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Portfolio Créatif & Réalisations | Accueil",
        seoDescription: "Découvrez une sélection de projets visuels, expositions et collaborations.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "pf-projets",
        title: "Sélection de Projets",
        slug: "/services",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Galerie des Projets & Séries",
        seoDescription: "Présentation détaillée des œuvres, commandes et séries photographiques.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[4].html,
      },
      {
        id: "pf-demarche",
        title: "Biographie & Démarche",
        slug: "/equipe",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "À propos & Parcours Artistique",
        seoDescription: "Formation, expositions passées et philosophie de création.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[7].html,
      },
      {
        id: "pf-contact",
        title: "Contact & Collaborations",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Proposer un Projet ou une Exposition",
        seoDescription: "Formulaire de prise de contact directe avec l’atelier.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-rencontre-evenementiel",
    name: "Forum, Événement & Célébration (Mariage / Rencontre)",
    categoryLabel: "Événement ou mariage",
    siteType: "evenementiel",
    tagline: "Un événement fédérateur à célébrer ensemble.",
    description:
      "Site événementiel multi-pages idéal pour un mariage, une fête annuelle, un colloque ou un festival : programme horaire, invités/intervenants, accès et confirmation de présence (RSVP).",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-evt-home", label: "Accueil", href: "/", pageId: "evt-accueil" },
      { id: "nav-evt-prog", label: "Programme", href: "/evenements", pageId: "evt-programme" },
      { id: "nav-evt-equipe", label: "Invités & Équipe", href: "/equipe", pageId: "evt-intervenants" },
      { id: "nav-evt-contact", label: "Confirmer ma présence", href: "/contact", pageId: "evt-contact" },
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
        seoTitle: "Forum, Événement & Célébration | Accueil",
        seoDescription: "Programme, dates, lieu de réception et confirmation de présence.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
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
        seoTitle: "Programme des temps forts et horaires",
        seoDescription: "Déroulé complet de la journée, cérémonies, tables rondes et repas.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[6].html,
      },
      {
        id: "evt-intervenants",
        title: "Invités & Organisation",
        slug: "/equipe",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Les intervenants et coordinateurs",
        seoDescription: "Portraits des hôtes, témoins, intervenants et équipe d’accueil.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[7].html,
      },
      {
        id: "evt-contact",
        title: "Infos pratiques & Confirmation (RSVP)",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Accès, Hébergements & Confirmation de présence",
        seoDescription: "Formulaire de confirmation de présence et informations d’accès au lieu.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-restaurant-commerce-vitrine",
    name: "Table & Commerce de Proximité (Vitrine sans boutique)",
    categoryLabel: "Restaurant ou commerce sans e-commerce",
    siteType: "vitrine",
    tagline: "Produits frais, accueil chaleureux et savoir-faire maison.",
    description:
      "Site vitrine pour restaurant, salon de thé, boulangerie ou commerce local sans vente en ligne : présentation de la carte de saison, engagements producteurs, horaires et réservation de table.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-rest-1", label: "Accueil", href: "/", pageId: "rest-accueil" },
      { id: "nav-rest-2", label: "Carte de Saison", href: "/services", pageId: "rest-carte" },
      { id: "nav-rest-3", label: "Notre Maison", href: "/entreprise", pageId: "rest-maison" },
      { id: "nav-rest-4", label: "Horaires & Réservation", href: "/contact", pageId: "rest-contact" },
    ],
    pages: [
      {
        id: "rest-accueil",
        title: "Bienvenue à Notre Table",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Table & Commerce de Proximité | Accueil",
        seoDescription: "Cuisine de saison, spécialités maison et accueil convivial au cœur du quartier.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "rest-carte",
        title: "Spécialités & Carte de Saison",
        slug: "/services",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Notre Carte de Saison & Spécialités Maison",
        seoDescription: "Découvrez nos entrées, plats mijotés, douceurs maison et menus du jour sur place.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[4].html,
      },
      {
        id: "rest-maison",
        title: "Notre Histoire & Producteurs Locaux",
        slug: "/entreprise",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Notre Maison & Nos Artisans Partenaires",
        seoDescription: "Une équipe passionnée travaillant en circuit court avec les producteurs locaux.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[3].html,
      },
      {
        id: "rest-contact",
        title: "Horaires, Accès & Réservation de Table",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 4,
        visibility: "public",
        seoTitle: "Réserver une Table & Horaires d’Ouverture",
        seoDescription: "Contactez-nous par téléphone ou formulaire pour réserver votre table ou privatiser la salle.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
  {
    id: "modele-site-personnel",
    name: "Espace Personnel & Carnet d’Initiatives",
    categoryLabel: "Site personnel",
    siteType: "personnel",
    tagline: "Partager mes écrits, mes projets et mes engagements.",
    description:
      "Site personnel sobre et lisible en 3 pages (Accueil & Présentation, Chroniques & Projets, Contact) pour partager des réflexions, publications ou initiatives citoyennes.",
    theme: {
      primaryColor: "#172033",
      accentColor: "#9b563e",
      backgroundColor: "#faf8f5",
      headingFont: "Georgia, serif",
      bodyFont: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    navigation: [
      { id: "nav-pers-1", label: "Accueil", href: "/", pageId: "pers-accueil" },
      { id: "nav-pers-2", label: "Publications & Projets", href: "/actualites", pageId: "pers-publications" },
      { id: "nav-pers-3", label: "Me Contacter", href: "/contact", pageId: "pers-contact" },
    ],
    pages: [
      {
        id: "pers-accueil",
        title: "Accueil & Présentation",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: "Espace Personnel & Carnet d’Initiatives | Accueil",
        seoDescription: "Présentation personnelle, parcours et engagements.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[0].html,
      },
      {
        id: "pers-publications",
        title: "Chroniques & Projets",
        slug: "/actualites",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Articles, Notes de Recherche & Projets",
        seoDescription: "Recueil de textes, chroniques et projets documentaires.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[8].html,
      },
      {
        id: "pers-contact",
        title: "Me Contacter",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 3,
        visibility: "public",
        seoTitle: "Écrire un message",
        seoDescription: "Formulaire de contact personnel pour échanger ou collaborer.",
        socialImageUrl: DEFAULT_CARD_SVG,
        indexable: true,
        css: "body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }",
        html: INDEPENDENT_PAGE_SOCLES[5].html,
      },
    ],
  },
] as const;

/**
 * Palette ATH VAHLOUL inspirée de la référence 143.ch :
 * charbon éditorial, rouge signal, blanc et neutres chauds.
 * Le remplacement est limité au modèle ATH afin de préserver les autres modèles.
 */
const ATH_VAHLOUL_SWISS_PALETTE: Readonly<Record<string, string>> = {
  "#172033": "#342e31",
  "#9b563e": "#e0301f",
  "#faf8f5": "#f7f5f2",
  "#f5b98f": "#f4f1ec",
  "#e8e2d9": "#eeeae4",
  "#263653": "#59634c",
  "#52657b": "#7b8770",
  "#e6ebf2": "#f4f1ec",
  "#526070": "#687454",
  "#f3eee8": "#f8e9ed",
  "#f7f4ef": "#eef2e8",
  "#e5ddd2": "#ddd8d2",
};

function applyAthVahloulSwissPalette(value: string): string {
  return Object.entries(ATH_VAHLOUL_SWISS_PALETTE).reduce(
    (result, [from, to]) => result.replaceAll(from, to),
    value,
  );
}

const athVahloulTemplate = INDEPENDENT_SITE_TEMPLATES[0] as unknown as IndependentSiteTemplate;
athVahloulTemplate.theme = {
  ...athVahloulTemplate.theme,
  primaryColor: "#342e31",
  accentColor: "#e0301f",
  backgroundColor: "#f7f5f2",
};
athVahloulTemplate.pages.forEach((page) => {
  page.css = applyAthVahloulSwissPalette(page.css);
  page.html = applyAthVahloulSwissPalette(page.html);
});
// ---------------------------------------------------------------------------
// 7. Recherche & Filtrage de la Bibliothèque Professionnelle + Outils SEO
// ---------------------------------------------------------------------------

export const INDEPENDENT_BLOCK_CATEGORIES: ReadonlyArray<IndependentBuilderBlock["category"]> = [
  "Code",
  "Navigation & Structure",
  "Hero & Bannières",
  "Textes & Actions",
  "Images & Médias",
  "Cartes & Grilles",
  "Confiance & Contenu",
  "Contact & Décoration",
] as const;

export const INDEPENDENT_MODULE_CATEGORIES: ReadonlyArray<IndependentBuilderModule["category"]> = [
  "Vie Associative & Familiale",
  "Interactions & Médias",
  "Information & Services",
] as const;

function normalizeSearchQuery(raw?: string | null): string {
  return (raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesNormalizedSearch(query: string, fields: Array<string | undefined | null>): boolean {
  if (!query) return true;
  return fields.some((field) => normalizeSearchQuery(field).includes(query));
}

export function filterIndependentBlocks(options?: {
  search?: string;
  category?: IndependentBuilderBlock["category"] | "all";
}): IndependentBuilderBlock[] {
  const q = normalizeSearchQuery(options?.search);
  const cat = options?.category && options.category !== "all" ? options.category : null;
  return INDEPENDENT_BUILDER_BLOCKS.filter((block) => {
    if (cat && block.category !== cat) return false;
    return matchesNormalizedSearch(q, [block.label, block.category, block.description, block.id]);
  });
}

export function filterIndependentModules(options?: {
  search?: string;
  category?: IndependentBuilderModule["category"] | "all";
}): IndependentBuilderModule[] {
  const q = normalizeSearchQuery(options?.search);
  const cat = options?.category && options.category !== "all" ? options.category : null;
  return INDEPENDENT_BUILDER_MODULES.filter((mod) => {
    if (cat && mod.category !== cat) return false;
    return matchesNormalizedSearch(q, [mod.label, mod.category, mod.description, mod.id]);
  });
}

export function filterIndependentSocles(options?: {
  search?: string;
  siteType?: IndependentSiteType | "all";
}): IndependentPageSocle[] {
  const q = normalizeSearchQuery(options?.search);
  const typeFilter = options?.siteType && options.siteType !== "all" ? options.siteType : null;
  return INDEPENDENT_PAGE_SOCLES.filter((socle) => {
    if (typeFilter && socle.siteType !== typeFilter) return false;
    return matchesNormalizedSearch(q, [socle.label, socle.description, socle.defaultSlug, socle.siteType]);
  });
}

export function filterIndependentTemplates(options?: {
  search?: string;
  siteType?: IndependentSiteType | "all";
}): IndependentSiteTemplate[] {
  const q = normalizeSearchQuery(options?.search);
  const typeFilter = options?.siteType && options.siteType !== "all" ? options.siteType : null;
  return INDEPENDENT_SITE_TEMPLATES.filter((tpl) => {
    if (typeFilter && tpl.siteType !== typeFilter) return false;
    return matchesNormalizedSearch(q, [
      tpl.name,
      tpl.categoryLabel,
      tpl.tagline,
      tpl.description,
      tpl.siteType,
    ]);
  });
}

export interface PageImageAltSummary {
  index: number;
  src: string;
  alt: string;
  hasAlt: boolean;
}

export function extractImagesFromPageHtml(html: string): PageImageAltSummary[] {
  const results: PageImageAltSummary[] = [];
  const imgRegex = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = imgRegex.exec(html || "")) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const altMatch = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const src = (srcMatch?.[1] ?? srcMatch?.[2] ?? "").trim();
    const alt = (altMatch?.[1] ?? altMatch?.[2] ?? "").trim();
    results.push({
      index,
      src,
      alt,
      hasAlt: alt.length > 0,
    });
    index += 1;
  }
  return results;
}

export function updateImageAltInPageHtml(html: string, targetIndex: number, nextAlt: string): string {
  const safeAlt = sanitizeBuilderText(nextAlt, 180).replace(/"/g, "&quot;");
  let currentIndex = 0;
  return (html || "").replace(/<img\b[^>]*>/gi, (tag) => {
    if (currentIndex !== targetIndex) {
      currentIndex += 1;
      return tag;
    }
    currentIndex += 1;
    if (/\balt\s*=\s*(?:"[^"]*"|'[^']*')/i.test(tag)) {
      return tag.replace(/\balt\s*=\s*(?:"[^"]*"|'[^']*')/i, `alt="${safeAlt}"`);
    }
    return tag.replace(/^<img\b/i, `<img alt="${safeAlt}"`);
  });
}

export function buildPageSeoPreview(
  page: IndependentSitePage,
  siteSlug: string,
  customHostname?: string | null
): {
  displayTitle: string;
  displayDescription: string;
  canonicalUrl: string;
  robotsDirective: "index, follow" | "noindex, nofollow";
  socialImageUrl: string;
  imagesTotal: number;
  imagesMissingAlt: number;
  recommendations: string[];
} {
  const cleanTitle = (page.seoTitle || page.title || "Page sans titre").trim();
  const cleanDesc = (
    page.seoDescription ||
    "Ajoutez une description courte (120 à 160 caractères) pour présenter cette page dans les moteurs de recherche."
  ).trim();
  const baseHost = customHostname?.trim()
    ? `https://${customHostname.trim()}`
    : `https://sites.mazigho.com/sites/${slugifyIndependentSite(siteSlug || "mon-site")}`;
  const normalizedSlug = normalizeIndependentPageSlug(page.slug);
  const canonicalUrl = normalizedSlug === "/" ? baseHost : `${baseHost}${normalizedSlug}`;
  const isIndexable = page.indexable !== false && page.visibility === "public";
  const images = extractImagesFromPageHtml(page.html);
  const imagesMissingAlt = images.filter((img) => !img.hasAlt).length;

  const recommendations: string[] = [];
  if (cleanTitle.length < 15) {
    recommendations.push("Le titre SEO est court : visez entre 35 et 60 caractères.");
  } else if (cleanTitle.length > 65) {
    recommendations.push("Le titre SEO dépasse 65 caractères et risque d’être tronqué.");
  }
  if (!page.seoDescription || page.seoDescription.trim().length < 50) {
    recommendations.push("Complétez la description SEO (idéalement entre 100 et 160 caractères).");
  }
  if (imagesMissingAlt > 0) {
    recommendations.push(
      `${imagesMissingAlt} image(s) sur cette page n’ont pas encore de texte alternatif (alt).`
    );
  }

  return {
    displayTitle: cleanTitle.slice(0, 70),
    displayDescription: cleanDesc.slice(0, 170),
    canonicalUrl,
    robotsDirective: isIndexable ? "index, follow" : "noindex, nofollow",
    socialImageUrl: sanitizeBuilderImageSrc(page.socialImageUrl || DEFAULT_CARD_SVG),
    imagesTotal: images.length,
    imagesMissingAlt,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// 8. Helpers de Création de Projet, Domaines Personnalisés & Gardes de Sécurité
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

// ---------------------------------------------------------------------------
// 9. Parcours Professionnel : État du Projet, Filet de Sécurité Local,
//    Aides Contextuelles, Prévisualisation & Robustesse
// ---------------------------------------------------------------------------

export type IndependentProjectMode = "site_vitrine" | "boutique_hybride";

export interface IndependentProjectModeOption {
  value: IndependentProjectMode;
  label: "Site vitrine" | "Boutique hybride";
  shortDescription: string;
  detailedHelp: string;
}

export const INDEPENDENT_PROJECT_MODE_OPTIONS: ReadonlyArray<IndependentProjectModeOption> = [
  {
    value: "site_vitrine",
    label: "Site vitrine",
    shortDescription: "Site de présentation sans vente en ligne obligatoire.",
    detailedHelp:
      "Idéal pour présenter une association, une famille, un cabinet, un artisan, un événement ou des services sans catalogue marchand ni panier.",
  },
  {
    value: "boutique_hybride",
    label: "Boutique hybride",
    shortDescription: "Site éditorial combinant pages de présentation et vitrine d’offres.",
    detailedHelp:
      "Permet d’associer des pages éditoriales riches (histoire, valeurs, réalisations, prise de contact) à une présentation d’offres ou de créations, tout en restant géré de façon 100 % indépendante de Studio MAZIGHO.",
  },
] as const;

export function resolveIndependentProjectMode(
  siteType?: IndependentSiteType | null,
  explicitMode?: IndependentProjectMode | null
): IndependentProjectMode {
  if (explicitMode === "site_vitrine" || explicitMode === "boutique_hybride") {
    return explicitMode;
  }
  void siteType;
  return "site_vitrine";
}

export const INDEPENDENT_BUILDER_HELP_GUIDES = {
  libraryRoles: {
    bloc: {
      title: "Qu’est-ce qu’un Bloc ?",
      description:
        "Une brique visuelle simple (bannière Hero, texte, image, grille de cartes « + », bouton, FAQ) que vous insérez où vous voulez dans la page active.",
    },
    module: {
      title: "Qu’est-ce qu’un Module ?",
      description:
        "Un composant fonctionnel déjà structuré (calendrier d’événements, formulaire de participation, annuaire de prêt de matériel, trombinoscope, galerie commentée).",
    },
    socle: {
      title: "Qu’est-ce qu’un Socle ?",
      description:
        "La structure complète d’une seule page (ex. page Accueil, page Famille, page Contact) qui remplace le contenu de la page en cours pour démarrer rapidement.",
    },
    modele: {
      title: "Qu’est-ce qu’un Modèle ?",
      description:
        "Un site internet complet comprenant plusieurs pages déjà reliées entre elles par un menu, un thème de couleurs et des contenus prêts à personnaliser.",
    },
  },
  workflowActions: {
    sauvegarder: {
      title: "Sauvegarder (Enregistrer)",
      description:
        "Enregistre votre travail dans votre espace privé et crée un point de sauvegarde sans modifier ce que voient vos visiteurs publics.",
    },
    previsualiser: {
      title: "Prévisualiser (Aperçu privé)",
      description:
        "Ouvre un aperçu privé pour tester votre site sur ordinateur, tablette et mobile. Une prévisualisation n’est jamais une publication réelle.",
    },
    publier: {
      title: "Publier en ligne",
      description:
        "Met officiellement votre site à jour sur son adresse publique (/sites/:slug) après confirmation explicite de votre part.",
    },
  },
  projectModes: {
    site_vitrine:
      "Mode Site vitrine : conçu pour présenter une activité, une association, une famille, un événement ou des services sans vente en ligne.",
    boutique_hybride:
      "Mode Boutique hybride : conçu pour associer des pages éditoriales complètes à une vitrine d’offres ou de prestations, sans dépendre du moteur de caisse e-commerce.",
  },
  separationNotice:
    "Ce constructeur indépendant est strictement séparé du constructeur boutique Studio MAZIGHO : vos créations, sauvegardes et publications ici ne touchent jamais à vos boutiques e-commerce, à vos commandes, à vos stocks ni au site public ATH VAHLOUL.",
} as const;

export function formatIndependentBuilderErrorMessage(rawError: unknown): string {
  const message =
    typeof rawError === "string"
      ? rawError.trim()
      : rawError instanceof Error
        ? rawError.message.trim()
        : "";

  if (!message) {
    return "Une erreur est survenue lors de l’opération. Vos modifications restent présentes dans l’éditeur : vous pouvez réessayer.";
  }

  if (message.includes("INDEPENDENT_SITE_SECRET_DETECTED")) {
    return "Sauvegarde refusée par sécurité : une clé secrète ou un jeton privé a été détecté dans le contenu. Supprimez toute donnée sensible avant d’enregistrer.";
  }
  if (message.includes("INDEPENDENT_SITE_ECOMMERCE_DEPENDENCY_FORBIDDEN")) {
    return "Action refusée : ce constructeur indépendant ne peut pas contenir de composant lié au panier, au stock ou au paiement e-commerce.";
  }
  if (message.includes("INDEPENDENT_SITE_EMPTY_PAGES_FORBIDDEN")) {
    return "Sauvegarde impossible : votre site doit comporter au moins une page.";
  }
  if (message.includes("INDEPENDENT_SITE_NOT_FOUND")) {
    return "Ce projet est introuvable ou vous n’avez pas l’autorisation de le modifier.";
  }
  if (message.includes("INDEPENDENT_SITE_DOMAIN_DNS_NOT_VERIFIED")) {
    return "Vérification DNS incomplète : l’enregistrement TXT n’est pas encore visible sur votre domaine. Patientez quelques minutes après l’ajout chez votre hébergeur DNS puis réessayez.";
  }
  if (/UNAUTHORIZED|401|non connect|authentication|login/i.test(message)) {
    return "Vous n’êtes pas connecté ou votre session a expiré. Vos modifications restent affichées à l’écran : reconnectez-vous avant de sauvegarder.";
  }
  if (/network|fetch|timeout|ECONN|503|502|504/i.test(message)) {
    return "La sauvegarde est anormalement lente ou la connexion a été interrompue. Vos modifications sont conservées localement en filet de sécurité : cliquez sur « Enregistrer » pour réessayer.";
  }

  return message;
}

export type IndependentWorkflowLifecycleStatus =
  | "brouillon"
  | "sauvegarde"
  | "publie"
  | "archive";

export interface IndependentProjectWorkflowInput {
  projectId: number | null;
  title: string;
  siteType: IndependentSiteType;
  projectMode?: IndependentProjectMode | null;
  status: IndependentSiteStatus;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  saveError?: string | null;
}

export interface IndependentProjectWorkflowSummary {
  projectTitle: string;
  projectMode: IndependentProjectMode;
  projectModeLabel: "Site vitrine" | "Boutique hybride";
  workflowStatus: IndependentWorkflowLifecycleStatus;
  workflowStatusLabel: "Brouillon" | "Sauvegardé" | "Publié" | "Archivé";
  statusDetailLabel: string;
  hasUnsavedChanges: boolean;
  unsavedIndicatorLabel: string;
  lastSavedLabel: string;
  savingInProgressMessage: string | null;
  saveSuccessMessage: string | null;
  saveErrorMessage: string | null;
  canTriggerSave: boolean;
}

export function computeIndependentProjectWorkflowState(
  input: IndependentProjectWorkflowInput
): IndependentProjectWorkflowSummary {
  const safeTitle = sanitizeBuilderText(input.title || "Mon Site Internet", 160) || "Mon Site Internet";
  const projectMode = resolveIndependentProjectMode(input.siteType, input.projectMode);
  const projectModeLabel =
    projectMode === "boutique_hybride" ? "Boutique hybride" : "Site vitrine";

  let workflowStatus: IndependentWorkflowLifecycleStatus = "brouillon";
  let workflowStatusLabel: "Brouillon" | "Sauvegardé" | "Publié" | "Archivé" = "Brouillon";
  let statusDetailLabel = "Brouillon en cours d’édition";

  if (input.status === "published") {
    workflowStatus = "publie";
    workflowStatusLabel = "Publié";
    statusDetailLabel = input.hasUnsavedChanges
      ? "Publié en ligne · Modifications locales non enregistrées"
      : "Publié en ligne et à jour";
  } else if (input.status === "archived") {
    workflowStatus = "archive";
    workflowStatusLabel = "Archivé";
    statusDetailLabel = "Projet archivé (non visible publiquement)";
  } else if (!input.hasUnsavedChanges && (Boolean(input.projectId) || Boolean(input.lastSavedAt))) {
    workflowStatus = "sauvegarde";
    workflowStatusLabel = "Sauvegardé";
    statusDetailLabel = "Brouillon sauvegardé (non publié)";
  } else {
    workflowStatus = "brouillon";
    workflowStatusLabel = "Brouillon";
    statusDetailLabel = input.hasUnsavedChanges
      ? "Brouillon avec modifications non enregistrées"
      : "Nouveau brouillon non enregistré";
  }

  const unsavedIndicatorLabel = input.hasUnsavedChanges
    ? "Modifications non enregistrées"
    : "Toutes les modifications sont enregistrées";

  const lastSavedLabel = input.lastSavedAt
    ? `Dernière sauvegarde : ${input.lastSavedAt}`
    : "Aucune sauvegarde enregistrée durant cette session";

  const savingInProgressMessage = input.isSaving
    ? "Sauvegarde en cours… Veuillez patienter pendant l’enregistrement de vos pages."
    : null;

  const saveSuccessMessage =
    !input.isSaving && !input.hasUnsavedChanges && input.lastSavedAt && !input.saveError
      ? `Sauvegarde confirmée (${input.lastSavedAt}) pour « ${safeTitle} ».`
      : null;

  const saveErrorMessage = input.saveError
    ? formatIndependentBuilderErrorMessage(input.saveError)
    : null;

  return {
    projectTitle: safeTitle,
    projectMode,
    projectModeLabel,
    workflowStatus,
    workflowStatusLabel,
    statusDetailLabel,
    hasUnsavedChanges: input.hasUnsavedChanges,
    unsavedIndicatorLabel,
    lastSavedLabel,
    savingInProgressMessage,
    saveSuccessMessage,
    saveErrorMessage,
    canTriggerSave: !input.isSaving,
  };
}

/**
 * Garantit qu'un projet vide (0 page) dispose toujours d'au moins une page d'accueil saine
 * afin d'éviter toute erreur de rendu dans l'éditeur ou l'aperçu.
 */
export function ensureNonEmptyIndependentPages(
  pages: ReadonlyArray<IndependentSitePage> | null | undefined,
  siteTitle = "Mon Site Internet"
): IndependentSitePage[] {
  if (Array.isArray(pages) && pages.length > 0) {
    return pages.map((page, index) => ({
      ...page,
      id: page.id || `page-${index + 1}`,
      title: sanitizeBuilderText(page.title || `Page ${index + 1}`, 140) || `Page ${index + 1}`,
      slug: normalizeIndependentPageSlug(page.slug || (index === 0 ? "/" : `/page-${index + 1}`)),
      parentPageId: page.parentPageId ?? null,
      showInMenu: page.showInMenu !== false,
      menuOrder: typeof page.menuOrder === "number" ? page.menuOrder : index + 1,
      visibility: page.visibility || "public",
      seoTitle: sanitizeBuilderText(
        page.seoTitle || `${page.title || `Page ${index + 1}`} | ${siteTitle}`,
        180
      ),
      seoDescription: sanitizeBuilderText(page.seoDescription || "", 320),
      socialImageUrl: page.socialImageUrl
        ? sanitizeBuilderImageSrc(page.socialImageUrl)
        : undefined,
      indexable: page.indexable !== false,
      html: sanitizeIndependentHtml(page.html || INDEPENDENT_PAGE_SOCLES[0].html),
      css: sanitizeIndependentCss(
        page.css || "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }"
      ),
    }));
  }

  const safeTitle = sanitizeBuilderText(siteTitle || "Mon Site Internet", 140) || "Mon Site Internet";
  const defaultSocle = INDEPENDENT_PAGE_SOCLES[0];
  return [
    {
      id: "page-accueil",
      title: "Accueil",
      slug: "/",
      parentPageId: null,
      showInMenu: true,
      menuOrder: 1,
      visibility: "public",
      seoTitle: `Accueil | ${safeTitle}`,
      seoDescription: defaultSocle.description,
      indexable: true,
      html: defaultSocle.html,
      css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
    },
  ];
}

export interface IndependentBuilderLocalSafetySnapshot {
  version: 1;
  siteId: number | null;
  slug: string;
  title: string;
  siteType: IndependentSiteType;
  projectMode: IndependentProjectMode;
  pages: IndependentSitePage[];
  reusableBlocks: IndependentSiteReusableBlock[];
  activePageId: string;
  savedAtIso: string;
}

export function buildLocalSafetyStorageKey(siteId: number | null, slug?: string): string {
  if (typeof siteId === "number" && Number.isFinite(siteId) && siteId > 0) {
    return `mazigho_independent_builder_safety_v1:site-${siteId}`;
  }
  return `mazigho_independent_builder_safety_v1:draft-${slugifyIndependentSite(slug || "nouveau-site")}`;
}

export function createLocalSafetySnapshot(
  input: {
    siteId: number | null;
    slug: string;
    title: string;
    siteType: IndependentSiteType;
    projectMode?: IndependentProjectMode;
    pages: ReadonlyArray<IndependentSitePage>;
    reusableBlocks?: ReadonlyArray<IndependentSiteReusableBlock>;
    activePageId?: string;
  },
  nowIso = new Date().toISOString()
): IndependentBuilderLocalSafetySnapshot {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const safeTitle = sanitizeBuilderText(input.title || "Mon Site Internet", 160) || "Mon Site Internet";
  const safePages = ensureNonEmptyIndependentPages(input.pages, safeTitle);
  const safeBlocks: IndependentSiteReusableBlock[] = (input.reusableBlocks ?? []).map((b, i) => ({
    id: b.id || `reusable-${i + 1}`,
    name: sanitizeBuilderText(b.name || `Bloc #${i + 1}`, 140),
    category: sanitizeBuilderText(b.category || "Mes blocs", 80),
    html: sanitizeIndependentHtml(b.html),
    createdAt: b.createdAt || nowIso,
  }));
  const activePageId =
    safePages.find((p) => p.id === input.activePageId)?.id ?? safePages[0].id;

  return {
    version: 1,
    siteId: input.siteId ?? null,
    slug: slugifyIndependentSite(input.slug || safeTitle),
    title: safeTitle,
    siteType: input.siteType || "vitrine",
    projectMode: resolveIndependentProjectMode(input.siteType, input.projectMode),
    pages: safePages,
    reusableBlocks: safeBlocks,
    activePageId,
    savedAtIso: nowIso,
  };
}

/**
 * Détermine si un filet de sécurité local temporaire doit être proposé à la restauration.
 * La restauration est toujours explicite et contrôlée par l'utilisateur, jamais automatique ni silencieuse.
 */
export function shouldOfferLocalSafetyRestore(
  snapshot: IndependentBuilderLocalSafetySnapshot | null | undefined,
  serverProject: {
    id: number;
    title: string;
    updatedAt?: string | null;
    pages: ReadonlyArray<IndependentSitePage>;
  } | null
): boolean {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.pages) || snapshot.pages.length === 0) {
    return false;
  }
  if (!serverProject) {
    return true;
  }
  if (snapshot.siteId !== null && snapshot.siteId !== serverProject.id) {
    return false;
  }

  const serverSignature = JSON.stringify(
    serverProject.pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      html: p.html,
      css: p.css,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    }))
  );
  const localSignature = JSON.stringify(
    snapshot.pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      html: p.html,
      css: p.css,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    }))
  );

  if (serverSignature === localSignature && snapshot.title === serverProject.title) {
    return false;
  }

  return true;
}

export function buildEditorPreviewUrl(options: {
  slug: string;
  siteId?: number | null;
  pageSlug?: string | null;
}): string {
  const safeSlug = slugifyIndependentSite(options.slug || "association-familiale-ath-vahloul");
  const params = new URLSearchParams();
  if (typeof options.siteId === "number" && options.siteId > 0) {
    params.set("siteId", String(options.siteId));
  }
  if (options.pageSlug) {
    params.set("page", normalizeIndependentPageSlug(options.pageSlug));
  }
  const qs = params.toString();
  return `/constructeur-sites/apercu/${safeSlug}${qs ? `?${qs}` : ""}`;
}

export function buildPreviewReturnUrl(options?: {
  siteId?: number | null;
  slug?: string | null;
  pageSlug?: string | null;
}): string {
  const params = new URLSearchParams();
  if (typeof options?.siteId === "number" && options.siteId > 0) {
    params.set("siteId", String(options.siteId));
  } else if (options?.slug) {
    params.set("slug", slugifyIndependentSite(options.slug));
  }
  if (options?.pageSlug) {
    params.set("page", normalizeIndependentPageSlug(options.pageSlug));
  }
  const qs = params.toString();
  return `/constructeur-sites${qs ? `?${qs}` : ""}`;
}

export function parseBuilderQueryParams(search: string): {
  siteId: number | null;
  slug: string | null;
  pageSlug: string | null;
  previewToken?: string | null;
} {
  const cleanSearch = (search || "").startsWith("?") ? search.slice(1) : search || "";
  const params = new URLSearchParams(cleanSearch);
  const rawSiteId = params.get("siteId");
  const parsedId = rawSiteId && /^\d+$/.test(rawSiteId) ? Number(rawSiteId) : null;
  const rawSlug = params.get("slug");
  const rawPage = params.get("page");
  const rawToken = params.get("previewToken") || params.get("shareToken");
  const baseResult: {
    siteId: number | null;
    slug: string | null;
    pageSlug: string | null;
    previewToken?: string | null;
  } = {
    siteId: parsedId && parsedId > 0 ? parsedId : null,
    slug: rawSlug ? slugifyIndependentSite(rawSlug) : null,
    pageSlug: rawPage ? normalizeIndependentPageSlug(rawPage) : null,
  };
  if (rawToken) {
    baseResult.previewToken = sanitizeBuilderText(rawToken, 128);
  }
  return baseResult;
}

export interface IndependentSiteSelectionCandidate {
  id: number;
  slug: string;
  updatedAt?: string | Date | null;
}

/**
 * Résout de manière déterministe le site actif uniquement parmi la liste de projets
 * autorisés retournée par le serveur (préserve strictement l'isolation par siteId).
 */
export function resolveInitialIndependentSiteId(input: {
  projects: ReadonlyArray<IndependentSiteSelectionCandidate>;
  currentSiteId?: number | null;
  requestedSiteId?: number | null;
  requestedSlug?: string | null;
  storedSiteId?: number | null;
  preferredSlug?: string | null;
}): number | null {
  const validProjects = (input.projects || []).filter(
    (project) => Number.isInteger(project.id) && project.id > 0,
  );
  if (validProjects.length === 0) return null;

  const byId = new Map<number, IndependentSiteSelectionCandidate>();
  const bySlug = new Map<string, IndependentSiteSelectionCandidate>();
  for (const project of validProjects) {
    byId.set(project.id, project);
    const normalizedSlug = (project.slug || "").trim().toLowerCase();
    if (normalizedSlug && !bySlug.has(normalizedSlug)) {
      bySlug.set(normalizedSlug, project);
    }
  }

  if (input.currentSiteId && byId.has(input.currentSiteId)) {
    return input.currentSiteId;
  }
  if (input.requestedSiteId && byId.has(input.requestedSiteId)) {
    return input.requestedSiteId;
  }
  const cleanRequestedSlug = (input.requestedSlug || "").trim().toLowerCase();
  if (cleanRequestedSlug && bySlug.has(cleanRequestedSlug)) {
    return bySlug.get(cleanRequestedSlug)!.id;
  }
  if (input.storedSiteId && byId.has(input.storedSiteId)) {
    return input.storedSiteId;
  }
  const cleanPreferredSlug = (input.preferredSlug || "").trim().toLowerCase();
  if (cleanPreferredSlug && bySlug.has(cleanPreferredSlug)) {
    return bySlug.get(cleanPreferredSlug)!.id;
  }
  return validProjects[0].id;
}

export function buildIndependentBuilderSelectionUrl(
  currentSearch: string,
  siteId: number | null,
): string {
  const cleanSearch = (currentSearch || "").startsWith("?")
    ? currentSearch.slice(1)
    : currentSearch || "";
  const params = new URLSearchParams(cleanSearch);
  params.delete("siteSlug");
  params.delete("slug");
  if (typeof siteId === "number" && Number.isInteger(siteId) && siteId > 0) {
    params.set("siteId", String(siteId));
  } else {
    params.delete("siteId");
  }
  const qs = params.toString();
  return `/constructeur-sites${qs ? `?${qs}` : ""}`;
}

// ---------------------------------------------------------------------------
// 10. PHASE 2 — Historique & Versions, Duplication, Import/Export JSON,
//     Checklist Publication, Audit SEO / Accessibilité / Responsive,
//     Médias enrichis, Modèles Navigation & Footer, Collaboration contrôlée,
//     Journal de Publication, Protection Contenu Démo & Qualité du Site
// ---------------------------------------------------------------------------

/**
 * 1. HISTORIQUE ET VERSIONS — Aperçu détaillé d'une version et détection de sauvegarde importante
 */
export interface IndependentVersionPreviewSummary {
  versionNumber: number;
  label: string;
  authorLabel: string;
  createdAt: string;
  pageCount: number;
  pageTitles: string[];
  reusableBlockCount: number;
  diffWithCurrent: {
    addedPages: string[];
    removedPages: string[];
    modifiedPages: string[];
    hasDifferences: boolean;
  };
}

export function shouldAutoCreateVersionOnSave(
  previousPages: ReadonlyArray<IndependentSitePage>,
  nextPages: ReadonlyArray<IndependentSitePage>,
  previousTitle: string,
  nextTitle: string
): { shouldCreate: boolean; autoLabel: string } {
  if (previousPages.length !== nextPages.length) {
    return {
      shouldCreate: true,
      autoLabel: `Sauvegarde automatique (${nextPages.length} pages)`,
    };
  }
  if (previousTitle.trim() !== nextTitle.trim()) {
    return {
      shouldCreate: true,
      autoLabel: `Renommage du site (« ${sanitizeBuilderText(nextTitle, 80)} »)`,
    };
  }
  let changedPagesCount = 0;
  let significantHtmlDelta = 0;
  for (let i = 0; i < nextPages.length; i += 1) {
    const prev = previousPages[i];
    const next = nextPages[i];
    if (!prev || prev.slug !== next.slug || prev.title !== next.title) {
      changedPagesCount += 1;
    } else if (prev.html !== next.html || prev.css !== next.css) {
      changedPagesCount += 1;
      significantHtmlDelta += Math.abs((next.html || "").length - (prev.html || "").length);
    }
  }
  if (changedPagesCount > 0 && (significantHtmlDelta >= 120 || changedPagesCount >= 1)) {
    return {
      shouldCreate: true,
      autoLabel: `Sauvegarde importante (${changedPagesCount} page(s) modifiée(s))`,
    };
  }
  return {
    shouldCreate: false,
    autoLabel: "",
  };
}

export function buildIndependentVersionPreview(
  version: {
    versionNumber: number;
    label: string;
    ownerUserId?: number;
    authorName?: string;
    createdAt: string;
    snapshot: {
      title: string;
      pages: ReadonlyArray<IndependentSitePage>;
      reusableBlocks?: ReadonlyArray<IndependentSiteReusableBlock>;
    };
  },
  currentPages: ReadonlyArray<IndependentSitePage>
): IndependentVersionPreviewSummary {
  const verPages = version.snapshot.pages || [];
  const currentBySlug = new Map(currentPages.map((p) => [p.slug, p]));
  const versionBySlug = new Map(verPages.map((p) => [p.slug, p]));

  const addedPages: string[] = [];
  const removedPages: string[] = [];
  const modifiedPages: string[] = [];

  for (const vp of verPages) {
    const curr = currentBySlug.get(vp.slug);
    if (!curr) {
      addedPages.push(`${vp.title} (${vp.slug})`);
    } else if (curr.html !== vp.html || curr.css !== vp.css || curr.title !== vp.title) {
      modifiedPages.push(`${vp.title} (${vp.slug})`);
    }
  }
  for (const cp of currentPages) {
    if (!versionBySlug.has(cp.slug)) {
      removedPages.push(`${cp.title} (${cp.slug})`);
    }
  }

  return {
    versionNumber: version.versionNumber,
    label: version.label || `Version v${version.versionNumber}`,
    authorLabel:
      version.authorName ||
      (version.ownerUserId ? `Propriétaire #${version.ownerUserId}` : "Propriétaire du site"),
    createdAt: version.createdAt,
    pageCount: verPages.length,
    pageTitles: verPages.map((p) => `${p.title} (${p.slug})`),
    reusableBlockCount: version.snapshot.reusableBlocks?.length ?? 0,
    diffWithCurrent: {
      addedPages,
      removedPages,
      modifiedPages,
      hasDifferences:
        addedPages.length > 0 || removedPages.length > 0 || modifiedPages.length > 0,
    },
  };
}

/**
 * 2. DUPLICATION — Page, Bloc réutilisable et Génération de slug unique
 */
export function generateUniquePageSlug(
  desiredSlugOrTitle: string,
  existingPages: ReadonlyArray<Pick<IndependentSitePage, "slug">>
): string {
  const existingSet = new Set(existingPages.map((p) => normalizeIndependentPageSlug(p.slug)));
  const rawBase = normalizeIndependentPageSlug(desiredSlugOrTitle);
  const baseSlug = rawBase === "/" ? "/accueil-copie" : rawBase;
  if (!existingSet.has(baseSlug)) {
    return baseSlug;
  }
  let counter = 2;
  while (existingSet.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

export function duplicateIndependentPageInList(
  pages: ReadonlyArray<IndependentSitePage>,
  sourcePageId: string,
  requestedNewTitle?: string
): { pages: IndependentSitePage[]; duplicatedPage: IndependentSitePage } {
  const safeList = ensureNonEmptyIndependentPages(pages);
  const source = safeList.find((p) => p.id === sourcePageId);
  if (!source) {
    throw new Error("INDEPENDENT_SITE_PAGE_NOT_FOUND");
  }

  const baseTitle = sanitizeBuilderText(
    requestedNewTitle?.trim() || `${source.title} (copie)`,
    140
  );
  const uniqueSlug = generateUniquePageSlug(
    requestedNewTitle?.trim() ? requestedNewTitle : `${source.slug === "/" ? "accueil" : source.slug}-copie`,
    safeList
  );
  const duplicatedPage: IndependentSitePage = {
    ...JSON.parse(JSON.stringify(source)),
    id: `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: baseTitle,
    slug: uniqueSlug,
    menuOrder: safeList.length + 1,
    seoTitle: sanitizeBuilderText(`${baseTitle}`, 180),
    html: sanitizeIndependentHtml(source.html),
    css: sanitizeIndependentCss(source.css),
  };

  return {
    pages: [...safeList, duplicatedPage],
    duplicatedPage,
  };
}

export function duplicateIndependentReusableBlockInList(
  blocks: ReadonlyArray<IndependentSiteReusableBlock>,
  sourceBlockId: string,
  requestedNewName?: string
): {
  reusableBlocks: IndependentSiteReusableBlock[];
  duplicatedBlock: IndependentSiteReusableBlock;
} {
  const source = blocks.find((b) => b.id === sourceBlockId);
  if (!source) {
    throw new Error("INDEPENDENT_SITE_REUSABLE_BLOCK_NOT_FOUND");
  }
  const cleanName = sanitizeBuilderText(
    requestedNewName?.trim() || `${source.name} (copie)`,
    140
  );
  const duplicatedBlock: IndependentSiteReusableBlock = {
    id: `reusable-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    category: sanitizeBuilderText(source.category || "Mes blocs", 80),
    html: sanitizeIndependentHtml(source.html),
    createdAt: new Date().toISOString(),
  };
  return {
    reusableBlocks: [duplicatedBlock, ...blocks],
    duplicatedBlock,
  };
}

/**
 * 3. IMPORT ET EXPORT CONTRÔLÉ JSON VERSIONNÉ
 */
export const INDEPENDENT_SITE_EXPORT_FORMAT = "mazigho-independent-site-export" as const;
export const INDEPENDENT_SITE_EXPORT_SCHEMA_VERSION = 1 as const;
export const INDEPENDENT_SITE_EXPORT_MAX_BYTES = 1_500_000; // 1.5 MB max

export interface IndependentSiteExportPackageV1 {
  format: typeof INDEPENDENT_SITE_EXPORT_FORMAT;
  schemaVersion: typeof INDEPENDENT_SITE_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  demoNotice: string;
  project: {
    title: string;
    slug: string;
    siteType: IndependentSiteType;
    projectMode: IndependentProjectMode;
    templateId: string | null;
    theme: IndependentSiteThemeConfig;
    navigation: IndependentSiteMenuItem[];
    pages: IndependentSitePage[];
    reusableBlocks: IndependentSiteReusableBlock[];
  };
}

export function exportIndependentSiteProjectToJson(input: {
  title: string;
  slug: string;
  siteType: IndependentSiteType;
  projectMode?: IndependentProjectMode | null;
  templateId?: string | null;
  theme?: IndependentSiteThemeConfig | null;
  navigation?: ReadonlyArray<IndependentSiteMenuItem> | null;
  pages: ReadonlyArray<IndependentSitePage>;
  reusableBlocks?: ReadonlyArray<IndependentSiteReusableBlock> | null;
  exportedAt?: string;
}): IndependentSiteExportPackageV1 {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const safeTitle = sanitizeBuilderText(input.title || "Mon Site Indépendant", 160);
  const safeSlug = slugifyIndependentSite(input.slug || safeTitle);
  const safePages = ensureNonEmptyIndependentPages(input.pages, safeTitle);
  const safeBlocks: IndependentSiteReusableBlock[] = (input.reusableBlocks ?? []).map((b, idx) => ({
    id: sanitizeBuilderText(b.id || `rb-${idx + 1}`, 80),
    name: sanitizeBuilderText(b.name || `Bloc #${idx + 1}`, 140),
    category: sanitizeBuilderText(b.category || "Mes blocs", 80),
    html: sanitizeIndependentHtml(b.html),
    createdAt: b.createdAt || new Date().toISOString(),
  }));

  const defaultTheme: IndependentSiteThemeConfig = {
    primaryColor: "#172033",
    accentColor: "#9b563e",
    backgroundColor: "#faf8f5",
    headingFont: "Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
  };

  return {
    format: INDEPENDENT_SITE_EXPORT_FORMAT,
    schemaVersion: INDEPENDENT_SITE_EXPORT_SCHEMA_VERSION,
    exportedAt: input.exportedAt || new Date().toISOString(),
    demoNotice:
      "Archive JSON versionnée de site indépendant MAZIGHO — Export éditorial autonome et nettoyé.",
    project: {
      title: safeTitle,
      slug: safeSlug,
      siteType: input.siteType || "vitrine",
      projectMode: resolveIndependentProjectMode(input.siteType, input.projectMode),
      templateId: input.templateId ?? null,
      theme: input.theme ? { ...defaultTheme, ...input.theme } : defaultTheme,
      navigation:
        input.navigation && input.navigation.length > 0
          ? JSON.parse(JSON.stringify(input.navigation))
          : buildNavigationFromPages(safePages),
      pages: safePages,
      reusableBlocks: safeBlocks,
    },
  };
}

export function validateAndSanitizeIndependentSiteImport(
  rawPayload: string | unknown
): {
  valid: boolean;
  error?: string;
  warnings: string[];
  preview?: {
    title: string;
    slug: string;
    siteType: IndependentSiteType;
    projectMode: IndependentProjectMode;
    pageCount: number;
    pageTitles: string[];
    reusableBlockCount: number;
  };
  sanitizedPackage?: IndependentSiteExportPackageV1;
} {
  const warnings: string[] = [];
  let parsed: unknown = rawPayload;

  if (typeof rawPayload === "string") {
    const byteLength = Buffer.byteLength(rawPayload, "utf8");
    if (byteLength > INDEPENDENT_SITE_EXPORT_MAX_BYTES) {
      return {
        valid: false,
        error: `INDEPENDENT_SITE_IMPORT_TOO_LARGE: Le fichier dépasse la taille maximale autorisée (${Math.round(
          INDEPENDENT_SITE_EXPORT_MAX_BYTES / 1024
        )} Ko).`,
        warnings,
      };
    }
    if (/<script\b|javascript:|onload\s*=|onerror\s*=/i.test(rawPayload)) {
      warnings.push(
        "Des balises ou attributs exécutables ont été détectés dans le fichier importé et neutralisés automatiquement."
      );
    }
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      return {
        valid: false,
        error: "INDEPENDENT_SITE_IMPORT_INVALID_JSON: Le fichier fourni n’est pas un JSON valide.",
        warnings,
      };
    }
  } else {
    const serialized = JSON.stringify(rawPayload ?? {});
    if (Buffer.byteLength(serialized, "utf8") > INDEPENDENT_SITE_EXPORT_MAX_BYTES) {
      return {
        valid: false,
        error: "INDEPENDENT_SITE_IMPORT_TOO_LARGE: Le contenu importé dépasse la limite de taille.",
        warnings,
      };
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      valid: false,
      error: "INDEPENDENT_SITE_IMPORT_INVALID_FORMAT: Structure d’import absente ou invalide.",
      warnings,
    };
  }

  try {
    assertNoSecretsInIndependentSite(parsed);
    assertZeroEcommerceInIndependentSite(parsed);
  } catch (err) {
    return {
      valid: false,
      error:
        err instanceof Error
          ? err.message
          : "INDEPENDENT_SITE_IMPORT_FORBIDDEN_CONTENT: Secret ou donnée e-commerce détecté.",
      warnings,
    };
  }

  const candidate = parsed as Partial<IndependentSiteExportPackageV1>;
  if (
    candidate.format !== INDEPENDENT_SITE_EXPORT_FORMAT ||
    candidate.schemaVersion !== INDEPENDENT_SITE_EXPORT_SCHEMA_VERSION ||
    !candidate.project ||
    typeof candidate.project !== "object"
  ) {
    return {
      valid: false,
      error:
        "INDEPENDENT_SITE_IMPORT_UNSUPPORTED_SCHEMA: Format ou version de schéma JSON non reconnu.",
      warnings,
    };
  }

  const proj = candidate.project;
  if (!Array.isArray(proj.pages) || proj.pages.length === 0) {
    return {
      valid: false,
      error: "INDEPENDENT_SITE_IMPORT_EMPTY_PAGES: Le fichier importé ne contient aucune page.",
      warnings,
    };
  }

  const allowedTypes = new Set(INDEPENDENT_SITE_TYPE_OPTIONS.map((t) => t.value));
  const safeSiteType: IndependentSiteType = allowedTypes.has(proj.siteType)
    ? proj.siteType
    : "vitrine";

  const sanitizedPackage = exportIndependentSiteProjectToJson({
    title: proj.title || "Site Importé",
    slug: proj.slug || proj.title || "site-importe",
    siteType: safeSiteType,
    projectMode: proj.projectMode,
    templateId: proj.templateId ?? null,
    theme: proj.theme,
    navigation: proj.navigation,
    pages: proj.pages,
    reusableBlocks: proj.reusableBlocks,
    exportedAt: candidate.exportedAt || new Date().toISOString(),
  });

  return {
    valid: true,
    warnings,
    preview: {
      title: sanitizedPackage.project.title,
      slug: sanitizedPackage.project.slug,
      siteType: sanitizedPackage.project.siteType,
      projectMode: sanitizedPackage.project.projectMode,
      pageCount: sanitizedPackage.project.pages.length,
      pageTitles: sanitizedPackage.project.pages.map((p) => `${p.title} (${p.slug})`),
      reusableBlockCount: sanitizedPackage.project.reusableBlocks.length,
    },
    sanitizedPackage,
  };
}

/**
 * 12. CONTENU DE DÉMONSTRATION — Identification et protection explicite
 */
export const DEMO_CONTENT_NOTICE_LABEL = "Démonstration à personnaliser" as const;

const DEMO_CONTENT_MARKERS: ReadonlyArray<RegExp> = [
  /Démonstration à personnaliser/i,
  /exemple@/i,
  /contact@exemple/i,
  /00\s*00\s*00\s*00/i,
  /lorem ipsum/i,
  /\[À personnaliser\]/i,
  /association-ath-vahloul\.org/i,
  /contact@association-ath-vahloul\.org/i,
];

export interface IndependentDemoContentStatus {
  isDemoTemplate: boolean;
  isStaticAthVahloulException: boolean;
  badgeLabel: typeof DEMO_CONTENT_NOTICE_LABEL | "Contenu personnalisé";
  detectedMarkers: string[];
  hasUnchangedDemoMarkers: boolean;
  noticeMessage: string;
}

export function detectIndependentDemoContentStatus(input: {
  slug: string;
  title: string;
  templateId?: string | null;
  pages: ReadonlyArray<IndependentSitePage>;
}): IndependentDemoContentStatus {
  const normalizedSlug = slugifyIndependentSite(input.slug || input.title);
  const isStaticAthVahloulException =
    normalizedSlug === "association-familiale-ath-vahloul" ||
    input.templateId === ATH_VAHLOUL_DEMO_TEMPLATE_ID;
  const isDemoTemplate =
    Boolean(input.templateId) ||
    INDEPENDENT_SITE_TEMPLATES.some(
      (t) => t.id === input.templateId || t.name.toLowerCase() === (input.title || "").toLowerCase()
    );

  const detectedMarkers: string[] = [];
  for (const page of input.pages || []) {
    const combined = `${page.title} ${page.seoDescription} ${page.html}`;
    for (const marker of DEMO_CONTENT_MARKERS) {
      const m = combined.match(marker);
      if (m && m[0]) {
        const label = `${page.title} : « ${m[0]} »`;
        if (!detectedMarkers.includes(label)) {
          detectedMarkers.push(label);
        }
      }
    }
  }

  const hasUnchangedDemoMarkers = isDemoTemplate || detectedMarkers.length > 0;
  return {
    isDemoTemplate,
    isStaticAthVahloulException,
    badgeLabel: hasUnchangedDemoMarkers ? DEMO_CONTENT_NOTICE_LABEL : "Contenu personnalisé",
    detectedMarkers,
    hasUnchangedDemoMarkers,
    noticeMessage: isStaticAthVahloulException
      ? "Modèle officiel Association familiale ATH VAHLOUL — Démonstration à personnaliser avant mise en ligne d’un nouveau site."
      : hasUnchangedDemoMarkers
        ? "Démonstration à personnaliser : certains textes, coordonnées ou exemples proviennent d’un modèle de départ fictif."
        : "Contenu personnalisé prêt pour vérification.",
  };
}

/**
 * 5. CONTRÔLE SEO PAR PAGE — Distinction erreurs bloquantes vs recommandations
 */
export type AuditIssueSeverity = "bloquant" | "a_corriger" | "conseil";

export interface PageSeoAuditIssue {
  id: string;
  severity: AuditIssueSeverity;
  message: string;
}

export interface PageSeoDetailedAudit {
  pageId: string;
  pageTitle: string;
  slug: string;
  canonicalUrl: string;
  robotsDirective: "index, follow" | "noindex, nofollow";
  displayTitle: string;
  displayDescription: string;
  h1Count: number;
  primaryHeadingText: string | null;
  imagesTotal: number;
  imagesMissingAlt: number;
  isContentEmpty: boolean;
  blockingErrors: PageSeoAuditIssue[];
  warningsToFix: PageSeoAuditIssue[];
  recommendations: PageSeoAuditIssue[];
  score100: number;
}

export function auditIndependentPageSeo(
  page: IndependentSitePage,
  siteSlug: string,
  customHostname?: string | null
): PageSeoDetailedAudit {
  const basePreview = buildPageSeoPreview(page, siteSlug, customHostname);
  const html = page.html || "";
  const textContent = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const isContentEmpty = textContent.length < 20;

  const h1Matches = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi));
  const h1Count = h1Matches.length;
  const primaryHeadingText = h1Matches[0]
    ? h1Matches[0][1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : null;

  const blockingErrors: PageSeoAuditIssue[] = [];
  const warningsToFix: PageSeoAuditIssue[] = [];
  const recommendations: PageSeoAuditIssue[] = [];

  if (!page.title || !page.title.trim()) {
    blockingErrors.push({
      id: "seo-missing-page-title",
      severity: "bloquant",
      message: "Le titre de la page est vide.",
    });
  }
  if (!page.slug || !page.slug.startsWith("/")) {
    blockingErrors.push({
      id: "seo-invalid-slug",
      severity: "bloquant",
      message: "Le slug de la page doit commencer par « / ».",
    });
  }
  if (isContentEmpty) {
    blockingErrors.push({
      id: "seo-empty-content",
      severity: "bloquant",
      message: "Le contenu textuel de la page est vide ou quasi vide (moins de 20 caractères).",
    });
  }

  const seoTitleLen = (page.seoTitle || page.title || "").trim().length;
  if (seoTitleLen === 0) {
    blockingErrors.push({
      id: "seo-missing-seo-title",
      severity: "bloquant",
      message: "Le titre SEO est manquant.",
    });
  } else if (seoTitleLen < 15 || seoTitleLen > 70) {
    recommendations.push({
      id: "seo-title-length",
      severity: "conseil",
      message: `Longueur du titre SEO (${seoTitleLen} caractères) : visez entre 30 et 60 caractères.`,
    });
  }

  const seoDescLen = (page.seoDescription || "").trim().length;
  if (seoDescLen === 0) {
    warningsToFix.push({
      id: "seo-missing-description",
      severity: "a_corriger",
      message: "La description SEO est vide : ajoutez un résumé de 80 à 160 caractères.",
    });
  } else if (seoDescLen < 50 || seoDescLen > 170) {
    recommendations.push({
      id: "seo-description-length",
      severity: "conseil",
      message: `Description SEO (${seoDescLen} caractères) : idéalement entre 80 et 160 caractères.`,
    });
  }

  if (h1Count === 0) {
    warningsToFix.push({
      id: "seo-missing-h1",
      severity: "a_corriger",
      message: "Aucun titre principal <h1> détecté sur cette page.",
    });
  } else if (h1Count > 1) {
    recommendations.push({
      id: "seo-multiple-h1",
      severity: "conseil",
      message: `${h1Count} titres <h1> détectés : privilégiez un seul titre principal <h1> par page.`,
    });
  }

  if (basePreview.imagesMissingAlt > 0) {
    warningsToFix.push({
      id: "seo-images-missing-alt",
      severity: "a_corriger",
      message: `${basePreview.imagesMissingAlt} image(s) sur ${basePreview.imagesTotal} n’ont pas de texte alternatif (alt).`,
    });
  }

  let score100 = 100;
  score100 -= blockingErrors.length * 30;
  score100 -= warningsToFix.length * 12;
  score100 -= recommendations.length * 4;
  score100 = Math.max(0, Math.min(100, score100));

  return {
    pageId: page.id,
    pageTitle: page.title,
    slug: page.slug,
    canonicalUrl: basePreview.canonicalUrl,
    robotsDirective: basePreview.robotsDirective,
    displayTitle: basePreview.displayTitle,
    displayDescription: basePreview.displayDescription,
    h1Count,
    primaryHeadingText,
    imagesTotal: basePreview.imagesTotal,
    imagesMissingAlt: basePreview.imagesMissingAlt,
    isContentEmpty,
    blockingErrors,
    warningsToFix,
    recommendations,
    score100,
  };
}

/**
 * 6. CONTRÔLE ACCESSIBILITÉ — 3 niveaux en français : Bloquant, À corriger, Conseil
 */
export type AccessibilityLevelLabel = "Bloquant" | "À corriger" | "Conseil";

export interface AccessibilityAuditIssue {
  id: string;
  level: AccessibilityLevelLabel;
  severity: AuditIssueSeverity;
  category:
    | "contraste"
    | "texte_alternatif"
    | "liens"
    | "boutons_clavier"
    | "titres"
    | "focus"
    | "formulaires";
  pageSlug: string;
  message: string;
}

export interface AccessibilityAuditReport {
  issues: AccessibilityAuditIssue[];
  blockingCount: number;
  toFixCount: number;
  adviceCount: number;
  score100: number;
}

function parseHexLuminance(hex: string): number | null {
  const clean = (hex || "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function computeColorContrastRatio(hexA: string, hexB: string): number | null {
  const lumA = parseHexLuminance(hexA);
  const lumB = parseHexLuminance(hexB);
  if (lumA === null || lumB === null) return null;
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function auditIndependentSiteAccessibility(
  pages: ReadonlyArray<IndependentSitePage>,
  theme?: IndependentSiteThemeConfig | null
): AccessibilityAuditReport {
  const issues: AccessibilityAuditIssue[] = [];

  if (theme?.primaryColor && theme?.backgroundColor) {
    const ratio = computeColorContrastRatio(theme.primaryColor, theme.backgroundColor);
    if (ratio !== null && ratio < 3.0) {
      issues.push({
        id: "a11y-theme-contrast-blocking",
        level: "Bloquant",
        severity: "bloquant",
        category: "contraste",
        pageSlug: "/",
        message: `Contraste insuffisant (${ratio}:1) entre la couleur principale (${theme.primaryColor}) et le fond (${theme.backgroundColor}). Minimum requis : 4.5:1.`,
      });
    } else if (ratio !== null && ratio < 4.5) {
      issues.push({
        id: "a11y-theme-contrast-warn",
        level: "À corriger",
        severity: "a_corriger",
        category: "contraste",
        pageSlug: "/",
        message: `Contraste modéré (${ratio}:1) entre le texte principal et le fond. Visez au moins 4.5:1 pour une lecture confortable.`,
      });
    }
  }

  for (const page of pages) {
    const html = page.html || "";

    // 1. Images sans texte alternatif
    const imgs = extractImagesFromPageHtml(html);
    const missingAltCount = imgs.filter((i) => !i.hasAlt).length;
    if (missingAltCount > 0) {
      issues.push({
        id: `a11y-img-alt-${page.id}`,
        level: "À corriger",
        severity: "a_corriger",
        category: "texte_alternatif",
        pageSlug: page.slug,
        message: `Page « ${page.title} » : ${missingAltCount} image(s) sans texte alternatif descriptif (attribut alt).`,
      });
    }

    // 2. Liens sans intitulé compréhensible
    const linkMatches = Array.from(html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi));
    for (const m of linkMatches) {
      const attrs = m[1] || "";
      const innerText = (m[2] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const hasAriaLabel = /\baria-label\s*=\s*(?:"[^"]+"|'[^']+')/i.test(attrs);
      if (!innerText && !hasAriaLabel) {
        issues.push({
          id: `a11y-empty-link-${page.id}`,
          level: "Bloquant",
          severity: "bloquant",
          category: "liens",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : un lien <a> ne comporte aucun intitulé lisible ni aria-label.`,
        });
        break;
      } else if (/^(cliquez ici|ici|lien|plus)$/i.test(innerText)) {
        issues.push({
          id: `a11y-vague-link-${page.id}`,
          level: "Conseil",
          severity: "conseil",
          category: "liens",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : évitez les intitulés de liens trop vagues comme « ${innerText} ».`,
        });
        break;
      }
    }

    // 3. Boutons accessibles au clavier
    const buttonMatches = Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi));
    for (const b of buttonMatches) {
      const attrs = b[1] || "";
      const innerText = (b[2] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const hasAriaLabel = /\baria-label\s*=\s*(?:"[^"]+"|'[^']+')/i.test(attrs);
      if (!innerText && !hasAriaLabel) {
        issues.push({
          id: `a11y-empty-button-${page.id}`,
          level: "Bloquant",
          severity: "bloquant",
          category: "boutons_clavier",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : un bouton <button> n’a aucun texte ni libellé accessible aux lecteurs d’écran.`,
        });
        break;
      }
      if (/tabindex\s*=\s*["']-\d+["']/i.test(attrs)) {
        issues.push({
          id: `a11y-negative-tabindex-${page.id}`,
          level: "À corriger",
          severity: "a_corriger",
          category: "boutons_clavier",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : un bouton possède un tabindex négatif qui empêche la navigation au clavier.`,
        });
        break;
      }
    }

    // 4. Ordre logique des titres (h1 -> h2 -> h3)
    const headingLevels = Array.from(html.matchAll(/<h([1-6])\b[^>]*>/gi)).map((m) =>
      Number(m[1])
    );
    if (headingLevels.length === 0) {
      issues.push({
        id: `a11y-no-headings-${page.id}`,
        level: "À corriger",
        severity: "a_corriger",
        category: "titres",
        pageSlug: page.slug,
        message: `Page « ${page.title} » : aucun titre structurant (<h1>, <h2>…) n’est présent.`,
      });
    } else {
      for (let i = 1; i < headingLevels.length; i += 1) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
          issues.push({
            id: `a11y-heading-skip-${page.id}`,
            level: "Conseil",
            severity: "conseil",
            category: "titres",
            pageSlug: page.slug,
            message: `Page « ${page.title} » : saut de niveau de titre détecté (h${headingLevels[i - 1]} vers h${headingLevels[i]}). Respectez l’ordre h1 → h2 → h3.`,
          });
          break;
        }
      }
    }

    // 5. Focus visible (détection de outline:none sans remplacement)
    const combinedStyle = `${page.css || ""} ${html}`;
    if (/outline\s*:\s*(?:none|0)\b/i.test(combinedStyle) && !/focus-visible/i.test(combinedStyle)) {
      issues.push({
        id: `a11y-focus-suppressed-${page.id}`,
        level: "À corriger",
        severity: "a_corriger",
        category: "focus",
        pageSlug: page.slug,
        message: `Page « ${page.title} » : une règle « outline: none » masque l’indicateur de focus clavier.`,
      });
    }

    // 6. Champs de formulaire avec libellés
    const inputMatches = Array.from(
      html.matchAll(/<(?:input|textarea|select)\b([^>]*)>/gi)
    );
    for (const inp of inputMatches) {
      const attrs = inp[1] || "";
      if (/type\s*=\s*["'](?:hidden|submit|button)["']/i.test(attrs)) continue;
      const hasLabelOrAria =
        /\baria-label\s*=\s*(?:"[^"]+"|'[^']+')/i.test(attrs) ||
        /\bplaceholder\s*=\s*(?:"[^"]+"|'[^']+')/i.test(attrs) ||
        /<label\b/i.test(html);
      if (!hasLabelOrAria) {
        issues.push({
          id: `a11y-unlabeled-input-${page.id}`,
          level: "À corriger",
          severity: "a_corriger",
          category: "formulaires",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : un champ de formulaire ne possède ni balise <label> associée ni attribut aria-label.`,
        });
        break;
      }
    }
  }

  const blockingCount = issues.filter((i) => i.severity === "bloquant").length;
  const toFixCount = issues.filter((i) => i.severity === "a_corriger").length;
  const adviceCount = issues.filter((i) => i.severity === "conseil").length;

  let score100 = 100 - blockingCount * 28 - toFixCount * 10 - adviceCount * 3;
  score100 = Math.max(0, Math.min(100, score100));

  return {
    issues,
    blockingCount,
    toFixCount,
    adviceCount,
    score100,
  };
}

/**
 * 7. VÉRIFICATION RESPONSIVE — Ordinateur, Tablette, Mobile, Largeurs très étroites (320px)
 */
export interface ResponsiveAuditIssue {
  id: string;
  severity: AuditIssueSeverity;
  viewportTarget: "desktop" | "tablet" | "mobile" | "narrow-320";
  category:
    | "debordement_horizontal"
    | "image_trop_large"
    | "texte_coupe"
    | "bouton_inatteignable"
    | "menu_trop_long";
  pageSlug: string;
  message: string;
}

export interface ResponsiveAuditReport {
  issues: ResponsiveAuditIssue[];
  criticalCount: number;
  warningCount: number;
  checkedViewports: ReadonlyArray<{ id: string; label: string; widthPx: number; passed: boolean }>;
  score100: number;
}

export function auditIndependentSiteResponsive(
  pages: ReadonlyArray<IndependentSitePage>,
  navigation?: ReadonlyArray<IndependentSiteMenuItem> | null
): ResponsiveAuditReport {
  const issues: ResponsiveAuditIssue[] = [];
  const navItems = navigation ?? buildNavigationFromPages(pages);

  // Menu principal trop long
  if (navItems.length > 7) {
    issues.push({
      id: "resp-menu-too-long",
      severity: "a_corriger",
      viewportTarget: "tablet",
      category: "menu_trop_long",
      pageSlug: "/",
      message: `Le menu principal comporte ${navItems.length} entrées de premier niveau : au-delà de 7 liens, regroupez certaines pages en sous-menus pour éviter tout chevauchement sur tablette.`,
    });
  }

  for (const page of pages) {
    const combined = `${page.html || ""} ${page.css || ""}`;

    // Détection de largeurs fixes provoquant un débordement horizontal sur mobile (320px / 414px)
    const fixedWidthMatches = Array.from(
      combined.matchAll(/(?:^|[;{"'\s])(?:width|min-width)\s*:\s*(\d{3,4})px/gi)
    );
    for (const m of fixedWidthMatches) {
      const px = Number(m[1]);
      if (px > 420) {
        issues.push({
          id: `resp-overflow-width-${page.id}-${px}`,
          severity: px >= 600 ? "bloquant" : "a_corriger",
          viewportTarget: "narrow-320",
          category: "debordement_horizontal",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : une largeur fixe de ${px}px provoque un débordement horizontal sur mobile étroit (320px). Utilisez max-width: 100% ou un pourcentage.`,
        });
        break;
      }
    }

    // Détection d'images trop larges
    const imgWidthMatches = Array.from(
      (page.html || "").matchAll(/<img\b[^>]*\bwidth\s*=\s*["']?(\d{3,4})["']?[^>]*>/gi)
    );
    for (const im of imgWidthMatches) {
      const px = Number(im[1]);
      if (px > 500) {
        issues.push({
          id: `resp-wide-img-${page.id}`,
          severity: "a_corriger",
          viewportTarget: "mobile",
          category: "image_trop_large",
          pageSlug: page.slug,
          message: `Page « ${page.title} » : une image définit une largeur fixe de ${px}px. Le style responsive de base la contraindra à 100%, mais préférez des dimensions fluides.`,
        });
        break;
      }
    }

    // Détection de textes coupés (white-space: nowrap sur de longs blocs ou overflow-x: visible forcé)
    if (/white-space\s*:\s*nowrap/i.test(combined)) {
      issues.push({
        id: `resp-text-clipped-${page.id}`,
        severity: "conseil",
        viewportTarget: "narrow-320",
        category: "texte_coupe",
        pageSlug: page.slug,
        message: `Page « ${page.title} » : « white-space: nowrap » détecté, vérifiez que les titres longs ne sont pas tronqués sur un écran de 320px.`,
      });
    }

    // Détection de boutons inatteignables (position fixe hors écran ou hauteur/police minuscule)
    if (/(?:left|right)\s*:\s*-\d{3,}px/i.test(combined)) {
      issues.push({
        id: `resp-unreachable-button-${page.id}`,
        severity: "bloquant",
        viewportTarget: "mobile",
        category: "bouton_inatteignable",
        pageSlug: page.slug,
        message: `Page « ${page.title} » : un élément est positionné hors de l’écran avec un décalage négatif supérieur à 100px.`,
      });
    }
  }

  const criticalCount = issues.filter((i) => i.severity === "bloquant").length;
  const warningCount = issues.filter((i) => i.severity !== "bloquant").length;

  const checkedViewports = [
    { id: "desktop", label: "Ordinateur (1440px)", widthPx: 1440, passed: true },
    {
      id: "tablet",
      label: "Tablette (768px - 1024px)",
      widthPx: 768,
      passed: !issues.some((i) => i.viewportTarget === "tablet" && i.severity === "bloquant"),
    },
    {
      id: "mobile",
      label: "Mobile standard (414px)",
      widthPx: 414,
      passed: !issues.some((i) => i.viewportTarget === "mobile" && i.severity === "bloquant"),
    },
    {
      id: "narrow-320",
      label: "Mobile très étroit (320px)",
      widthPx: 320,
      passed: !issues.some((i) => i.viewportTarget === "narrow-320" && i.severity === "bloquant"),
    },
  ];

  let score100 = 100 - criticalCount * 35 - warningCount * 10;
  score100 = Math.max(0, Math.min(100, score100));

  return {
    issues,
    criticalCount,
    warningCount,
    checkedViewports,
    score100,
  };
}

/**
 * 8. MÉDIAS — Recherche, filtre par type, poids, dimensions, remplacement sans casser les références
 */
export const INDEPENDENT_MEDIA_WARN_BYTES = 500 * 1024; // 500 Ko : avertissement fichier lourd
export const INDEPENDENT_MEDIA_MAX_BYTES = 5 * 1024 * 1024; // 5 Mo : rejet sécurité

export type IndependentMediaTypeFilter = "all" | "image/webp" | "image/svg+xml" | "image/jpeg" | "image/png";

export interface IndependentMediaMetadataAssessment {
  estimatedBytes: number;
  formattedSize: string;
  dimensionsLabel: string;
  isTooHeavyWarning: boolean;
  isRejectedTooLarge: boolean;
  hasValidAltText: boolean;
  warningMessage: string | null;
}

export function assessIndependentMediaItem(input: {
  url: string;
  altText?: string | null;
  mimeType?: string | null;
  widthPx?: number | null;
  heightPx?: number | null;
  fileSizeBytes?: number | null;
}): IndependentMediaMetadataAssessment {
  const url = (input.url || "").trim();
  const estimatedBytes =
    typeof input.fileSizeBytes === "number" && input.fileSizeBytes > 0
      ? input.fileSizeBytes
      : url.startsWith("data:")
        ? Math.round((url.length * 3) / 4)
        : 120 * 1024;

  const kb = Math.max(1, Math.round(estimatedBytes / 1024));
  const formattedSize = kb >= 1024 ? `${(kb / 1024).toFixed(2)} Mo` : `${kb} Ko`;
  const dimensionsLabel =
    input.widthPx && input.heightPx
      ? `${input.widthPx} × ${input.heightPx} px`
      : "Dimensions adaptatives (auto)";

  const isRejectedTooLarge = estimatedBytes > INDEPENDENT_MEDIA_MAX_BYTES;
  const isTooHeavyWarning = estimatedBytes > INDEPENDENT_MEDIA_WARN_BYTES;
  const hasValidAltText = Boolean(input.altText && input.altText.trim().length >= 3);

  let warningMessage: string | null = null;
  if (isRejectedTooLarge) {
    warningMessage = `Fichier trop volumineux (${formattedSize}) : la limite maximale est de 5 Mo.`;
  } else if (isTooHeavyWarning) {
    warningMessage = `Fichier lourd (${formattedSize}) : privilégiez une image WebP ou SVG inférieure à 500 Ko pour accélérer le chargement.`;
  } else if (!hasValidAltText) {
    warningMessage =
      "Texte alternatif manquant ou trop court : décrivez l’image pour l’accessibilité et le référencement.";
  }

  return {
    estimatedBytes,
    formattedSize,
    dimensionsLabel,
    isTooHeavyWarning,
    isRejectedTooLarge,
    hasValidAltText,
    warningMessage,
  };
}

export function filterIndependentMediaItems<
  T extends {
    label: string;
    altText: string;
    url: string;
    mimeType: string;
  },
>(
  items: ReadonlyArray<T>,
  options?: {
    search?: string;
    mimeTypeFilter?: IndependentMediaTypeFilter | string;
  }
): T[] {
  const q = normalizeSearchQuery(options?.search);
  const mime =
    options?.mimeTypeFilter && options.mimeTypeFilter !== "all"
      ? options.mimeTypeFilter.toLowerCase()
      : null;

  return items.filter((item) => {
    if (mime && !(item.mimeType || "").toLowerCase().includes(mime.replace("image/", ""))) {
      return false;
    }
    return matchesNormalizedSearch(q, [item.label, item.altText, item.mimeType, item.url]);
  });
}

export function replaceMediaUrlAcrossPages(
  pages: ReadonlyArray<IndependentSitePage>,
  oldUrl: string,
  newUrl: string,
  newAltText?: string
): { pages: IndependentSitePage[]; replacedCount: number } {
  const cleanOld = (oldUrl || "").trim();
  const safeNewUrl = sanitizeBuilderImageSrc(newUrl);
  if (!cleanOld) {
    return { pages: [...pages], replacedCount: 0 };
  }

  let replacedCount = 0;
  const updatedPages = pages.map((page) => {
    let pageHtml = page.html || "";
    if (pageHtml.includes(cleanOld)) {
      const parts = pageHtml.split(cleanOld);
      replacedCount += parts.length - 1;
      pageHtml = parts.join(safeNewUrl);
    }
    const nextSocial =
      page.socialImageUrl === cleanOld ? safeNewUrl : page.socialImageUrl;
    return {
      ...page,
      html: sanitizeIndependentHtml(pageHtml),
      socialImageUrl: nextSocial,
      ...(newAltText ? {} : {}),
    };
  });

  return {
    pages: updatedPages,
    replacedCount,
  };
}

/**
 * 9. NAVIGATION ET FOOTER — Modèles prêts à l’emploi, limitation de profondeur des sous-menus & vérification des liens
 */
export const MAX_INDEPENDENT_SUBMENU_DEPTH = 2 as const;

export interface IndependentNavAndFooterPreset {
  id: string;
  kind: "header_navigation" | "footer_complet";
  label: string;
  description: string;
  features: string[];
  html: string;
}

export const INDEPENDENT_NAV_AND_FOOTER_PRESETS: ReadonlyArray<IndependentNavAndFooterPreset> = [
  {
    id: "nav-preset-classique-cta",
    kind: "header_navigation",
    label: "Menu principal accessible avec sous-menu & bouton d’action",
    description:
      "En-tête responsive avec navigation principale, sous-menu déroulant accessible au clavier, menu mobile repliable et bouton d’appel à l’action.",
    features: ["Menu principal", "Sous-menu (max 2 niveaux)", "Menu mobile <details>", "Bouton CTA"],
    html: `<header data-site-block="header-nav-accessible" style="background:#172033;color:#ffffff;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.12)">
  <div style="max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px">
    <a href="/" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:1.125rem">Mon Site Indépendant</a>
    <nav aria-label="Menu principal" style="display:flex;flex-wrap:wrap;align-items:center;gap:20px">
      <a href="/" style="color:#f8fafc;text-decoration:none;font-size:0.95rem">Accueil</a>
      <details style="position:relative">
        <summary style="cursor:pointer;color:#f5b98f;font-size:0.95rem;font-weight:600">Découvrir ▾</summary>
        <div style="background:#1e293b;padding:10px 14px;border-radius:8px;margin-top:6px;display:flex;flex-direction:column;gap:8px">
          <a href="/notre-famille" style="color:#ffffff;text-decoration:none;font-size:0.875rem">Présentation</a>
          <a href="/evenements" style="color:#ffffff;text-decoration:none;font-size:0.875rem">Événements</a>
        </div>
      </details>
      <a href="/contact" style="color:#f8fafc;text-decoration:none;font-size:0.95rem">Contact</a>
      <a href="/contact" style="background:#9b563e;color:#ffffff;padding:9px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem">Nous écrire</a>
    </nav>
  </div>
</header>`,
  },
  {
    id: "footer-preset-complet-legal-social",
    kind: "footer_complet",
    label: "Pied de page complet (Coordonnées, Liens légaux, Réseaux & CTA)",
    description:
      "Footer structuré sur 3 colonnes comprenant présentation, liens de navigation, liens sociaux, mentions légales/confidentialité et bouton d’appel à l’action.",
    features: ["Coordonnées", "Liens sociaux", "Liens légaux", "Bouton d’appel à l’action"],
    html: `<footer data-site-block="footer-complet-accessible" style="background:#172033;color:#e2e8f0;padding:48px 24px;margin-top:40px">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px">
    <div>
      <h2 style="color:#ffffff;font-size:1.15rem;margin:0 0 10px 0">Notre Organisation</h2>
      <p style="font-size:0.9rem;line-height:1.6;color:#cbd5e1;margin:0 0 16px 0">Site indépendant d’information, de rencontres et de partage. Démonstration à personnaliser avec vos coordonnées.</p>
      <a href="/contact" style="display:inline-block;background:#f5b98f;color:#172033;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.875rem">Prendre contact</a>
    </div>
    <nav aria-label="Navigation pied de page">
      <h3 style="color:#f5b98f;font-size:0.95rem;margin:0 0 12px 0">Rubriques & Liens légaux</h3>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:0.875rem">
        <li><a href="/" style="color:#e2e8f0;text-decoration:none">Accueil</a></li>
        <li><a href="/contact" style="color:#e2e8f0;text-decoration:none">Mentions légales & Confidentialité</a></li>
        <li><a href="/contact" style="color:#e2e8f0;text-decoration:none">Accessibilité & Contact</a></li>
      </ul>
    </nav>
    <div>
      <h3 style="color:#f5b98f;font-size:0.95rem;margin:0 0 12px 0">Réseaux & Contact direct</h3>
      <p style="font-size:0.875rem;color:#cbd5e1;margin:0 0 10px 0">Email : contact@exemple.org · Tél : +41 22 000 00 00</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.85rem">
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style="color:#f5b98f;text-decoration:underline">LinkedIn</a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style="color:#f5b98f;text-decoration:underline">Instagram</a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style="color:#f5b98f;text-decoration:underline">Facebook</a>
      </div>
    </div>
  </div>
</footer>`,
  },
] as const;

export function reorderIndependentPagesMenu(
  pages: ReadonlyArray<IndependentSitePage>,
  pageId: string,
  direction: "up" | "down",
  newParentPageId?: string | null
): IndependentSitePage[] {
  const cloned: IndependentSitePage[] = JSON.parse(JSON.stringify(pages));
  const target = cloned.find((p) => p.id === pageId);
  if (!target) return cloned;

  if (newParentPageId !== undefined) {
    if (newParentPageId === null || newParentPageId === "") {
      target.parentPageId = null;
    } else if (newParentPageId !== target.id) {
      const parentCandidate = cloned.find((p) => p.id === newParentPageId);
      // Limitation stricte à 2 niveaux (Menu principal -> Sous-menu) : un sous-menu ne peut pas avoir d'enfant
      if (parentCandidate && !parentCandidate.parentPageId) {
        const targetHasChildren = cloned.some((c) => c.parentPageId === target.id);
        if (!targetHasChildren) {
          target.parentPageId = parentCandidate.id;
        }
      }
    }
  }

  const siblings = cloned
    .filter((p) => (p.parentPageId ?? null) === (target.parentPageId ?? null))
    .sort((a, b) => a.menuOrder - b.menuOrder);

  const idx = siblings.findIndex((s) => s.id === target.id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx >= 0 && swapIdx >= 0 && swapIdx < siblings.length) {
    const tempOrder = siblings[idx].menuOrder;
    siblings[idx].menuOrder = siblings[swapIdx].menuOrder;
    siblings[swapIdx].menuOrder = tempOrder;
  }

  return cloned.sort((a, b) => a.menuOrder - b.menuOrder);
}

export interface BrokenInternalLinkIssue {
  fromPageTitle: string;
  fromPageSlug: string;
  targetHref: string;
  linkText: string;
}

export function verifyIndependentInternalLinks(
  pages: ReadonlyArray<IndependentSitePage>
): {
  valid: boolean;
  brokenLinks: BrokenInternalLinkIssue[];
  checkedLinksCount: number;
} {
  const knownSlugs = new Set(pages.map((p) => normalizeIndependentPageSlug(p.slug)));
  const brokenLinks: BrokenInternalLinkIssue[] = [];
  let checkedLinksCount = 0;

  for (const page of pages) {
    const html = page.html || "";
    const matches = Array.from(
      html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi)
    );
    for (const m of matches) {
      const rawHref = (m[1] ?? m[2] ?? "").trim();
      const linkText = (m[3] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || rawHref;
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        continue;
      }
      if (/^https?:\/\//i.test(rawHref)) {
        checkedLinksCount += 1;
        continue;
      }
      if (rawHref.startsWith("/")) {
        checkedLinksCount += 1;
        const pathOnly = rawHref.split("#")[0].split("?")[0] || "/";
        const normalizedTarget = normalizeIndependentPageSlug(pathOnly);
        if (!knownSlugs.has(normalizedTarget)) {
          brokenLinks.push({
            fromPageTitle: page.title,
            fromPageSlug: page.slug,
            targetHref: rawHref,
            linkText,
          });
        }
      }
    }
  }

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
    checkedLinksCount,
  };
}

export interface RepairedInternalLinkChange {
  fromPageSlug: string;
  sourceHref: string;
  targetHref: string;
  linkText: string;
}

/**
 * Répare uniquement les anciens alias connus des blocs associatifs génériques.
 * Les chemins inconnus restent inchangés afin de ne pas masquer une erreur éditoriale.
 */
export function repairKnownIndependentInternalLinks(
  pages: ReadonlyArray<IndependentSitePage>,
): { pages: IndependentSitePage[]; changes: RepairedInternalLinkChange[] } {
  const knownSlugs = new Set(pages.map((p) => normalizeIndependentPageSlug(p.slug)));
  const aliases: Record<string, string[]> = {
    "/a-propos": ["/notre-famille"],
    "/histoire": ["/notre-famille"],
    "/membres": ["/notre-famille"],
    "/charte": ["/notre-famille"],
    "/participer": ["/contact"],
    "/mentions-legales": ["/mentions-legales", "/contact"],
    "/confidentialite": ["/confidentialite", "/contact"],
  };
  const changes: RepairedInternalLinkChange[] = [];

  const repairedPages = pages.map((page) => {
    let html = page.html || "";
    html = html.replace(
      /(<a\b[^>]*\bhref\s*=\s*)(["'])(\/[^"']*)(\2)([^>]*>)([\s\S]*?)(<\/a>)/gi,
      (full, prefix, quote, rawHref, closingQuote, afterHref, inner, endTag) => {
        const pathOnly = rawHref.split("#")[0].split("?")[0] || "/";
        const normalized = normalizeIndependentPageSlug(pathOnly);
        if (knownSlugs.has(normalized) || !aliases[normalized]) return full;
        const target = aliases[normalized].find((candidate) =>
          knownSlugs.has(normalizeIndependentPageSlug(candidate)),
        );
        if (!target) return full;
        const suffix = rawHref.slice(pathOnly.length);
        const targetHref = `${target}${suffix}`;
        const linkText = String(inner).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || rawHref;
        changes.push({ fromPageSlug: page.slug, sourceHref: rawHref, targetHref, linkText });
        return `${prefix}${quote}${targetHref}${closingQuote}${afterHref}${inner}${endTag}`;
      },
    );
    return html === (page.html || "") ? page : { ...page, html };
  });

  return { pages: repairedPages, changes };
}

/**
 * 4. CHECKLIST AVANT PUBLICATION & 13. QUALITÉ DU PROJET (SCORE EXPLICABLE)
 */
export interface PrePublishChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  blocking: boolean;
  detail: string;
}

export interface IndependentSiteQualityReport {
  overallScore100: number;
  scoreBreakdown: {
    seoScore100: number;
    accessibilityScore100: number;
    responsiveScore100: number;
    navigationScore100: number;
    mediaScore100: number;
    securityScore100: number;
  };
  scoreExplanation: string;
  canPublish: boolean;
  blockingIssuesCount: number;
  recommendationsCount: number;
  checklist: PrePublishChecklistItem[];
  pageSeoAudits: PageSeoDetailedAudit[];
  accessibilityAudit: AccessibilityAuditReport;
  responsiveAudit: ResponsiveAuditReport;
  brokenLinksReport: ReturnType<typeof verifyIndependentInternalLinks>;
  demoStatus: IndependentDemoContentStatus;
  publicationStatusLabel: "Brouillon" | "Publié" | "Archivé";
}

export function evaluateIndependentSiteQualityAndChecklist(input: {
  title: string;
  slug: string;
  siteType: IndependentSiteType;
  projectMode?: IndependentProjectMode | null;
  status: IndependentSiteStatus;
  templateId?: string | null;
  theme?: IndependentSiteThemeConfig | null;
  navigation?: ReadonlyArray<IndependentSiteMenuItem> | null;
  pages: ReadonlyArray<IndependentSitePage>;
  mediaItems?: ReadonlyArray<{
    label: string;
    altText: string;
    url: string;
    mimeType: string;
  }>;
}): IndependentSiteQualityReport {
  const pages = input.pages || [];
  const cleanTitle = (input.title || "").trim();
  const cleanSlug = slugifyIndependentSite(input.slug || cleanTitle);
  const mode = resolveIndependentProjectMode(input.siteType, input.projectMode);

  // 1. Vérification sécurité (secrets & e-commerce)
  let noSecretsPassed = true;
  try {
    assertNoSecretsInIndependentSite(input);
  } catch {
    noSecretsPassed = false;
  }

  let noForbiddenEcommercePassed = true;
  try {
    assertZeroEcommerceInIndependentSite(input);
  } catch {
    noForbiddenEcommercePassed = false;
  }
  if (mode === "site_vitrine") {
    for (const p of pages) {
      if (/data-mazigho-dynamic\s*=\s*["']catalogue["']|panier-ecommerce|checkout-stripe/i.test(p.html || "")) {
        noForbiddenEcommercePassed = false;
      }
    }
  }

  // 2. Audits détaillés par domaine
  const pageSeoAudits = pages.map((p) => auditIndependentPageSeo(p, cleanSlug));
  const accessibilityAudit = auditIndependentSiteAccessibility(pages, input.theme);
  const responsiveAudit = auditIndependentSiteResponsive(pages, input.navigation);
  const brokenLinksReport = verifyIndependentInternalLinks(pages);
  const demoStatus = detectIndependentDemoContentStatus({
    slug: cleanSlug,
    title: cleanTitle,
    templateId: input.templateId,
    pages,
  });

  const hasHomePage = pages.some((p) => normalizeIndependentPageSlug(p.slug) === "/");
  const allPagesNonEmptyHtml =
    pages.length > 0 &&
    pages.every((p) => {
      const txt = (p.html || "").replace(/<[^>]+>/g, " ").trim();
      return txt.length >= 10;
    });
  const allCssValidOrClean = pages.every(
    (p) => !/javascript:|expression\s*\(|@import\s+url\s*\(\s*['"]?javascript:/i.test(p.css || "")
  );

  const totalImages = pageSeoAudits.reduce((acc, a) => acc + a.imagesTotal, 0);
  const missingAltImages = pageSeoAudits.reduce((acc, a) => acc + a.imagesMissingAlt, 0);
  const allImagesHaveAlt = missingAltImages === 0;

  // Vérification de cohérence des informations de contact
  const contactPage = pages.find(
    (p) => /contact/i.test(p.slug) || /contact/i.test(p.title)
  );
  const fullSiteHtml = pages.map((p) => p.html || "").join("\n");
  const hasCoherentContactInfo =
    Boolean(contactPage) ||
    /mailto:|tel:|@[a-z0-9.-]+\.[a-z]{2,}|contact|nous écrire/i.test(fullSiteHtml);

  const navItems = input.navigation ?? buildNavigationFromPages(pages);
  const hasCoherentNavigation =
    pages.length > 0 &&
    navItems.length > 0 &&
    pages.every((p) => {
      if (!p.parentPageId) return true;
      const parent = pages.find((cand) => cand.id === p.parentPageId);
      return Boolean(parent && !parent.parentPageId);
    });

  // 14 points obligatoires de la checklist avant publication
  const checklist: PrePublishChecklistItem[] = [
    {
      id: "check-title",
      label: "Titre du site présent",
      passed: cleanTitle.length >= 2,
      blocking: true,
      detail: cleanTitle.length >= 2 ? `Titre : « ${cleanTitle} »` : "Le titre du site est manquant.",
    },
    {
      id: "check-slug",
      label: "Slug valide",
      passed: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug),
      blocking: true,
      detail: `Adresse publique : /sites/${cleanSlug}`,
    },
    {
      id: "check-homepage",
      label: "Page d’accueil présente (/)",
      passed: hasHomePage,
      blocking: true,
      detail: hasHomePage
        ? "La page d’accueil (/) est bien configurée."
        : "Aucune page n’utilise le chemin racine « / ».",
    },
    {
      id: "check-navigation",
      label: "Navigation cohérente (menus & sous-menus ≤ 2 niveaux)",
      passed: hasCoherentNavigation,
      blocking: true,
      detail: hasCoherentNavigation
        ? `${navItems.length} entrée(s) principale(s) dans le menu.`
        : "Le menu est vide ou comporte une hiérarchie de sous-menu invalide.",
    },
    {
      id: "check-broken-links",
      label: "Aucun lien interne cassé",
      passed: brokenLinksReport.valid,
      blocking: !demoStatus.isStaticAthVahloulException,
      detail: brokenLinksReport.valid
        ? `${brokenLinksReport.checkedLinksCount} lien(s) vérifié(s), aucun lien cassé.`
        : `${brokenLinksReport.brokenLinks.length} lien(s) interne(s) pointent vers une page inexistante (${brokenLinksReport.brokenLinks
            .map((b) => b.targetHref)
            .join(", ")}).`,
    },
    {
      id: "check-non-empty-html",
      label: "HTML non vide sur chaque page",
      passed: allPagesNonEmptyHtml,
      blocking: true,
      detail: allPagesNonEmptyHtml
        ? `${pages.length} page(s) contiennent du contenu éditorial.`
        : "Une ou plusieurs pages sont vides.",
    },
    {
      id: "check-clean-css",
      label: "CSS valide ou nettoyé",
      passed: allCssValidOrClean,
      blocking: true,
      detail: "Feuille de style vérifiée et nettoyée.",
    },
    {
      id: "check-images-alt",
      label: "Images avec texte alternatif (alt)",
      passed: allImagesHaveAlt,
      blocking: false,
      detail: allImagesHaveAlt
        ? `${totalImages} image(s) vérifiée(s) avec texte alternatif.`
        : `${missingAltImages} image(s) sur ${totalImages} n’ont pas encore d’attribut alt.`,
    },
    {
      id: "check-responsive",
      label: "Responsive vérifié (ordinateur, tablette, mobile, 320px)",
      passed: responsiveAudit.criticalCount === 0,
      blocking: !demoStatus.isStaticAthVahloulException,
      detail:
        responsiveAudit.criticalCount === 0
          ? "Aucun débordement horizontal ni blocage responsive critique détecté."
          : `${responsiveAudit.criticalCount} problème(s) responsive critique(s) détecté(s).`,
    },
    {
      id: "check-demo-content",
      label: "Contenu de démonstration signalé",
      passed: !demoStatus.hasUnchangedDemoMarkers || demoStatus.isStaticAthVahloulException,
      blocking: false,
      detail: demoStatus.noticeMessage,
    },
    {
      id: "check-contact-info",
      label: "Informations de contact cohérentes",
      passed: hasCoherentContactInfo,
      blocking: false,
      detail: hasCoherentContactInfo
        ? "Une page ou section de contact est présente sur le site."
        : "Conseil : ajoutez une page ou un pied de page avec vos coordonnées de contact.",
    },
    {
      id: "check-no-sensitive-data",
      label: "Aucune donnée sensible exposée",
      passed: noSecretsPassed,
      blocking: true,
      detail: noSecretsPassed
        ? "Aucune donnée personnelle sensible ou clé privée détectée."
        : "Donnée sensible détectée dans le contenu.",
    },
    {
      id: "check-no-secrets",
      label: "Aucun secret ni jeton API",
      passed: noSecretsPassed,
      blocking: true,
      detail: noSecretsPassed
        ? "Aucun secret ou clé API présent."
        : "Clé API ou secret détecté : publication bloquée.",
    },
    {
      id: "check-no-ecommerce",
      label: "Aucun élément e-commerce interdit dans un site vitrine",
      passed: noForbiddenEcommercePassed,
      blocking: true,
      detail: noForbiddenEcommercePassed
        ? "Séparation 100 % respectée : aucun panier, commande, paiement ou stock."
        : "Élément e-commerce interdit détecté : publication bloquée.",
    },
  ];

  const seoScore100 =
    pageSeoAudits.length > 0
      ? Math.round(
          pageSeoAudits.reduce((sum, item) => sum + item.score100, 0) / pageSeoAudits.length
        )
      : 0;
  const accessibilityScore100 = accessibilityAudit.score100;
  const responsiveScore100 = responsiveAudit.score100;
  const navigationScore100 =
    hasCoherentNavigation && brokenLinksReport.valid
      ? 100
      : brokenLinksReport.valid
        ? 70
        : Math.max(20, 100 - brokenLinksReport.brokenLinks.length * 30);
  const mediaScore100 =
    totalImages === 0
      ? 100
      : Math.max(0, Math.round(((totalImages - missingAltImages) / totalImages) * 100));
  const securityScore100 = noSecretsPassed && noForbiddenEcommercePassed ? 100 : 0;

  const overallScore100 = Math.round(
    seoScore100 * 0.2 +
      accessibilityScore100 * 0.2 +
      responsiveScore100 * 0.2 +
      navigationScore100 * 0.15 +
      mediaScore100 * 0.1 +
      securityScore100 * 0.15
  );

  const blockingChecklistFailed = checklist.filter((c) => c.blocking && !c.passed);
  const nonBlockingChecklistFailed = checklist.filter((c) => !c.blocking && !c.passed);

  const blockingIssuesCount =
    blockingChecklistFailed.length +
    pageSeoAudits.reduce((s, a) => s + a.blockingErrors.length, 0) +
    accessibilityAudit.blockingCount +
    responsiveAudit.criticalCount;

  const recommendationsCount =
    nonBlockingChecklistFailed.length +
    pageSeoAudits.reduce((s, a) => s + a.warningsToFix.length + a.recommendations.length, 0) +
    accessibilityAudit.toFixCount +
    accessibilityAudit.adviceCount +
    responsiveAudit.warningCount;

  const canPublish = blockingChecklistFailed.length === 0 && securityScore100 === 100;

  const publicationStatusLabel: "Brouillon" | "Publié" | "Archivé" =
    input.status === "published"
      ? "Publié"
      : input.status === "archived"
        ? "Archivé"
        : "Brouillon";

  const scoreExplanation = `Score calculé sur 6 critères explicables : SEO (${seoScore100}/100, poids 20 %), Accessibilité (${accessibilityScore100}/100, poids 20 %), Responsive (${responsiveScore100}/100, poids 20 %), Navigation & Liens (${navigationScore100}/100, poids 15 %), Sécurité & Isolation (${securityScore100}/100, poids 15 %) et Médias (${mediaScore100}/100, poids 10 %).`;

  return {
    overallScore100,
    scoreBreakdown: {
      seoScore100,
      accessibilityScore100,
      responsiveScore100,
      navigationScore100,
      mediaScore100,
      securityScore100,
    },
    scoreExplanation,
    canPublish,
    blockingIssuesCount,
    recommendationsCount,
    checklist,
    pageSeoAudits,
    accessibilityAudit,
    responsiveAudit,
    brokenLinksReport,
    demoStatus,
    publicationStatusLabel,
  };
}

// ---------------------------------------------------------------------------
// AUDIT UX/UI — Rôles d’accès par site indépendant, Parcours d’invitation
//               & Parcours de livraison client (100 % aligné permissions serveur)
// ---------------------------------------------------------------------------

export type IndependentSiteClientRole = "owner" | "admin" | "editor";

export interface IndependentSiteRolePresentation {
  role: IndependentSiteClientRole;
  title: string;
  shortLabel: string;
  badgeLabel: string;
  audienceSummary: string;
  description: string;
  allowedActions: string[];
  restrictedActions: string[];
}

export const INDEPENDENT_SITE_ROLE_PRESENTATIONS: Record<
  IndependentSiteClientRole,
  IndependentSiteRolePresentation
> = {
  owner: {
    role: "owner",
    title: "Propriétaire du site (Owner)",
    shortLabel: "Propriétaire",
    badgeLabel: "Propriétaire (Owner)",
    audienceSummary: "Créateur ou responsable principal du site",
    description:
      "Dispose de l’intégralité des droits sur ce site : édition, publication, domaines personnalisés, gestion des accès clients et réglages sensibles.",
    allowedActions: [
      "Modifier toutes les pages, textes, images, blocs et menus",
      "Sauvegarder les brouillons et prévisualiser le site en privé",
      "Publier et dépublier le site sur son adresse publique",
      "Gérer l’historique des versions et l’import/export JSON",
      "Rattacher et vérifier un nom de domaine personnalisé (DNS TXT)",
      "Inviter des membres (Administrateur ou Éditeur), modifier leur rôle et révoquer un accès",
      "Dupliquer ou archiver le site",
    ],
    restrictedActions: [
      "Le transfert définitif de propriété est protégé et nécessite une validation dédiée",
    ],
  },
  admin: {
    role: "admin",
    title: "Administrateur du site (Admin)",
    shortLabel: "Administrateur",
    badgeLabel: "Administrateur (Admin)",
    audienceSummary: "Client responsable du site, président d’association ou gérant",
    description:
      "Assure la gestion opérationnelle complète du site au quotidien (contenu, médias, versions et mise en ligne), sans pouvoir modifier les membres ni les domaines.",
    allowedActions: [
      "Modifier toutes les pages, textes, images, blocs, menus et réglages SEO",
      "Gérer la bibliothèque de médias du site",
      "Sauvegarder les brouillons et ouvrir l’aperçu privé",
      "Publier le site en ligne et le dépublier (retour en brouillon)",
      "Créer et restaurer des versions dans l’historique du site",
      "Exporter et importer le contenu du site au format JSON",
      "Créer des liens d’aperçu privé en lecture seule pour relecture",
    ],
    restrictedActions: [
      "Ne peut pas inviter, modifier ou révoquer les membres du site",
      "Ne peut pas ajouter ou supprimer un domaine personnalisé DNS",
      "Ne peut pas archiver le site ni transférer la propriété",
    ],
  },
  editor: {
    role: "editor",
    title: "Éditeur de contenu (Editor)",
    shortLabel: "Éditeur",
    badgeLabel: "Éditeur (Editor)",
    audienceSummary: "Rédacteur, bénévole ou collaborateur chargé des mises à jour",
    description:
      "Modifie le contenu autorisé du site (textes, pages, images et brouillons) en toute sécurité, sans pouvoir publier en ligne ni modifier les accès.",
    allowedActions: [
      "Modifier les textes, titres, cartes et sections des pages",
      "Ajouter et remplacer des images dans la bibliothèque de médias du site",
      "Ajuster le référencement (titre et description SEO) des pages",
      "Sauvegarder le travail en brouillon et consulter l’aperçu privé",
    ],
    restrictedActions: [
      "Ne peut pas publier ni dépublier le site en ligne (validation par un Administrateur ou Propriétaire)",
      "Ne peut pas restaurer d’anciennes versions ni importer/exporter le projet",
      "Ne peut pas gérer les noms de domaine personnalisés",
      "Ne peut pas voir ni gérer les membres et invitations du site",
    ],
  },
};

export function getIndependentSiteRolePresentation(
  role: IndependentSiteClientRole | null | undefined
): IndependentSiteRolePresentation {
  if (role === "owner") return INDEPENDENT_SITE_ROLE_PRESENTATIONS.owner;
  if (role === "admin") return INDEPENDENT_SITE_ROLE_PRESENTATIONS.admin;
  return INDEPENDENT_SITE_ROLE_PRESENTATIONS.editor;
}

export interface IndependentSiteClientDeliveryStep {
  stepNumber: number;
  title: string;
  description: string;
}

export const INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE: {
  heading: string;
  subtitle: string;
  isolationNotice: string;
  supportNotice: string;
  ownershipTransferNotice: {
    title: string;
    statusBadge: string;
    description: string;
  };
  steps: IndependentSiteClientDeliveryStep[];
} = {
  heading: "Parcours de livraison et prise en main client",
  subtitle:
    "Guide clair pour remettre un site à une association, une famille ou une petite entreprise en toute autonomie.",
  isolationNotice:
    "Séparation garantie : la personne invitée accède uniquement à l’administration de son propre site. Elle ne voit jamais les autres projets, ni le catalogue privé MAZIGHO, ni la boutique e-commerce.",
  supportNotice:
    "Besoin d’aide ? En cas de question sur votre accès, d’invitation expirée ou de publication, contactez directement le propriétaire du site qui vous a transmis l’invitation ou votre référent d’accompagnement.",
  ownershipTransferNotice: {
    title: "Transfert de propriété du site (Owner)",
    statusBadge: "Protégé · Sur validation",
    description:
      "Pour éviter toute perte accidentelle d’accès, le rôle Propriétaire (Owner) ne peut pas être cédé en un clic. Lors de la livraison d’un site, attribuez le rôle « Administrateur » à votre client pour lui donner l’autonomie de gestion et de publication. Le transfert intégral de propriété fera l’objet d’une procédure dédiée avec double confirmation.",
  },
  steps: [
    {
      stepNumber: 1,
      title: "Inviter le client avec le rôle adapté",
      description:
        "Saisissez l’adresse e-mail exacte du client et choisissez « Administrateur » (s’il doit pouvoir publier lui-même) ou « Éditeur » (s’il prépare uniquement les contenus en brouillon).",
    },
    {
      stepNumber: 2,
      title: "Transmettre le lien d’activation à usage unique",
      description:
        "Copiez le lien d’invitation généré et envoyez-le au client. Ce lien affiche clairement le nom du site, la durée de validité et le rôle attribué avant activation.",
    },
    {
      stepNumber: 3,
      title: "Connexion sur /connexion-administration",
      description:
        "Le client se connecte (ou crée son mot de passe) avec l’adresse e-mail invitée sur la page dédiée /connexion-administration, puis active son accès en un clic.",
    },
    {
      stepNumber: 4,
      title: "Gestion du site et retour au site public",
      description:
        "Depuis son espace dédié, le client modifie ses pages, sauvegarde ses changements et peut revenir à tout moment sur son site public (/sites/nom-du-site).",
    },
  ],
};

export type IndependentSiteInvitationInspectionStatus =
  | "valid"
  | "expired"
  | "revoked"
  | "already_used"
  | "not_found";

export interface IndependentSiteInvitationInspectionDto {
  status: IndependentSiteInvitationInspectionStatus;
  siteId: number | null;
  siteTitle: string | null;
  siteSlug: string | null;
  role: "admin" | "editor" | null;
  invitedEmail: string | null;
  expiresAt: string | null;
  emailMatchesViewer: boolean | null;
}

export function formatIndependentInvitationStatusNotice(
  inspection: IndependentSiteInvitationInspectionDto,
  viewerEmail?: string | null
): {
  title: string;
  description: string;
  actionGuidance: string;
  canAccept: boolean;
  tone: "emerald" | "amber" | "rose" | "slate";
} {
  if (inspection.status === "not_found") {
    return {
      title: "Lien d’invitation introuvable ou incomplet",
      description:
        "Ce lien d’invitation ne correspond à aucune invitation enregistrée. Vérifiez que l’adresse URL complète a bien été copiée sans coupure.",
      actionGuidance:
        "Demandez un nouveau lien d’invitation au propriétaire du site ou connectez-vous à votre espace si votre accès a déjà été activé.",
      canAccept: false,
      tone: "rose",
    };
  }

  if (inspection.status === "revoked") {
    return {
      title: "Invitation révoquée",
      description: `L’invitation pour le site « ${inspection.siteTitle || "ce site"} » a été révoquée par le propriétaire du site et ne peut plus être utilisée.`,
      actionGuidance:
        "Si vous pensez qu’il s’agit d’une erreur, contactez le propriétaire du site pour qu’il vous envoie une nouvelle invitation.",
      canAccept: false,
      tone: "rose",
    };
  }

  if (inspection.status === "already_used") {
    return {
      title: "Invitation déjà utilisée (accès actif)",
      description: `Ce lien d’invitation à usage unique pour « ${inspection.siteTitle || "ce site"} » a déjà été activé avec l’adresse ${inspection.invitedEmail || "invitée"}.`,
      actionGuidance:
        "Vous n’avez plus besoin de ce lien : connectez-vous directement via /connexion-administration pour accéder à l’administration de votre site.",
      canAccept: false,
      tone: "amber",
    };
  }

  if (inspection.status === "expired") {
    const expiredDateLabel = inspection.expiresAt
      ? new Date(inspection.expiresAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    return {
      title: "Invitation expirée",
      description: `Le délai de validité de cette invitation pour « ${inspection.siteTitle || "ce site"} » est dépassé${expiredDateLabel ? ` (expirée le ${expiredDateLabel})` : ""}.`,
      actionGuidance:
        "Pour votre sécurité, les invitations sont limitées dans le temps. Demandez au propriétaire du site de générer un nouveau lien d’invitation.",
      canAccept: false,
      tone: "amber",
    };
  }

  // status === "valid"
  const normalizedViewer = viewerEmail?.trim().toLowerCase() || null;
  const normalizedInvited = inspection.invitedEmail?.trim().toLowerCase() || null;
  if (normalizedViewer && normalizedInvited && normalizedViewer !== normalizedInvited) {
    return {
      title: "Adresse e-mail différente de l’adresse invitée",
      description: `Cette invitation a été envoyée à ${inspection.invitedEmail}, mais vous êtes actuellement connecté avec ${viewerEmail}.`,
      actionGuidance: `Connectez-vous sur /connexion-administration avec l’adresse exacte ${inspection.invitedEmail} pour pouvoir activer cet accès.`,
      canAccept: false,
      tone: "amber",
    };
  }

  const roleInfo = getIndependentSiteRolePresentation(inspection.role);
  return {
    title: `Invitation valide — ${roleInfo.title}`,
    description: `Vous êtes invité à rejoindre l’espace de gestion du site « ${inspection.siteTitle || "Site indépendant"} » avec le rôle ${roleInfo.shortLabel}.`,
    actionGuidance: normalizedViewer
      ? "Vérifiez les informations ci-dessous puis cliquez sur « Activer mon accès au site »."
      : `Connectez-vous ou créez votre compte avec l’adresse ${inspection.invitedEmail || "invitée"} pour activer votre accès.`,
    canAccept: Boolean(normalizedViewer && (!normalizedInvited || normalizedViewer === normalizedInvited)),
    tone: "emerald",
  };
}

export function formatIndependentInvitationErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "INDEPENDENT_SITE_INVITATION_INVALID";

  if (raw.includes("EMAIL_MISMATCH")) {
    return "L’adresse e-mail de votre session ne correspond pas à l’adresse e-mail invitée. Veuillez vous connecter avec l’adresse exacte indiquée sur l’invitation.";
  }
  if (raw.includes("EXPIRED")) {
    return "Cette invitation a expiré. Demandez au propriétaire du site de vous envoyer un nouveau lien d’invitation.";
  }
  if (raw.includes("REVOKED")) {
    return "Cette invitation a été révoquée par le propriétaire du site.";
  }
  if (raw.includes("ALREADY_USED")) {
    return "Ce lien d’invitation à usage unique a déjà été activé. Vous pouvez ouvrir directement votre espace via /connexion-administration.";
  }
  if (raw.includes("INDEPENDENT_SITE_INVITATION_INVALID")) {
    return "Cette invitation n’est plus valide (lien expiré, déjà utilisé, révoqué ou adresse e-mail différente de celle invitée).";
  }
  return raw;
}

export function sanitizeIndependentAdministrationReturnTo(
  rawReturnTo: string | null | undefined
): string {
  const candidate = (rawReturnTo || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/administration-site";
  }
  if (
    candidate === "/constructeur-sites" ||
    /^\/constructeur-sites\?(?:siteSlug=[a-z0-9-]{1,120}|siteId=[0-9]{1,12})$/.test(candidate) ||
    /^\/administration-site\?siteSlug=[a-z0-9-]{1,120}$/.test(candidate) ||
    /^\/administration-site\?siteId=[0-9]{1,12}$/.test(candidate) ||
    /^\/constructeur-sites\/invitation\/[A-Za-z0-9_-]{16,200}$/.test(candidate) ||
    /^\/constructeur-sites\/apercu\/[a-z0-9-]{1,120}$/.test(candidate) ||
    /^\/sites\/[a-z0-9-]{1,120}$/.test(candidate)
  ) {
    return candidate;
  }
  return "/administration-site";
}
