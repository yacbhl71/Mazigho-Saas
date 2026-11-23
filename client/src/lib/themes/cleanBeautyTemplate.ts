export interface MazighoGrapesBlock {
  id: string;
  label: string;
  category: string;
  content: string;
}

export interface MazighoThemeDefinition {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  blocks: MazighoGrapesBlock[];
}

/** Interface minimale compatible avec n'importe quelle version de GrapesJS */
export interface GrapesEditorLike {
  setComponents: (components: string) => unknown;
  setStyle: (style: string) => unknown;
  BlockManager: {
    add: (id: string, config: { label: string; category: string; content: string }) => unknown;
    get?: (id: string) => unknown;
  };
}

const makeProductImage = (bgFrom: string, bgTo: string, label: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgFrom}"/>
        <stop offset="100%" stop-color="${bgTo}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <ellipse cx="204" cy="244" rx="82" ry="13" fill="rgba(17,24,39,0.08)"/>
    <g transform="rotate(-14 200 150)">
      <rect x="162" y="66" width="76" height="154" rx="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
      <rect x="180" y="42" width="40" height="26" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <text x="200" y="150" text-anchor="middle" fill="#ec4899" font-family="Arial, sans-serif" font-size="13" font-weight="700">${label}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const STARS_HTML = `<span class="mz-cb-stars" aria-label="5 sur 5">★★★★★</span>`;

export const CLEAN_BEAUTY_CSS = `
.mz-cb-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
  background-color: #ffffff;
  line-height: 1.5;
  box-sizing: border-box;
}
.mz-cb-root *, .mz-cb-root *::before, .mz-cb-root *::after {
  box-sizing: border-box;
}
.mz-cb-root a {
  text-decoration: none;
  color: inherit;
}
.mz-cb-container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 24px;
}
.mz-cb-pink {
  color: #ec4899;
}

/* 1. Barre d'annonce */
.mz-cb-announcement {
  background-color: #0f172a;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  padding: 8px 16px;
}

/* 2. Header */
.mz-cb-header {
  background: #ffffff;
  border-bottom: 1px solid #f3f4f6;
}
.mz-cb-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 24px;
}
.mz-cb-logo {
  font-size: 20px;
  font-weight: 800;
  color: #ec4899;
  white-space: nowrap;
}
.mz-cb-search {
  flex: 1;
  max-width: 420px;
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 7px 14px;
  background: #f9fafb;
}
.mz-cb-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #111827;
}
.mz-cb-header-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 13.5px;
  font-weight: 500;
}
.mz-cb-cart-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mz-cb-cart-badge {
  background: #ec4899;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  min-width: 17px;
  height: 17px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
.mz-cb-nav {
  border-top: 1px solid #f3f4f6;
}
.mz-cb-nav-list {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 24px;
  overflow-x: auto;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}
.mz-cb-nav-list a:hover {
  color: #ec4899;
}
.mz-cb-mobile-menu {
  display: none;
  position: relative;
}
.mz-cb-mobile-menu summary {
  cursor: pointer;
  list-style: none;
  padding: 7px 11px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0;
  color: #111827;
}
.mz-cb-mobile-menu summary::-webkit-details-marker {
  display: none;
}
.mz-cb-mobile-menu summary::after {
  content: '☰';
  font-size: 18px;
}
.mz-cb-mobile-menu-panel {
  position: absolute;
  z-index: 20;
  right: 0;
  top: 42px;
  min-width: 190px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.14);
}
.mz-cb-mobile-menu-panel a {
  display: block;
  padding: 10px 8px;
  color: #111827;
}

/* Boutons */
.mz-cb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.mz-cb-btn-sm {
  padding: 9px 18px;
  font-size: 13px;
}
.mz-cb-btn-primary {
  background-color: #ec4899;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(236, 72, 153, 0.28);
}
.mz-cb-btn-outline {
  border: 1.5px solid #ec4899;
  color: #ec4899;
  background: rgba(255, 255, 255, 0.75);
}

/* 3. Hero */
.mz-cb-hero {
  background: radial-gradient(circle at 80% 25%, #f5d0fe 0%, #fdf2f8 48%, #eef2ff 100%);
  padding: 60px 0 48px;
}
.mz-cb-hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 44px;
}
.mz-cb-pill {
  display: inline-block;
  background: #ec4899;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.mz-cb-hero-title {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.12;
  margin: 0 0 16px;
}
.mz-cb-hero-desc {
  color: #4b5563;
  font-size: 15px;
  max-width: 460px;
  margin: 0 0 24px;
}
.mz-cb-hero-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.mz-cb-hero-media {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.1);
}
.mz-cb-hero-media img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}
.mz-cb-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
  margin-top: 52px;
  gap: 20px;
}
.mz-cb-stat-val {
  font-size: 22px;
  font-weight: 800;
}
.mz-cb-stat-lbl {
  font-size: 12.5px;
  color: #6b7280;
  margin-top: 2px;
}

/* Titres de sections */
.mz-cb-sec-head {
  text-align: center;
  max-width: 560px;
  margin: 0 auto 38px;
}
.mz-cb-sec-title {
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 10px;
}
.mz-cb-sec-sub {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 4. Catégories */
.mz-cb-categories {
  padding: 64px 0;
  background: #ffffff;
}
.mz-cb-cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 30px;
}
.mz-cb-cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 16px;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(17, 24, 39, 0.04);
}
.mz-cb-cat-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #fdf2f8;
  color: #ec4899;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.mz-cb-cat-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

/* 5. Produits Vedettes */
.mz-cb-products {
  padding: 68px 0;
  background: #f9fafb;
}
.mz-cb-prod-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.mz-cb-prod-card {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(17, 24, 39, 0.04);
  display: flex;
  flex-direction: column;
}
.mz-cb-prod-media {
  position: relative;
  height: 205px;
  overflow: hidden;
}
.mz-cb-prod-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mz-cb-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 999px;
}
.mz-cb-badge-pink { background: #ec4899; }
.mz-cb-badge-red { background: #ef4444; }
.mz-cb-badge-amber { background: #f59e0b; }
.mz-cb-wish {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffffff;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
}
.mz-cb-prod-body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.mz-cb-prod-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 6px;
}
.mz-cb-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #6b7280;
}
.mz-cb-stars {
  color: #facc15;
  letter-spacing: 1px;
  font-size: 13px;
}
.mz-cb-prod-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.mz-cb-price {
  font-size: 17px;
  font-weight: 800;
  color: #ec4899;
}
.mz-cb-prod-acts {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mz-cb-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #4b5563;
}
.mz-cb-add-btn {
  background: #ec4899;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 999px;
}
.mz-cb-center-cta {
  text-align: center;
  margin-top: 36px;
}

/* 6. Témoignages */
.mz-cb-testimonials {
  padding: 68px 0;
  background: #ffffff;
}
.mz-cb-testi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.mz-cb-testi-card {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 2px 10px rgba(17, 24, 39, 0.04);
  display: flex;
  flex-direction: column;
}
.mz-cb-testi-text {
  font-size: 13.5px;
  color: #4b5563;
  margin: 12px 0;
  flex: 1;
}
.mz-cb-testi-prod {
  font-size: 11.5px;
  color: #6b7280;
  margin: 0 0 14px;
}
.mz-cb-author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mz-cb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mz-cb-author-name {
  font-size: 13.5px;
  font-weight: 700;
}
.mz-cb-author-sub {
  font-size: 11.5px;
  color: #6b7280;
}

/* 7 & 8. Bannières roses */
.mz-cb-banner-help {
  background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%);
  padding: 46px 24px;
  text-align: center;
  margin-bottom: 24px;
}
.mz-cb-banner-news {
  background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%);
  padding: 52px 24px;
  text-align: center;
}
.mz-cb-banner-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 8px;
}
.mz-cb-banner-text {
  font-size: 13.5px;
  color: #4b5563;
  max-width: 520px;
  margin: 0 auto 20px;
}
.mz-cb-news-form {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 420px;
  margin: 0 auto;
}
.mz-cb-news-form input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 13.5px;
  outline: none;
}

/* 9. Footer */
.mz-cb-footer {
  background: #111827;
  color: #cbd5e1;
  padding-top: 50px;
}
.mz-cb-footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 32px;
  padding-bottom: 40px;
}
.mz-cb-footer h3 {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 14px;
}
.mz-cb-footer p,
.mz-cb-footer li {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.7;
}
.mz-cb-footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.mz-cb-footer-bottom {
  border-top: 1px solid #1f2937;
  padding: 18px 24px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 960px) {
  .mz-cb-hero-grid { grid-template-columns: 1fr; }
  .mz-cb-cat-grid,
  .mz-cb-footer-grid { grid-template-columns: repeat(2, 1fr); }
  .mz-cb-prod-grid,
  .mz-cb-testi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .mz-cb-header-top { flex-wrap: wrap; }
  .mz-cb-search { order: 3; max-width: 100%; flex-basis: 100%; }
  .mz-cb-nav-list { justify-content: flex-end; gap: 0; padding: 8px 16px; }
  .mz-cb-nav-list > a { display: none; }
  .mz-cb-mobile-menu { display: block; }
  .mz-cb-cat-grid,
  .mz-cb-prod-grid,
  .mz-cb-testi-grid,
  .mz-cb-stats-row,
  .mz-cb-footer-grid { grid-template-columns: 1fr; }
  .mz-cb-news-form { flex-direction: column; }
  .mz-cb-news-form input,
  .mz-cb-news-form button { width: 100%; }
}
`;

const BLOCK_ANNOUNCEMENT: MazighoGrapesBlock = {
  id: 'mz-cb-announcement',
  label: "Barre d'annonce",
  category: 'Clean Beauty',
  content: `
    <div class="mz-cb-announcement" data-gjs-name="Barre d'annonce">
      Livraison offerte dès 50 € d'achat • Offre spéciale -15% avec le code ECLAT15
    </div>
  `,
};

const BLOCK_HEADER: MazighoGrapesBlock = {
  id: 'mz-cb-header',
  label: 'En-tête Boutique',
  category: 'Clean Beauty',
  content: `
    <header class="mz-cb-header" data-gjs-name="En-tête Boutique">
      <div class="mz-cb-container mz-cb-header-top">
        <a href="#accueil" class="mz-cb-logo">Maison Élégance</a>
        <div class="mz-cb-search">
          <input type="text" placeholder="Rechercher un produit..." />
          <span>🔍</span>
        </div>
        <div class="mz-cb-header-actions">
          <a href="#compte">Compte</a>
          <a href="#panier" class="mz-cb-cart-wrap">
            <span>🛒</span>
            <span class="mz-cb-cart-badge">0</span>
          </a>
        </div>
      </div>
      <nav class="mz-cb-nav">
        <div class="mz-cb-container mz-cb-nav-list">
          <a href="#accueil">Accueil</a>
          <a href="#cosmetiques">Cosmétiques ▾</a>
          <a href="#coiffure">Coiffure ▾</a>
          <a href="#accessoires">Accessoires ▾</a>
          <a href="#vetements">Vêtements ▾</a>
          <a href="#coffrets">Coffrets ▾</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
          <details class="mz-cb-mobile-menu">
            <summary aria-label="Ouvrir le menu mobile">Menu</summary>
            <div class="mz-cb-mobile-menu-panel">
              <a href="#accueil">Accueil</a>
              <a href="#cosmetiques">Cosmétiques</a>
              <a href="#coiffure">Coiffure</a>
              <a href="#accessoires">Accessoires</a>
              <a href="#vetements">Vêtements</a>
              <a href="#coffrets">Coffrets</a>
              <a href="#blog">Blog</a>
              <a href="#contact">Contact</a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  `,
};

const BLOCK_HERO: MazighoGrapesBlock = {
  id: 'mz-cb-hero',
  label: 'Hero + Statistiques',
  category: 'Clean Beauty',
  content: `
    <section id="accueil" class="mz-cb-hero" data-gjs-name="Hero Principal">
      <div class="mz-cb-container">
        <div class="mz-cb-hero-grid">
          <div>
            <span class="mz-cb-pill">Nouvelle Collection</span>
            <h1 class="mz-cb-hero-title">
              Découvrez votre <br />
              <span class="mz-cb-pink">beauté naturelle</span>
            </h1>
            <p class="mz-cb-hero-desc">
              Des soins formulés avec des ingrédients essentiels pour révéler l'éclat
              de votre peau au quotidien, tout en douceur et avec élégance.
            </p>
            <div class="mz-cb-hero-btns">
              <a href="#produits" class="mz-cb-btn mz-cb-btn-primary">Découvrir la collection</a>
              <a href="#categories" class="mz-cb-btn mz-cb-btn-outline">En savoir plus</a>
            </div>
          </div>
          <div class="mz-cb-hero-media">
            <img src="${makeProductImage('#f5d0fe', '#fdf2f8', 'SOIN ÉCLAT')}" alt="Collection beauté naturelle" />
          </div>
        </div>
        <div class="mz-cb-stats-row">
          <div>
            <div class="mz-cb-stat-val">Plus de 1 000</div>
            <div class="mz-cb-stat-lbl">Produits sélectionnés</div>
          </div>
          <div>
            <div class="mz-cb-stat-val">Plus de 50 000</div>
            <div class="mz-cb-stat-lbl">Clients satisfaits</div>
          </div>
          <div>
            <div class="mz-cb-stat-val">4,9/5</div>
            <div class="mz-cb-stat-lbl">Note moyenne</div>
          </div>
        </div>
      </div>
    </section>
  `,
};

const BLOCK_CATEGORIES: MazighoGrapesBlock = {
  id: 'mz-cb-categories',
  label: 'Grille Catégories',
  category: 'Clean Beauty',
  content: `
    <section id="categories" class="mz-cb-categories" data-gjs-name="Nos Catégories" data-mazigho-zone="categories">
      <div class="mz-cb-container">
        <h2 class="mz-cb-sec-title">Nos Catégories</h2>
        <div class="mz-cb-cat-grid">
          <a href="#cosmetiques" class="mz-cb-cat-card">
            <div class="mz-cb-cat-circle">✨</div>
            <span class="mz-cb-cat-name">Cosmétiques</span>
          </a>
          <a href="#coiffure" class="mz-cb-cat-card">
            <div class="mz-cb-cat-circle">✂️</div>
            <span class="mz-cb-cat-name">Coiffure</span>
          </a>
          <a href="#accessoires" class="mz-cb-cat-card">
            <div class="mz-cb-cat-circle">👜</div>
            <span class="mz-cb-cat-name">Accessoires</span>
          </a>
          <a href="#vetements" class="mz-cb-cat-card">
            <div class="mz-cb-cat-circle">👗</div>
            <span class="mz-cb-cat-name">Vêtements</span>
          </a>
        </div>
      </div>
    </section>
  `,
};

const productCardHtml = (
  title: string,
  price: string,
  reviews: number,
  badgeText: string,
  badgeClass: string,
  c1: string,
  c2: string
) => `
  <article class="mz-cb-prod-card">
    <div class="mz-cb-prod-media">
      <img src="${makeProductImage(c1, c2, 'ÉCLAT')}" alt="${title}" />
      <span class="mz-cb-badge ${badgeClass}">${badgeText}</span>
      <span class="mz-cb-wish">♡</span>
    </div>
    <div class="mz-cb-prod-body">
      <h3 class="mz-cb-prod-title">${title}</h3>
      <div class="mz-cb-rating">${STARS_HTML} <span>(${reviews})</span></div>
      <div class="mz-cb-prod-foot">
        <span class="mz-cb-price">${price}</span>
        <div class="mz-cb-prod-acts">
          <span class="mz-cb-icon-btn">👁</span>
          <a href="#panier" class="mz-cb-add-btn">+ Ajouter</a>
        </div>
      </div>
    </div>
  </article>
`;

const BLOCK_PRODUCTS: MazighoGrapesBlock = {
  id: 'mz-cb-products',
  label: 'Produits Vedettes (3x2)',
  category: 'Clean Beauty',
  content: `
    <section id="produits" class="mz-cb-products" data-gjs-name="Produits Vedettes" data-mazigho-zone="featured-products">
      <div class="mz-cb-container">
        <div class="mz-cb-sec-head">
          <h2 class="mz-cb-sec-title">Produits Vedettes</h2>
          <p class="mz-cb-sec-sub">
            Découvrez nos indispensables du moment, plébiscités par notre communauté pour leur efficacité et leur douceur.
          </p>
        </div>
        <div class="mz-cb-prod-grid">
          ${productCardHtml('Sérum Éclat Hydratant', '49,99 €', 128, 'Nouveau', 'mz-cb-badge-pink', '#fce7f3', '#f8fafc')}
          ${productCardHtml('Crème Régénérante Nuit', '59,99 €', 94, '-20%', 'mz-cb-badge-red', '#ede9fe', '#f8fafc')}
          ${productCardHtml('Masque Purifiant Argile', '39,99 €', 215, 'Best-seller', 'mz-cb-badge-amber', '#fef3c7', '#f8fafc')}
          ${productCardHtml('Huile Botanique Visage', '38,99 €', 76, 'Nouveau', 'mz-cb-badge-pink', '#dcfce7', '#f8fafc')}
          ${productCardHtml('Lotion Tonique Douce', '44,99 €', 112, '-15%', 'mz-cb-badge-red', '#ffe4e6', '#f8fafc')}
          ${productCardHtml('Coffret Rituel Beauté', '79,99 €', 304, 'Best-seller', 'mz-cb-badge-amber', '#f3e8ff', '#f8fafc')}
        </div>
        <div class="mz-cb-center-cta">
          <a href="#boutique" class="mz-cb-btn mz-cb-btn-primary mz-cb-btn-sm">Voir tous les produits</a>
        </div>
      </div>
    </section>
  `,
};

const testimonialCardHtml = (
  quote: string,
  product: string,
  initials: string,
  author: string
) => `
  <article class="mz-cb-testi-card">
    <div>${STARS_HTML}</div>
    <p class="mz-cb-testi-text">"${quote}"</p>
    <p class="mz-cb-testi-prod">Produit : ${product}</p>
    <div class="mz-cb-author">
      <div class="mz-cb-avatar">${initials}</div>
      <div>
        <div class="mz-cb-author-name">${author}</div>
        <div class="mz-cb-author-sub">Client vérifié</div>
      </div>
    </div>
  </article>
`;

const BLOCK_TESTIMONIALS: MazighoGrapesBlock = {
  id: 'mz-cb-testimonials',
  label: 'Témoignages Clients',
  category: 'Clean Beauty',
  content: `
    <section class="mz-cb-testimonials" data-gjs-name="Avis Clients">
      <div class="mz-cb-container">
        <div class="mz-cb-sec-head">
          <h2 class="mz-cb-sec-title">Ce que disent nos clients</h2>
          <p class="mz-cb-sec-sub">
            Des milliers de retours authentiques partagés par notre communauté après avoir adopté notre routine.
          </p>
        </div>
        <div class="mz-cb-testi-grid">
          ${testimonialCardHtml("Texture incroyable et résultats visibles dès la première semaine. Ma peau n'a jamais été aussi lumineuse.", 'Sérum Éclat Hydratant', 'MD', 'Marie Dupont')}
          ${testimonialCardHtml('Livraison rapide et emballage très soigné. Je recommande cette boutique les yeux fermés.', 'Crème Régénérante Nuit', 'SL', 'Sophie Laurent')}
          ${testimonialCardHtml('Un vrai moment de détente à la maison. Parfum naturel et discret, parfait pour les peaux sensibles.', 'Masque Purifiant Argile', 'CB', 'Camille Bernard')}
          ${testimonialCardHtml('Commandé pour un cadeau, la présentation est magnifique et le service client très réactif.', 'Coffret Rituel Beauté', 'CM', 'Chloé Martin')}
          ${testimonialCardHtml("Pénètre rapidement sans film gras. C'est devenu un indispensable de ma routine quotidienne.", 'Huile Botanique Visage', 'JM', 'Julie Moreau')}
          ${testimonialCardHtml('Excellent rapport qualité-prix. Des ingrédients propres qui respectent vraiment la peau.', 'Lotion Tonique Douce', 'LP', 'Léa Petit')}
        </div>
        <div class="mz-cb-stats-row">
          <div>
            <div class="mz-cb-stat-val mz-cb-pink">4,9/5</div>
            <div class="mz-cb-stat-lbl">Note moyenne</div>
          </div>
          <div>
            <div class="mz-cb-stat-val mz-cb-pink">Plus de 50 000</div>
            <div class="mz-cb-stat-lbl">Avis clients</div>
          </div>
          <div>
            <div class="mz-cb-stat-val mz-cb-pink">98%</div>
            <div class="mz-cb-stat-lbl">Clients satisfaits</div>
          </div>
        </div>
      </div>
    </section>
  `,
};

const BLOCK_HELP_AND_NEWSLETTER: MazighoGrapesBlock = {
  id: 'mz-cb-banners',
  label: "Bannière Aide & Newsletter",
  category: 'Clean Beauty',
  content: `
    <div data-gjs-name="Bannières Aide & Newsletter">
      <section class="mz-cb-banner-help">
        <h2 class="mz-cb-banner-title">Besoin d'aide ?</h2>
        <p class="mz-cb-banner-text">
          Notre équipe d'experts beauté est disponible pour vous conseiller et répondre à toutes vos questions.
        </p>
        <a href="#contact" class="mz-cb-btn mz-cb-btn-primary mz-cb-btn-sm">Nous contacter</a>
      </section>
      <section class="mz-cb-banner-news">
        <h2 class="mz-cb-banner-title">Restez informé de nos nouveautés</h2>
        <p class="mz-cb-banner-text">
          Inscrivez-vous pour recevoir nos offres exclusives, lancements et conseils beauté en avant-première.
        </p>
        <form class="mz-cb-news-form">
          <input type="email" placeholder="Votre adresse e-mail" />
          <button type="submit" class="mz-cb-btn mz-cb-btn-primary mz-cb-btn-sm">S'inscrire</button>
        </form>
      </section>
    </div>
  `,
};

const BLOCK_FOOTER: MazighoGrapesBlock = {
  id: 'mz-cb-footer',
  label: 'Pied de page Boutique',
  category: 'Clean Beauty',
  content: `
    <footer class="mz-cb-footer" data-gjs-name="Pied de page">
      <div class="mz-cb-container mz-cb-footer-grid">
        <div>
          <h3>À propos</h3>
          <p>
            Maison Élégance propose une sélection raffinée de cosmétiques, soins et accessoires
            pensés pour sublimer votre quotidien.
          </p>
        </div>
        <div>
          <h3>Liens rapides</h3>
          <ul>
            <li><a href="#accueil">Accueil</a></li>
            <li><a href="#categories">Catégories</a></li>
            <li><a href="#produits">Produits vedettes</a></li>
            <li><a href="#blog">Blog beauté</a></li>
          </ul>
        </div>
        <div>
          <h3>Service client</h3>
          <ul>
            <li><a href="#livraison">Livraison &amp; retours</a></li>
            <li><a href="#faq">Questions fréquentes</a></li>
            <li><a href="#cgv">Conditions générales</a></li>
            <li><a href="#confidentialite">Confidentialité</a></li>
          </ul>
        </div>
        <div>
          <h3>Contact</h3>
          <ul>
            <li>contact@maison-elegance.fr</li>
            <li>+33 1 23 45 67 89</li>
            <li>Lun - Ven : 9h00 - 18h00</li>
          </ul>
        </div>
      </div>
      <div class="mz-cb-footer-bottom">
        © 2026 Maison Élégance. Tous droits réservés.
      </div>
    </footer>
  `,
};

export const CLEAN_BEAUTY_BLOCKS: MazighoGrapesBlock[] = [
  BLOCK_ANNOUNCEMENT,
  BLOCK_HEADER,
  BLOCK_HERO,
  BLOCK_CATEGORIES,
  BLOCK_PRODUCTS,
  BLOCK_TESTIMONIALS,
  BLOCK_HELP_AND_NEWSLETTER,
  BLOCK_FOOTER,
];

export const CLEAN_BEAUTY_HTML = `
  <div class="mz-cb-root" data-gjs-name="Page Boutique Clean Beauty">
    ${CLEAN_BEAUTY_BLOCKS.map((block) => block.content).join('\n')}
  </div>
`;

export const CLEAN_BEAUTY_THEME: MazighoThemeDefinition = {
  id: 'clean-beauty-elegance',
  name: 'Clean Beauty — Élégance',
  description: 'Vitrine cosmétique lumineuse avec Hero dégradé pastel, grille produits 3x2 et avis clients.',
  html: CLEAN_BEAUTY_HTML,
  css: CLEAN_BEAUTY_CSS,
  blocks: CLEAN_BEAUTY_BLOCKS,
};

/** Helper prêt à appeler lors de l'initialisation de GrapesJS ou au clic sur le thème */
export function applyCleanBeautyTheme(editor: GrapesEditorLike): void {
  CLEAN_BEAUTY_THEME.blocks.forEach((block) => {
    if (!editor.BlockManager.get || !editor.BlockManager.get(block.id)) {
      editor.BlockManager.add(block.id, {
        label: block.label,
        category: block.category,
        content: block.content,
      });
    }
  });

  editor.setStyle(CLEAN_BEAUTY_THEME.css);
  editor.setComponents(CLEAN_BEAUTY_THEME.html);
}
