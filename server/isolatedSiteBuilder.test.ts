import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  INDEPENDENT_BLOCK_CATEGORIES,
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_HELP_GUIDES,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_MODULE_CATEGORIES,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_PROJECT_MODE_OPTIONS,
  INDEPENDENT_RESPONSIVE_BASE_CSS,
  INDEPENDENT_SITE_TEMPLATES,
  INDEPENDENT_SITE_TYPE_OPTIONS,
  RESPONSIVE_DEVICE_PRESETS,
  RESPONSIVE_VIEWPORTS,
  VISUAL_CARD_USE_CASE_PRESETS,
  addCardToVisualCardGrid,
  applyVisualCardUseCasePreset,
  assertNoSecretsInIndependentSite,
  assertZeroEcommerceInIndependentSite,
  buildEditorPreviewUrl,
  buildImageTransformCss,
  buildIndependentBuilderSelectionUrl,
  buildLocalSafetyStorageKey,
  buildNavigationFromPages,
  buildPageSeoPreview,
  buildPreviewReturnUrl,
  computeIndependentProjectWorkflowState,
  createDefaultVisualCardItem,
  createLocalSafetySnapshot,
  duplicateCardInVisualCardGrid,
  ensureNonEmptyIndependentPages,
  extractImagesFromPageHtml,
  filterIndependentBlocks,
  filterIndependentModules,
  filterIndependentSocles,
  filterIndependentTemplates,
  formatIndependentBuilderErrorMessage,
  parseBuilderQueryParams,
  removeCardFromVisualCardGrid,
  renderVisualCardGridHtml,
  resolveIndependentProjectMode,
  resolveInitialIndependentSiteId,
  sanitizeBuilderImageSrc,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  setVisualCardGridShape,
  setVisualCardGridTextPlacement,
  shouldOfferLocalSafetyRestore,
  updateCardInVisualCardGrid,
  updateImageAltInPageHtml,
  validateIndependentCustomDomain,
  type VisualCardGridConfig,
  DEMO_CONTENT_NOTICE_LABEL,
  INDEPENDENT_NAV_AND_FOOTER_PRESETS,
  INDEPENDENT_SITE_EXPORT_FORMAT,
  INDEPENDENT_SITE_EXPORT_MAX_BYTES,
  MAX_INDEPENDENT_SUBMENU_DEPTH,
  assessIndependentMediaItem,
  auditIndependentPageSeo,
  auditIndependentSiteAccessibility,
  auditIndependentSiteResponsive,
  buildIndependentVersionPreview,
  computeColorContrastRatio,
  detectIndependentDemoContentStatus,
  duplicateIndependentPageInList,
  duplicateIndependentReusableBlockInList,
  evaluateIndependentSiteQualityAndChecklist,
  exportIndependentSiteProjectToJson,
  filterIndependentMediaItems,
  generateUniquePageSlug,
  reorderIndependentPagesMenu,
  repairKnownIndependentInternalLinks,
  replaceMediaUrlAcrossPages,
  shouldAutoCreateVersionOnSave,
  validateAndSanitizeIndependentSiteImport,
  verifyIndependentInternalLinks,
} from "../shared/isolatedSiteBuilder";
import {
  addIndependentSiteDomain,
  addIndependentSiteMedia,
  createIndependentCollaboratorPreviewShare,
  createIndependentSiteFormSubmission,
  createIndependentSiteProject,
  deleteIndependentSiteMedia,
  duplicateIndependentSiteProject,
  ensureAthVahloulDemoProject,
  exportIndependentSiteProjectJson,
  getIndependentSiteProject,
  getIndependentSiteAnalyticsSummary,
  getPublicIndependentSiteBySlug,
  importIndependentSiteProjectJson,
  listIndependentCollaboratorPreviewShares,
  listIndependentPublicationLogs,
  listIndependentSiteDomains,
  listIndependentSiteMedia,
  listIndependentSiteProjects,
  listIndependentSiteVersions,
  publishIndependentSiteProject,
  recordIndependentSitePageView,
  repairKnownIndependentSiteLinks,
  removeIndependentSiteDomain,
  restoreIndependentSiteVersion,
  revokeIndependentCollaboratorPreviewShare,
  saveIndependentSiteProject,
  unpublishIndependentSiteProject,
  updateIndependentSiteMediaMetadata,
  updateIndependentSiteMediaTransforms,
  updateIndependentSiteStatus,
  verifyIndependentCollaboratorPreviewToken,
  verifyIndependentSiteDomain,
} from "./isolatedSiteBuilderDb";

describe("Constructeur de Sites Internet Indépendant (Produit isolé sans boutique)", () => {
  it("1. expose les 8 catégories de sites, les 7 bibliothèques séparées et les 5 formats responsive (320px à 1440px)", () => {
    expect(INDEPENDENT_SITE_TYPE_OPTIONS.map((t) => t.value)).toEqual([
      "vitrine",
      "association",
      "familial",
      "professionnel",
      "personnel",
      "evenementiel",
      "institutionnel",
      "services",
    ]);

    expect(INDEPENDENT_BUILDER_LIBRARY_TABS.map((tab) => tab.label)).toEqual([
      "Pages",
      "Blocs",
      "Médias",
      "Calques",
      "Modules",
      "Socles",
      "Modèles",
    ]);

    expect(RESPONSIVE_VIEWPORTS.map((v) => v.id)).toEqual(["desktop", "tablet", "mobile"]);
    expect(RESPONSIVE_DEVICE_PRESETS.map((p) => p.maxWidthPx)).toEqual([1440, 1024, 768, 414, 320]);
    expect(INDEPENDENT_RESPONSIVE_BASE_CSS).toContain("prefers-reduced-motion");
    expect(INDEPENDENT_RESPONSIVE_BASE_CSS).toContain("@media (max-width: 640px)");
    expect(INDEPENDENT_RESPONSIVE_BASE_CSS).toContain('[data-site-block="header-ath-vahloul"] nav');
    expect(INDEPENDENT_RESPONSIVE_BASE_CSS).toContain('[data-site-block="hero-ath-vahloul"] h1');
  });

  it("2. garantit l’absence totale de composants e-commerce dans les Blocs, Modules, Socles et les 10 Modèles complets", () => {
    expect(INDEPENDENT_BUILDER_BLOCKS.length).toBeGreaterThanOrEqual(20);
    expect(INDEPENDENT_BUILDER_MODULES.length).toBe(8);
    expect(INDEPENDENT_PAGE_SOCLES.length).toBe(9);
    expect(INDEPENDENT_SITE_TEMPLATES.length).toBe(10);

    for (const block of INDEPENDENT_BUILDER_BLOCKS) {
      expect(block.content).not.toContain('data-mazigho-dynamic="catalogue"');
      expect(block.id).not.toMatch(/product|cart|checkout|payment|stock/i);
    }

    for (const socle of INDEPENDENT_PAGE_SOCLES) {
      expect(() => assertZeroEcommerceInIndependentSite(socle)).not.toThrow();
    }

    for (const tpl of INDEPENDENT_SITE_TEMPLATES) {
      expect(tpl.pages.length).toBeGreaterThanOrEqual(3);
      expect(() => assertZeroEcommerceInIndependentSite(tpl)).not.toThrow();
    }

    expect(() =>
      assertZeroEcommerceInIndependentSite({
        title: "Tentative injection boutique",
        storeId: 42,
      })
    ).toThrow(/INDEPENDENT_SITE_ECOMMERCE_DEPENDENCY_FORBIDDEN/);
  });

  it("2 bis. filtre et recherche dans la bibliothèque (blocs, modules, socles et modèles) par texte, catégorie et type de site", () => {
    expect(INDEPENDENT_BLOCK_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(INDEPENDENT_MODULE_CATEGORIES.length).toBeGreaterThanOrEqual(3);

    // Recherche et filtrage des blocs
    const heroBlocks = filterIndependentBlocks({
      category: "Hero & Bannières",
    });
    expect(heroBlocks.length).toBeGreaterThanOrEqual(2);
    expect(heroBlocks.every((b) => b.category === "Hero & Bannières")).toBe(true);

    const faqBlocks = filterIndependentBlocks({
      search: "FAQ",
    });
    expect(faqBlocks.some((b) => b.id.includes("faq"))).toBe(true);

    // Recherche et filtrage des modules
    const eventModules = filterIndependentModules({
      search: "événements",
    });
    expect(eventModules.some((m) => m.id === "module-events-calendar")).toBe(true);

    const contactModules = filterIndependentModules({
      category: "Interactions & Médias",
    });
    expect(contactModules.some((m) => m.id === "module-interactive-form")).toBe(true);

    // Recherche et filtrage des socles
    const familySocles = filterIndependentSocles({
      siteType: "familial",
    });
    expect(familySocles.some((s) => s.id === "socle-famille")).toBe(true);

    // Recherche et filtrage des 10 modèles complets
    const assocTemplates = filterIndependentTemplates({
      siteType: "association",
    });
    expect(assocTemplates.length).toBeGreaterThanOrEqual(3);

    const marriageTemplates = filterIndependentTemplates({
      search: "mariage",
    });
    expect(marriageTemplates.some((t) => t.id === "modele-rencontre-evenementiel")).toBe(true);
  });

  it("3. applique toutes les transformations d’images (rotation, inclinaison, retournement H/V, zoom, positionnement libre)", () => {
    const css = buildImageTransformCss({
      rotationDeg: 35,
      skewXDeg: -10,
      skewYDeg: 15,
      flipHorizontal: true,
      flipVertical: false,
      scalePercent: 140,
      offsetX: 25,
      offsetY: -40,
      widthPx: 480,
      heightPx: 320,
      borderRadiusPx: 24,
    });

    expect(css).toContain("translate(25px, -40px)");
    expect(css).toContain("rotate(35deg)");
    expect(css).toContain("skew(-10deg, 15deg)");
    expect(css).toContain("scale(-1.4, 1.4)");
    expect(css).toContain("width:480px");
    expect(css).toContain("height:320px");
    expect(css).toContain("border-radius:24px");
  });

  it("4. gère l’Atelier Cartes Visuelles complet (ajout +, duplication, suppression, modification, formes carrée/rectangulaire/ronde, position du texte, colonnes, espacement et préréglages d’usage)", () => {
    expect(VISUAL_CARD_USE_CASE_PRESETS.length).toBeGreaterThanOrEqual(8);

    let grid: VisualCardGridConfig = {
      sectionEyebrow: "Actions",
      sectionTitle: "Nos cartes",
      columns: 3,
      gapPx: 24,
      shape: "square",
      textPlacement: "top",
      showButton: true,
      cards: [
        createDefaultVisualCardItem(1, {
          id: "c1",
          title: "Carte Initiale",
          shape: "square",
          textPlacement: "top",
        }),
      ],
    };

    // Bouton "+" pour ajouter une nouvelle carte
    grid = addCardToVisualCardGrid(grid, {
      id: "c2",
      title: "Carte Ajoutée via +",
      shape: "round",
      textPlacement: "inside",
    });
    expect(grid.cards).toHaveLength(2);

    // Duplication d'une carte existante
    grid = duplicateCardInVisualCardGrid(grid, "c1");
    expect(grid.cards).toHaveLength(3);
    expect(grid.cards[1].title).toBe("Carte Initiale (copie)");

    // Modification directe d'une carte (titre, sous-titre, description, bouton)
    grid = updateCardInVisualCardGrid(grid, "c2", {
      title: "Carte Modifiée",
      subtitle: "Nouveau Badge",
      description: "Description personnalisée",
      buttonLabel: "Voir le détail",
      buttonHref: "/detail",
    });
    expect(grid.cards.find((c) => c.id === "c2")?.title).toBe("Carte Modifiée");
    expect(grid.cards.find((c) => c.id === "c2")?.buttonHref).toBe("/detail");

    // Changement global de forme (square, rectangular, round) et position du texte (top, bottom, inside)
    grid = setVisualCardGridShape(grid, "round");
    expect(grid.shape).toBe("round");
    expect(grid.cards.every((c) => c.shape === "round")).toBe(true);

    grid = setVisualCardGridTextPlacement(grid, "bottom");
    expect(grid.textPlacement).toBe("bottom");
    expect(grid.cards.every((c) => c.textPlacement === "bottom")).toBe(true);

    // Suppression d'une carte (tout en empêchant de tomber à 0 carte)
    grid = removeCardFromVisualCardGrid(grid, "c2");
    expect(grid.cards).toHaveLength(2);

    const html = renderVisualCardGridHtml(grid);
    expect(html).toContain('data-site-card-grid="true"');
    expect(html).toContain('data-card-columns="3"');
    expect(html).toContain("gap:24px");
    expect(html).toContain('data-card-shape="round"');
    expect(html).toContain('data-card-text="bottom"');

    // Application d'un préréglage d'usage (ex. membres)
    const membersGrid = applyVisualCardUseCasePreset("membres");
    expect(membersGrid.useCase).toBe("membres");
    expect(membersGrid.shape).toBe("round");
    expect(membersGrid.cards).toHaveLength(3);
  });

  it("4 bis. neutralise les contenus exécutables avant rendu public et gère le SEO et les textes alternatifs d’images", () => {
    const safeHtml = sanitizeIndependentHtml(
      '<section onclick="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">Lien</a></section>'
    );
    expect(safeHtml).not.toMatch(/script|onclick|javascript:/i);
    expect(safeHtml).toContain('href="#"');
    expect(sanitizeIndependentCss(".x{background:url(javascript:alert(1));x:expression(alert(1))}")).not.toMatch(
      /javascript:|expression\s*\(/i
    );
    const svgImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";
    expect(sanitizeBuilderImageSrc(svgImage)).toBe(svgImage);
    expect(sanitizeBuilderImageSrc("data:text/html,<script>alert(1)</script>")).not.toContain("script");

    // Extraction et mise à jour du texte alternatif (alt) des images d'une page
    const samplePageHtml =
      '<section><img src="https://example.com/a.jpg" alt="Ancien Alt 1" /><img src="https://example.com/b.jpg" /></section>';
    const extracted = extractImagesFromPageHtml(samplePageHtml);
    expect(extracted).toHaveLength(2);
    expect(extracted[0].alt).toBe("Ancien Alt 1");
    expect(extracted[1].alt).toBe("");

    const updatedHtml = updateImageAltInPageHtml(samplePageHtml, 1, "Photo de l’équipe bénévole");
    const reExtracted = extractImagesFromPageHtml(updatedHtml);
    expect(reExtracted[1].alt).toBe("Photo de l’équipe bénévole");

    // Aperçu SEO d'une page
    const preview = buildPageSeoPreview(
      {
        id: "p1",
        title: "Nos Activités",
        slug: "/activites",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public",
        seoTitle: "Activités culturelles & ateliers | Association",
        seoDescription: "Découvrez nos ateliers hebdomadaires et rencontres.",
        indexable: false,
        html: updatedHtml,
        css: "",
      },
      "association-atlas"
    );
    expect(preview.displayTitle).toBe("Activités culturelles & ateliers | Association");
    expect(preview.canonicalUrl).toBe("https://sites.mazigho.com/sites/association-atlas/activites");
    expect(preview.robotsDirective).toBe("noindex, nofollow");
  });

  it("5. fournit les 9 Socles de page prêts à personnaliser (Accueil, Association, Famille, Entreprise, Services, Contact, Événements, Équipe, Actualités)", () => {
    expect(INDEPENDENT_PAGE_SOCLES.map((s) => s.id)).toEqual([
      "socle-accueil",
      "socle-association",
      "socle-famille",
      "socle-entreprise",
      "socle-services",
      "socle-contact",
      "socle-evenements",
      "socle-equipe",
      "socle-actualites",
    ]);
  });

  it("6. crée la démonstration complète « Association familiale ATH VAHLOUL » et permet de créer un site depuis chacun des 10 modèles", async () => {
    const ownerId = 701;
    const demo = await ensureAthVahloulDemoProject(ownerId);

    expect(demo.title).toBe("Association familiale ATH VAHLOUL");
    expect(demo.siteType).toBe("familial");
    expect(demo.templateId).toBe(ATH_VAHLOUL_DEMO_TEMPLATE_ID);
    expect(demo.pages).toHaveLength(7);
    expect(demo.pages.map((p) => p.slug)).toEqual([
      "/",
      "/notre-famille",
      "/evenements",
      "/assemblees-rapports",
      "/entraide",
      "/annonces",
      "/contact",
    ]);

    const homePage = demo.pages.find((p) => p.slug === "/")!;
    const announcementsPage = demo.pages.find((p) => p.slug === "/annonces")!;
    expect(homePage.seoTitle).toContain("Démonstration");
    expect(String(homePage.html)).toContain("Démonstration à personnaliser");
    expect(String(homePage.html)).toContain("textes, dates, coordonnées et illustrations");
    expect(announcementsPage.visibility).toBe("members");
    expect(announcementsPage.indexable).toBe(false);
    expect(String(announcementsPage.html)).toContain("La mémoire se partage avec consentement");
    expect(String(announcementsPage.html)).toContain("Choisir ce qui doit être partagé");

    const nav = buildNavigationFromPages(demo.pages);
    const familleMenu = nav.find((item) => item.href === "/notre-famille");
    const evenementsMenu = nav.find((item) => item.href === "/evenements");
    expect(familleMenu?.children?.map((c) => c.href)).toContain("/annonces");
    expect(evenementsMenu?.children?.map((c) => c.href)).toContain("/entraide");
    expect(evenementsMenu?.children?.map((c) => c.href)).toContain("/assemblees-rapports");
    const assembliesPage = demo.pages.find((p) => p.slug === "/assemblees-rapports")!;
    expect(assembliesPage.visibility).toBe("members");
    expect(assembliesPage.indexable).toBe(false);
    expect(String(assembliesPage.html)).toContain("aucun document réel ni donnée personnelle");

    // Création d'un site depuis les nouveaux modèles (ex. Association sportive, Restaurant sans e-commerce, Portfolio)
    for (const tplId of [
      "modele-association-sportive",
      "modele-restaurant-commerce-vitrine",
      "modele-portfolio-creatif",
    ]) {
      const tpl = INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === tplId)!;
      const created = await createIndependentSiteProject(ownerId, {
        title: tpl.name,
        siteType: tpl.siteType,
        templateId: tpl.id,
      });
      expect(created.templateId).toBe(tpl.id);
      expect(created.pages.length).toBe(tpl.pages.length);
    }
  });

  it("7. sauvegarde les brouillons (y compris les champs SEO socialImageUrl et indexable), gère les blocs réutilisables inter-pages, duplique un projet et restaure une version historique", async () => {
    const ownerId = 702;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Association Culturelle Atlas",
      siteType: "association",
      socleId: "socle-association",
    });

    const reusableBlock = {
      id: "rb-1",
      name: "Bandeau Permanence Samedi",
      category: "Mes blocs",
      html: "<section>Permanence chaque samedi 10h-12h</section>",
      createdAt: new Date().toISOString(),
    };

    const updatedPages = [
      ...site.pages,
      {
        id: "page-contact",
        title: "Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public" as const,
        seoTitle: "Contact Atlas",
        seoDescription: "Nous écrire",
        socialImageUrl: "https://cdn.mazigho.com/sites/atlas-og.webp",
        indexable: false,
        html: `${INDEPENDENT_PAGE_SOCLES[5].html}${reusableBlock.html}`,
        css: "",
      },
    ];

    const savedV2 = await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      title: "Association Culturelle Atlas — Édition 2026",
      pages: updatedPages,
      reusableBlocks: [reusableBlock],
      createVersionLabel: "Ajout page Contact et bloc réutilisable",
    });

    expect(savedV2.pages).toHaveLength(2);
    expect(savedV2.pages[1].socialImageUrl).toBe("https://cdn.mazigho.com/sites/atlas-og.webp");
    expect(savedV2.pages[1].indexable).toBe(false);
    expect(savedV2.reusableBlocks).toHaveLength(1);

    const versions = await listIndependentSiteVersions(ownerId, site.id);
    expect(versions.length).toBeGreaterThanOrEqual(2);

    // Modification puis restauration de la v1
    await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      title: "Titre temporaire",
    });
    const v1 = versions.find((v) => v.versionNumber === 1)!;
    const restored = await restoreIndependentSiteVersion(ownerId, site.id, v1.id);
    expect(restored.title).toBe("Association Culturelle Atlas");
    expect(restored.pages).toHaveLength(1);

    // Duplication de projet
    const duplicated = await duplicateIndependentSiteProject(
      ownerId,
      site.id,
      "Association Culturelle Atlas — Copie"
    );
    expect(duplicated.id).not.toBe(site.id);
    expect(duplicated.title).toBe("Association Culturelle Atlas — Copie");
  });

  it("8. gère la bibliothèque personnelle de médias par projet avec transformations", async () => {
    const ownerId = 703;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Portfolio Personnel",
      siteType: "personnel",
    });

    const media = await addIndependentSiteMedia(ownerId, {
      siteId: site.id,
      label: "Portrait Atelier",
      altText: "Photo de l’atelier",
      url: "https://cdn.mazigho.com/sites/portrait-atelier.webp",
      transforms: { rotationDeg: 12, scalePercent: 120, flipHorizontal: true },
    });

    expect(media.transforms.rotationDeg).toBe(12);
    expect(media.transforms.scalePercent).toBe(120);
    expect(media.transforms.flipHorizontal).toBe(true);

    const updatedMedia = await updateIndependentSiteMediaTransforms(ownerId, site.id, media.id, {
      rotationDeg: -15,
      skewXDeg: 8,
      offsetX: 30,
    });
    expect(updatedMedia.transforms.rotationDeg).toBe(-15);
    expect(updatedMedia.transforms.skewXDeg).toBe(8);
    expect(updatedMedia.transforms.offsetX).toBe(30);

    const allMedia = await listIndependentSiteMedia(ownerId, site.id);
    expect(allMedia).toHaveLength(1);

    await deleteIndependentSiteMedia(ownerId, site.id, media.id);
    expect(await listIndependentSiteMedia(ownerId, site.id)).toHaveLength(0);
  });

  it("9. publie un site indépendamment d’une boutique et gère les statuts brouillon, publié et archivé", async () => {
    const ownerId = 704;
    const demo = await ensureAthVahloulDemoProject(ownerId);
    expect(demo.status).toBe("draft");

    // Tant que non publié, un visiteur public anonyme ne voit pas le site
    const publicBefore = await getPublicIndependentSiteBySlug(demo.slug);
    expect(publicBefore).toBeNull();

    // Le propriétaire peut prévisualiser son brouillon
    const ownerPreview = await getPublicIndependentSiteBySlug(demo.slug, {
      allowDraftForOwnerUserId: ownerId,
    });
    expect(ownerPreview?.title).toBe("Association familiale ATH VAHLOUL");

    // Publication indépendante
    const published = await publishIndependentSiteProject(ownerId, demo.id);
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();

    const publicAfter = await getPublicIndependentSiteBySlug(demo.slug);
    expect(publicAfter?.title).toBe("Association familiale ATH VAHLOUL");
    expect(publicAfter?.pages).toHaveLength(5);
    expect(publicAfter?.pages.every((page) => page.visibility === "public")).toBe(true);
    expect(publicAfter?.pages.map((page) => page.id)).not.toEqual(
      expect.arrayContaining(["page-annonces", "page-assemblees"])
    );
    expect(JSON.stringify(publicAfter?.navigation)).not.toContain("page-annonces");
    expect(JSON.stringify(publicAfter?.navigation)).not.toContain("page-assemblees");

    // Archivage
    const archived = await updateIndependentSiteStatus(ownerId, demo.id, "archived");
    expect(archived.status).toBe("archived");

    const archivedList = await listIndependentSiteProjects(ownerId, { status: "archived" });
    expect(archivedList.map((s) => s.id)).toContain(demo.id);
  });

  it("10. gère les domaines personnalisés dédiés et rejette les domaines réservés de l’infrastructure MAZIGHO", async () => {
    const ownerId = 705;
    const site = await ensureAthVahloulDemoProject(ownerId);

    // Rejet des domaines réservés
    expect(validateIndependentCustomDomain("studio.mazigho.com").valid).toBe(false);
    expect(validateIndependentCustomDomain("boutique.mazigho.ch").valid).toBe(false);

    // Ajout d'un domaine personnalisé valide
    const domain = await addIndependentSiteDomain(
      ownerId,
      site.id,
      "https://www.association-ath-vahloul.org/"
    );
    expect(domain.hostname).toBe("www.association-ath-vahloul.org");
    expect(domain.verificationStatus).toBe("pending_dns");
    expect(domain.dnsRecordName).toBe("_mazigho-site-verify.www.association-ath-vahloul.org");

    await expect(verifyIndependentSiteDomain(ownerId, site.id, domain.id)).rejects.toThrow(
      /INDEPENDENT_SITE_DOMAIN_DNS_NOT_VERIFIED/
    );

    await removeIndependentSiteDomain(ownerId, site.id, domain.id);
    expect(await listIndependentSiteDomains(ownerId, site.id)).toHaveLength(0);
  });

  it("11. applique une isolation stricte des permissions entre utilisateurs et rejette tout secret", async () => {
    const userA = 801;
    const userB = 802;

    const siteA = await createIndependentSiteProject(userA, {
      title: "Site Privé Utilisateur A",
      siteType: "familial",
    });

    // User B ne peut ni lire, ni modifier, ni dupliquer, ni publier le site de User A
    expect(await getIndependentSiteProject(userB, siteA.id)).toBeNull();
    await expect(
      saveIndependentSiteProject(userB, { siteId: siteA.id, title: "Piratage" })
    ).rejects.toThrow(/INDEPENDENT_SITE_NOT_FOUND/);
    await expect(duplicateIndependentSiteProject(userB, siteA.id)).rejects.toThrow(
      /INDEPENDENT_SITE_NOT_FOUND/
    );
    await expect(publishIndependentSiteProject(userB, siteA.id)).rejects.toThrow(
      /INDEPENDENT_SITE_NOT_FOUND/
    );

    // Rejet automatique des secrets / clés API
    const syntheticSecret = ["sk", "live", "1234567890abcdefghijklmnop"].join("_");
    expect(() =>
      assertNoSecretsInIndependentSite({
        html: `<p>${syntheticSecret}</p>`,
      })
    ).toThrow(/INDEPENDENT_SITE_SECRET_DETECTED/);
  });

  it("12. vérifie que la migration 0063 est strictement additive et que Studio MAZIGHO n’a aucune dépendance inversée", () => {
    const migrationSql = readFileSync(
      resolve(process.cwd(), "drizzle/0063_independent_site_builder.sql"),
      "utf8"
    );
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS `independentSites`");
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS `independentSiteVersions`");
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS `independentSiteMedia`");
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS `independentSiteDomains`");
    expect(migrationSql).not.toMatch(/DROP|TRUNCATE|DELETE|ALTER TABLE `stores`/i);
  });

  it("13. calcule clairement l’état du projet (Site vitrine / Boutique hybride, Brouillon / Sauvegardé / Publié, verrou anti-double-clic et messages d’erreur compréhensibles)", () => {
    expect(INDEPENDENT_PROJECT_MODE_OPTIONS.map((m) => m.label)).toEqual([
      "Site vitrine",
      "Boutique hybride",
    ]);
    expect(resolveIndependentProjectMode("association")).toBe("site_vitrine");
    expect(resolveIndependentProjectMode("services")).toBe("site_vitrine");
    expect(resolveIndependentProjectMode("services", "boutique_hybride")).toBe("boutique_hybride");

    // 1. Projet en brouillon avec modifications non enregistrées
    const dirtyDraft = computeIndependentProjectWorkflowState({
      projectId: 42,
      title: "Association ATH VAHLOUL",
      siteType: "familial",
      status: "draft",
      hasUnsavedChanges: true,
      isSaving: false,
      lastSavedAt: null,
    });
    expect(dirtyDraft.projectModeLabel).toBe("Site vitrine");
    expect(dirtyDraft.workflowStatus).toBe("brouillon");
    expect(dirtyDraft.workflowStatusLabel).toBe("Brouillon");
    expect(dirtyDraft.unsavedIndicatorLabel).toBe("Modifications non enregistrées");
    expect(dirtyDraft.canTriggerSave).toBe(true);

    // 2. Sauvegarde lente en cours (prévention des doubles clics)
    const savingState = computeIndependentProjectWorkflowState({
      projectId: 42,
      title: "Association ATH VAHLOUL",
      siteType: "familial",
      status: "draft",
      hasUnsavedChanges: true,
      isSaving: true,
      lastSavedAt: null,
    });
    expect(savingState.canTriggerSave).toBe(false);
    expect(savingState.savingInProgressMessage).toContain("Sauvegarde en cours");

    // 3. Projet sauvegardé (brouillon à jour)
    const savedDraft = computeIndependentProjectWorkflowState({
      projectId: 42,
      title: "Association ATH VAHLOUL",
      siteType: "familial",
      status: "draft",
      hasUnsavedChanges: false,
      isSaving: false,
      lastSavedAt: "2026-11-21T10:30:00.000Z",
    });
    expect(savedDraft.workflowStatus).toBe("sauvegarde");
    expect(savedDraft.workflowStatusLabel).toBe("Sauvegardé");
    expect(savedDraft.unsavedIndicatorLabel).toBe("Toutes les modifications sont enregistrées");

    // 4. Projet publié
    const publishedState = computeIndependentProjectWorkflowState({
      projectId: 42,
      title: "Association ATH VAHLOUL",
      siteType: "familial",
      status: "published",
      hasUnsavedChanges: false,
      isSaving: false,
      lastSavedAt: "2026-11-21T10:35:00.000Z",
    });
    expect(publishedState.workflowStatus).toBe("publie");
    expect(publishedState.workflowStatusLabel).toBe("Publié");

    // 5. Messages d'erreur compréhensibles en cas de sauvegarde refusée
    expect(
      formatIndependentBuilderErrorMessage(
        new Error("INDEPENDENT_SITE_SECRET_DETECTED: Clé détectée")
      )
    ).toContain("clé secrète ou un jeton privé");
    expect(
      formatIndependentBuilderErrorMessage(
        new Error("INDEPENDENT_SITE_EMPTY_PAGES_FORBIDDEN")
      )
    ).toContain("au moins une page");
    expect(
      formatIndependentBuilderErrorMessage(new Error("UNAUTHORIZED"))
    ).toContain("reconnectez-vous");
  });

  it("14. protège contre la perte de travail via un filet de sécurité local explicite et contrôlé (jamais silencieux)", () => {
    expect(buildLocalSafetyStorageKey(99)).toBe("mazigho_independent_builder_safety_v1:site-99");

    const samplePages = ensureNonEmptyIndependentPages([]);
    expect(samplePages).toHaveLength(1);
    expect(samplePages[0].slug).toBe("/");

    const snapshot = createLocalSafetySnapshot(
      {
        siteId: 99,
        slug: "site-test-filet-local",
        title: "Site Test Filet Local",
        siteType: "vitrine",
        projectMode: "site_vitrine",
        pages: samplePages,
      },
      "2026-11-21T12:05:00.000Z"
    );

    // Le snapshot local est proposé uniquement s'il correspond au même projet et contient un état différent
    const shouldOfferWhenNewerAndDifferent = shouldOfferLocalSafetyRestore(snapshot, {
      id: 99,
      title: "Site Test Initial",
      updatedAt: "2026-11-21T12:00:00.000Z",
      pages: samplePages,
    });
    expect(shouldOfferWhenNewerAndDifferent).toBe(true);

    // Jamais proposé si le contenu sauvegardé sur le serveur est déjà identique
    const shouldNotOfferWhenIdentical = shouldOfferLocalSafetyRestore(snapshot, {
      id: 99,
      title: "Site Test Filet Local",
      updatedAt: "2026-11-21T12:00:00.000Z",
      pages: samplePages,
    });
    expect(shouldNotOfferWhenIdentical).toBe(false);

    // Jamais proposé pour un autre projet
    const shouldNotOfferForDifferentSite = shouldOfferLocalSafetyRestore(snapshot, {
      id: 100,
      title: "Autre Projet",
      updatedAt: "2026-11-21T12:00:00.000Z",
      pages: samplePages,
    });
    expect(shouldNotOfferForDifferentSite).toBe(false);
  });

  it("15. gère l’aller-retour entre Éditeur et Prévisualisation privée ainsi que les 5 guides d’aide contextuelle non intrusifs", () => {
    const previewUrl = buildEditorPreviewUrl({
      slug: "association-familiale-ath-vahloul",
      pageSlug: "/notre-famille",
      siteId: 77,
    });
    expect(previewUrl).toBe(
      "/constructeur-sites/apercu/association-familiale-ath-vahloul?siteId=77&page=%2Fnotre-famille"
    );

    const returnUrl = buildPreviewReturnUrl({
      siteId: 77,
      slug: "association-familiale-ath-vahloul",
      pageSlug: "/notre-famille",
    });
    expect(returnUrl).toBe(
      "/constructeur-sites?siteId=77&page=%2Fnotre-famille"
    );

    const parsed = parseBuilderQueryParams(
      "?siteId=77&slug=association-familiale-ath-vahloul&page=%2Fnotre-famille"
    );
    expect(parsed).toEqual({
      siteId: 77,
      slug: "association-familiale-ath-vahloul",
      pageSlug: "/notre-famille",
    });

    // Vérification des 5 guides d'aide utilisateur
    expect(Object.keys(INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles)).toEqual([
      "bloc",
      "module",
      "socle",
      "modele",
    ]);
    expect(Object.keys(INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions)).toEqual([
      "sauvegarder",
      "previsualiser",
      "publier",
    ]);
    expect(INDEPENDENT_BUILDER_HELP_GUIDES.projectModes.site_vitrine).toContain("Site vitrine");
    expect(INDEPENDENT_BUILDER_HELP_GUIDES.projectModes.boutique_hybride).toContain("Boutique hybride");
    expect(INDEPENDENT_BUILDER_HELP_GUIDES.separationNotice).toContain("Studio MAZIGHO");
  });

  it("16. couvre les 12 cas de robustesse (projet vide, 1 page, multi-pages, cartes répétables, SVG sûr/malveillant, image HTTPS, recherche 0 résultat, sauvegarde refusée)", async () => {
    const ownerId = 905;

    // 1. Projet vide -> repli automatique vers 1 page d'accueil valide
    const fallbackPages = ensureNonEmptyIndependentPages([]);
    expect(fallbackPages).toHaveLength(1);
    expect(fallbackPages[0].title).toBe("Accueil");

    // 2. Projet avec 1 seule page
    const singlePageSite = await createIndependentSiteProject(ownerId, {
      title: "Site Une Seule Page",
      siteType: "vitrine",
      socleId: "socle-accueil",
    });
    expect(singlePageSite.pages).toHaveLength(1);

    // 3. Projet multi-pages
    const multiPageSite = await createIndependentSiteProject(ownerId, {
      title: "Site Multi Pages",
      siteType: "association",
      templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
    });
    expect(multiPageSite.pages.length).toBeGreaterThanOrEqual(6);

    // 4. Cartes visuelles répétables
    let cardGrid = applyVisualCardUseCasePreset("services");
    cardGrid = addCardToVisualCardGrid(cardGrid, { title: "Service Supplémentaire" });
    expect(cardGrid.cards.length).toBeGreaterThanOrEqual(4);

    // 5. Image SVG data:image/svg+xml sûre préservée vs SVG malveillant neutralisé
    const safeSvg =
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40'/%3E%3C/svg%3E";
    expect(sanitizeBuilderImageSrc(safeSvg)).toBe(safeSvg);
    const maliciousSvg =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'><script>alert(1)</script></svg>";
    expect(sanitizeBuilderImageSrc(maliciousSvg)).not.toContain("onload");
    expect(sanitizeBuilderImageSrc(maliciousSvg)).not.toContain("<script");

    // 6. Image externe https://
    const externalHttps = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
    expect(sanitizeBuilderImageSrc(externalHttps)).toBe(externalHttps);

    // 7. Recherche sans résultat dans les 4 filtres de bibliothèque
    expect(filterIndependentBlocks({ search: "zqxw-introuvable-999" })).toHaveLength(0);
    expect(filterIndependentModules({ search: "zqxw-introuvable-999" })).toHaveLength(0);
    expect(filterIndependentSocles({ search: "zqxw-introuvable-999" })).toHaveLength(0);
    expect(filterIndependentTemplates({ search: "zqxw-introuvable-999" })).toHaveLength(0);

    // 8. Sauvegarde refusée (pages vides ou utilisateur non autorisé)
    await expect(
      saveIndependentSiteProject(ownerId, {
        siteId: singlePageSite.id,
        pages: [],
      })
    ).rejects.toThrow(/INDEPENDENT_SITE_EMPTY_PAGES_FORBIDDEN/);
  });

  it("17. Phase 2 — Historique & Versions automatiques + Duplication (page avec slug unique, bloc réutilisable, projet)", async () => {
    const ownerId = 1001;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Site Phase 2 Versions & Duplication",
      siteType: "association",
    });

    // 1. Auto-versioning sur sauvegarde importante (changement de structure/page)
    const initialPages = site.pages;
    const dupPageResult = duplicateIndependentPageInList(
      initialPages,
      initialPages[0].id,
      "Nos Activités"
    );
    expect(dupPageResult.duplicatedPage).not.toBeNull();
    expect(dupPageResult.duplicatedPage?.slug).toBe("/nos-activites");
    expect(dupPageResult.pages).toHaveLength(2);

    // Vérifie la génération automatique d'un slug unique en cas de collision
    const collidingSlug = generateUniquePageSlug("/nos-activites", dupPageResult.pages);
    expect(collidingSlug).toBe("/nos-activites-2");

    const autoCheck = shouldAutoCreateVersionOnSave(initialPages, dupPageResult.pages);
    expect(autoCheck.shouldCreate).toBe(true);

    // Sauvegarde importante déclenchant automatiquement une nouvelle version sans label explicite
    await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      pages: dupPageResult.pages,
    });
    const versions = await listIndependentSiteVersions(ownerId, site.id);
    expect(versions.length).toBeGreaterThanOrEqual(2);

    // Aperçu détaillé d'une version avec auteur, date, numéro et résumé des changements
    const preview = buildIndependentVersionPreview(versions[0], initialPages);
    expect(preview.versionNumber).toBe(versions[0].versionNumber);
    expect(preview.authorLabel).toBeTruthy();
    expect(preview.pageCount).toBe(2);
    expect(preview.pageTitles[0]).toBeTruthy();

    // Duplication d'un bloc réutilisable avec nouveau nom
    const blocks = [
      {
        id: "rb-orig",
        name: "Bloc Contact Association",
        category: "Mes blocs",
        html: "<section><h2>Contact</h2></section>",
        createdAt: new Date().toISOString(),
      },
    ];
    const dupBlockResult = duplicateIndependentReusableBlockInList(
      blocks,
      "rb-orig",
      "Bloc Contact Association — Copie V2"
    );
    expect(dupBlockResult.reusableBlocks).toHaveLength(2);
    expect(dupBlockResult.duplicatedBlock?.name).toBe("Bloc Contact Association — Copie V2");
  });

  it("18. Phase 2 — Import & Export JSON contrôlé (versionné, sans secret ni paiement, validation, sanitation, limite de taille)", async () => {
    const ownerId = 1002;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Site Exportable Propre",
      siteType: "vitrine",
    });

    const exportedPkg = await exportIndependentSiteProjectJson(ownerId, site.id);
    const exportedJson = JSON.stringify(exportedPkg);
    expect(exportedPkg.format).toBe(INDEPENDENT_SITE_EXPORT_FORMAT);
    expect(exportedPkg.schemaVersion).toBe(1);
    expect(exportedJson).not.toMatch(/stripe|sk_live|password|payment|stock|storeId|checkout/i);

    // Validation & aperçu avant remplacement
    const validImport = validateAndSanitizeIndependentSiteImport(exportedJson);
    expect(validImport.valid).toBe(true);
    expect(validImport.preview?.title).toBe("Site Exportable Propre");
    expect(validImport.preview?.pageCount).toBe(1);

    // Import contrôlé créant ou mettant à jour un projet
    const importedProject = await importIndependentSiteProjectJson(ownerId, {
      rawJson: exportedJson,
      newTitle: "Site Importé Vérifié",
    });
    expect(importedProject.title).toBe("Site Importé Vérifié");

    // Rejet d'un JSON malformé
    expect(validateAndSanitizeIndependentSiteImport("{json-invalide").valid).toBe(false);

    // Neutralisation + avertissement sur balise <script> et rejet d'un JSON contenant un secret ou storeId
    const scriptJson = JSON.stringify({
      ...exportedPkg,
      project: {
        ...exportedPkg.project,
        pages: [
          {
            ...exportedPkg.project.pages[0],
            html: "<section><script>window.evil()</script><p>Contenu</p></section>",
          },
        ],
      },
    });
    const scriptRes = validateAndSanitizeIndependentSiteImport(scriptJson);
    expect(scriptRes.valid).toBe(true);
    expect(scriptRes.warnings.join(" ")).toContain("neutralisés automatiquement");
    expect(scriptRes.sanitizedPackage?.project.pages[0].html).not.toContain("<script");

    const secretJson = JSON.stringify({
      ...exportedPkg,
      storeId: 99,
    });
    const secretRes = validateAndSanitizeIndependentSiteImport(secretJson);
    expect(secretRes.valid).toBe(false);
    expect(secretRes.error).toContain("INDEPENDENT_SITE_ECOMMERCE_DEPENDENCY_FORBIDDEN");

    // Rejet d'un JSON dépassant la taille maximale
    const oversizedJson = "x".repeat(INDEPENDENT_SITE_EXPORT_MAX_BYTES + 100);
    const oversizedRes = validateAndSanitizeIndependentSiteImport(oversizedJson);
    expect(oversizedRes.valid).toBe(false);
    expect(oversizedRes.error).toContain("dépasse la taille maximale");
  });

  it("19. Phase 2 — Contrôle SEO par page, Accessibilité à 3 niveaux (Bloquant, À corriger, Conseil) et Vérification Responsive (dont 320px)", () => {
    // 1. Contrôle du contraste de couleurs WCAG
    expect(computeColorContrastRatio("#172033", "#ffffff")).toBeGreaterThan(12);
    expect(computeColorContrastRatio("#cccccc", "#ffffff")).toBeLessThan(2);

    // 2. Audit SEO par page (distinction erreurs bloquantes vs points à corriger vs recommandations)
    const goodPage = {
      id: "p-seo-ok",
      title: "Accueil Association",
      slug: "/",
      parentPageId: null,
      showInMenu: true,
      menuOrder: 1,
      visibility: "public" as const,
      seoTitle: "Association Culturelle Atlas — Rencontres & Patrimoine",
      seoDescription:
        "Découvrez les activités culturelles, les ateliers intergénérationnels et les événements solidaires de notre association.",
      indexable: true,
      html: '<section><h1>Association Culturelle Atlas</h1><p>Bienvenue au cœur de notre association culturelle et citoyenne fondée pour transmettre nos savoirs.</p><img src="https://example.com/a.webp" alt="Membres réunis" /></section>',
      css: "",
    };
    const seoOk = auditIndependentPageSeo(goodPage, "association-atlas");
    expect(seoOk.blockingErrors).toHaveLength(0);
    expect(seoOk.h1Count).toBe(1);
    expect(seoOk.canonicalUrl).toBe("https://sites.mazigho.com/sites/association-atlas");

    const badSeoPage = {
      ...goodPage,
      id: "p-seo-bad",
      title: "",
      seoTitle: "",
      seoDescription: "Trop court",
      html: '<section><h1>Titre 1</h1><h1>Titre 2</h1><img src="https://example.com/a.webp" /></section>',
    };
    const seoBad = auditIndependentPageSeo(badSeoPage, "association-atlas");
    expect(seoBad.blockingErrors.length).toBeGreaterThan(0);
    expect(seoBad.recommendations.some((r) => r.message.includes("<h1>"))).toBe(true);
    expect(seoBad.warningsToFix.some((w) => w.message.includes("texte alternatif"))).toBe(true);

    // 3. Audit Accessibilité (3 niveaux en français : Bloquant, À corriger, Conseil)
    const a11yBadPage = {
      ...goodPage,
      html: '<section><h1>Titre</h1><h3>Sous-titre sautant H2</h3><img src="https://example.com/sans-alt.jpg" /><a href="/contact">cliquez ici</a><button></button><input type="text" /></section>',
      css: ".btn:focus { outline: none; }",
    };
    const a11yReport = auditIndependentSiteAccessibility([a11yBadPage], {
      primaryColor: "#dddddd",
      backgroundColor: "#ffffff",
      accentColor: "#1d4ed8",
      fontHeading: "Inter",
      fontBody: "Inter",
    });
    expect(a11yReport.blockingCount).toBeGreaterThanOrEqual(2);
    expect(a11yReport.toFixCount).toBeGreaterThanOrEqual(2);
    expect(a11yReport.issues.some((i) => i.level === "Bloquant")).toBe(true);
    expect(a11yReport.issues.some((i) => i.level === "À corriger")).toBe(true);
    expect(a11yReport.issues.some((i) => i.level === "Conseil")).toBe(true);

    // 4. Vérification Responsive (desktop, tablette, mobile, 320px, largeur fixe, débordement, menu trop long)
    const nonResponsivePage = {
      ...goodPage,
      html: '<section style="width: 1200px"><img src="https://example.com/large.jpg" style="width: 900px" /><p style="white-space: nowrap">Texte très long qui déborde sur un petit écran de 320px sans retour à la ligne</p></section>',
    };
    const responsiveReport = auditIndependentSiteResponsive([nonResponsivePage]);
    expect(responsiveReport.criticalCount).toBeGreaterThanOrEqual(1);
    const narrow320 = responsiveReport.checkedViewports.find((vp) => vp.id === "narrow-320");
    expect(narrow320?.passed).toBe(false);
    expect(responsiveReport.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("20. Phase 2 — Médias (recherche, filtre MIME, poids/dimensions, alerte fichier lourd, renommage et remplacement d’URL sans casser les pages)", async () => {
    const ownerId = 1003;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Site Médiathèque Phase 2",
      siteType: "professionnel",
    });

    const m1 = await addIndependentSiteMedia(ownerId, {
      siteId: site.id,
      label: "Photo Façade Cabinet",
      altText: "Façade du cabinet au 14 rue de la Paix",
      url: "https://images.unsplash.com/photo-1?w=1200&h=800",
      mimeType: "image/webp",
    });
    const m2 = await addIndependentSiteMedia(ownerId, {
      siteId: site.id,
      label: "Logo Vectoriel",
      altText: "",
      url: "https://example.com/logo.svg",
      mimeType: "image/svg+xml",
    });

    const mediaList = await listIndependentSiteMedia(ownerId, site.id);
    expect(filterIndependentMediaItems(mediaList, { search: "Façade" })).toHaveLength(1);
    expect(
      filterIndependentMediaItems(mediaList, { mimeTypeFilter: "image/svg+xml" })
    ).toHaveLength(1);

    const a1 = assessIndependentMediaItem({
      url: m1.url,
      altText: m1.altText,
      mimeType: m1.mimeType,
      widthPx: 1200,
      heightPx: 800,
      fileSizeBytes: 180_000,
    });
    expect(a1.hasValidAltText).toBe(true);
    expect(a1.dimensionsLabel).toBe("1200 × 800 px");

    const a2 = assessIndependentMediaItem({
      url: m2.url,
      altText: "",
      mimeType: m2.mimeType,
      fileSizeBytes: 620_000,
    });
    expect(a2.hasValidAltText).toBe(false);
    expect(a2.isTooHeavyWarning).toBe(true);
    expect(a2.warningMessage).toContain("Fichier lourd");

    // Renommage et remplacement d'URL dans la médiathèque et à travers les pages
    const pagesWithImage = [
      {
        ...site.pages[0],
        html: `<section><img src="${m1.url}" alt="${m1.altText}" /></section>`,
      },
    ];
    const newUrl = "https://images.unsplash.com/photo-remplacee?w=1280&h=720";
    const replaced = replaceMediaUrlAcrossPages(pagesWithImage, m1.url, newUrl);
    expect(replaced.replacedCount).toBe(1);
    expect(replaced.pages[0].html).toContain(newUrl);

    const updatedMeta = await updateIndependentSiteMediaMetadata(ownerId, {
      siteId: site.id,
      mediaId: m1.id,
      label: "Façade Rénovée 2026",
      altText: "Nouvelle façade rénovée",
      newUrl,
    });
    expect(updatedMeta.media.label).toBe("Façade Rénovée 2026");
    expect(updatedMeta.media.url).toBe(newUrl);
  });

  it("21. Phase 2 — Navigation & Footer (presets accessibles, réorganisation, vérification des liens internes, profondeur max 2 niveaux)", () => {
    expect(MAX_INDEPENDENT_SUBMENU_DEPTH).toBe(2);
    expect(INDEPENDENT_NAV_AND_FOOTER_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(
      INDEPENDENT_NAV_AND_FOOTER_PRESETS.some((p) => p.kind === "header_navigation")
    ).toBe(true);
    expect(INDEPENDENT_NAV_AND_FOOTER_PRESETS.some((p) => p.kind === "footer_complet")).toBe(
      true
    );

    const pages = [
      {
        id: "p1",
        title: "Accueil",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public" as const,
        seoTitle: "Accueil",
        seoDescription: "Bienvenue sur notre site officiel.",
        html: '<section><h1>Accueil</h1><a href="/contact">Nous contacter</a><a href="/page-inexistante">Lien cassé</a></section>',
        css: "",
      },
      {
        id: "p2",
        title: "Contact",
        slug: "/contact",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 2,
        visibility: "public" as const,
        seoTitle: "Contact",
        seoDescription: "Coordonnées et formulaire de contact.",
        html: "<section><h1>Contact</h1><p>contact@association-locale.fr</p></section>",
        css: "",
      },
    ];

    const linkCheck = verifyIndependentInternalLinks(pages);
    expect(linkCheck.valid).toBe(false);
    expect(linkCheck.brokenLinks).toHaveLength(1);
    expect(linkCheck.brokenLinks[0].targetHref).toBe("/page-inexistante");

    const reordered = reorderIndependentPagesMenu(pages, "p2", "up");
    const p2After = reordered.find((p) => p.id === "p2");
    const p1After = reordered.find((p) => p.id === "p1");
    expect(p2After?.menuOrder).toBe(1);
    expect(p1After?.menuOrder).toBe(2);
  });

  it("21 bis. répare seulement les alias internes connus sans masquer les chemins inconnus", () => {
    const pages = [
      {
        id: "home",
        title: "Accueil",
        slug: "/",
        menuOrder: 1,
        parentPageId: null,
        visibility: "public" as const,
        seoTitle: "Accueil",
        seoDescription: "",
        html: '<a href="/a-propos">Notre histoire</a> <a href="/participer#formulaire">Participer</a> <a href="/inconnu">Inconnu</a>',
        css: "",
      },
      {
        id: "family",
        title: "Notre famille",
        slug: "/notre-famille",
        menuOrder: 2,
        parentPageId: null,
        visibility: "public" as const,
        seoTitle: "Notre famille",
        seoDescription: "",
        html: "<h1>Notre famille</h1>",
        css: "",
      },
      {
        id: "contact",
        title: "Contact",
        slug: "/contact",
        menuOrder: 3,
        parentPageId: null,
        visibility: "public" as const,
        seoTitle: "Contact",
        seoDescription: "",
        html: "<h1>Contact</h1>",
        css: "",
      },
    ];
    const repaired = repairKnownIndependentInternalLinks(pages);
    expect(repaired.changes).toHaveLength(2);
    expect(repaired.pages[0].html).toContain('href="/notre-famille"');
    expect(repaired.pages[0].html).toContain('href="/contact#formulaire"');
    expect(repaired.pages[0].html).toContain('href="/inconnu"');
  });

  it("persists independent site settings with deep partial merges and site isolation", async () => {
    const ownerId = 91001;
    const site = await createIndependentSiteProject(ownerId, { title: "Réglages isolés" });
    const otherSite = await createIndependentSiteProject(ownerId, { title: "Autre site" });

    const saved = await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      settings: {
        faviconUrl: "https://example.com/favicon.png",
        maintenanceMode: true,
        maintenanceMessage: "Mise à jour en cours.",
        socialLinks: { instagram: "https://instagram.com/example" },
        legal: { organizationName: "Association Exemple", country: "CH" },
      },
    });

    expect(saved.settings.faviconUrl).toBe("https://example.com/favicon.png");
    expect(saved.settings.maintenanceMode).toBe(true);
    expect(saved.settings.maintenanceMessage).toBe("Mise à jour en cours.");
    expect(saved.settings.socialLinks.instagram).toBe("https://instagram.com/example");
    expect(saved.settings.socialLinks.facebook).toBe("");
    expect(saved.settings.legal.organizationName).toBe("Association Exemple");
    expect(saved.settings.legal.privacyUrl).toBe("");
    expect((await getIndependentSiteProject(ownerId, otherSite.id))?.settings.faviconUrl).toBe("");
    expect((await getIndependentSiteProject(ownerId, otherSite.id))?.settings.maintenanceMode).toBe(false);
  });

  it("22. Phase 2 — Checklist avant publication (14 points), blocage en cas d’erreur critique, Dépublication, Journal de publication et Collaboration contrôlée en lecture seule", async () => {
    const ownerId = 1004;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Site Associatif Citoyen",
      siteType: "association",
    });

    // 1. Checklist en 14 points sur un projet avec un lien interne cassé -> publication bloquée
    const brokenPages = [
      {
        ...site.pages[0],
        html: '<section><h1>Accueil</h1><p>Bienvenue dans notre collectif citoyen.</p><a href="/introuvable">Lien mort</a></section>',
      },
    ];
    await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      pages: brokenPages,
    });

    await expect(publishIndependentSiteProject(ownerId, site.id)).rejects.toThrow(
      /INDEPENDENT_SITE_PUBLISH_CHECKLIST_BLOCKED/
    );

    // 2. Correction du lien cassé -> les 14 points passent sans erreur bloquante
    const cleanPages = [
      {
        ...site.pages[0],
        seoTitle: "Collectif Citoyen — Accueil & Actions",
        seoDescription:
          "Présentation des actions solidaires, des rencontres locales et des coordonnées de notre collectif citoyen.",
        html: '<section><h1>Collectif Citoyen</h1><p>Bienvenue dans notre collectif citoyen engagé pour l’entraide locale. Contact : bureau@collectif-citoyen.org</p></section>',
      },
    ];
    await saveIndependentSiteProject(ownerId, {
      siteId: site.id,
      pages: cleanPages,
    });

    const quality = evaluateIndependentSiteQualityAndChecklist({
      title: site.title,
      slug: site.slug,
      siteType: site.siteType,
      projectMode: "site_vitrine",
      status: site.status,
      templateId: null,
      pages: cleanPages,
    });
    expect(quality.checklist).toHaveLength(14);
    expect(quality.canPublish).toBe(true);
    expect(quality.overallScore100).toBeGreaterThanOrEqual(80);

    // 3. Publication réussie + entrée dans le journal de publication
    const published = await publishIndependentSiteProject(ownerId, site.id);
    expect(published.status).toBe("published");

    // 4. Dépublication (retour en brouillon) -> n'apparaît plus sur l'URL publique /sites/:slug
    const unpublished = await unpublishIndependentSiteProject(ownerId, site.id);
    expect(unpublished.status).toBe("draft");
    expect(await getPublicIndependentSiteBySlug(site.slug)).toBeNull();

    const logs = await listIndependentPublicationLogs(ownerId, site.id);
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.map((l) => l.action)).toContain("publish");
    expect(logs.map((l) => l.action)).toContain("unpublish");

    // 5. Collaboration contrôlée : partage d'aperçu privé en lecture seule avec révocation instantanée
    const share = await createIndependentCollaboratorPreviewShare(ownerId, {
      siteId: site.id,
      collaboratorLabel: "Relecteur Bureau",
      expiresInHours: 24,
    });
    expect(share.permission).toBe("read_only_preview");
    expect(share.token).toContain("mpreview_");

    const shares = await listIndependentCollaboratorPreviewShares(ownerId, site.id);
    expect(shares).toHaveLength(1);

    // Le collaborateur muni du jeton peut consulter l'aperçu privé du brouillon
    const collabPreview = await getPublicIndependentSiteBySlug(site.slug, {
      previewToken: share.token,
    });
    expect(collabPreview?.title).toBe("Site Associatif Citoyen");

    // Révocation instantanée du jeton collaborateur
    await revokeIndependentCollaboratorPreviewShare(ownerId, site.id, share.id);
    expect(
      (await verifyIndependentCollaboratorPreviewToken(site.id, share.token)).valid
    ).toBe(false);
    expect(
      await getPublicIndependentSiteBySlug(site.slug, {
        previewToken: share.token,
      })
    ).toBeNull();
  });

  it("23. Phase 2 — Détection explicite du contenu de démonstration (« Démonstration à personnaliser ») et préservation d’ATH VAHLOUL", async () => {
    const ownerId = 1005;
    const athDemo = await ensureAthVahloulDemoProject(ownerId);

    const demoStatus = detectIndependentDemoContentStatus({
      title: athDemo.title,
      slug: athDemo.slug,
      templateId: athDemo.templateId,
      pages: athDemo.pages,
    });
    expect(demoStatus.isDemoTemplate).toBe(true);
    expect(demoStatus.badgeLabel).toBe(DEMO_CONTENT_NOTICE_LABEL);
    expect(demoStatus.detectedMarkers.length).toBeGreaterThan(0);

    // Un projet personnalisé sans mention fictive n'est plus signalé comme démo
    const customStatus = detectIndependentDemoContentStatus({
      title: "Cabinet d’Architecture Minérale",
      slug: "cabinet-architecture-minerale",
      templateId: null,
      pages: [
        {
          id: "p1",
          title: "Accueil",
          slug: "/",
          parentPageId: null,
          showInMenu: true,
          menuOrder: 1,
          visibility: "public",
          seoTitle: "Cabinet d’Architecture Minérale à Lyon",
          seoDescription: "Conception bioclimatique, rénovation patrimoniale et suivi de chantier.",
          html: "<section><h1>Cabinet d’Architecture Minérale</h1><p>Nous accompagnons vos projets de construction durable à Lyon et en Auvergne-Rhône-Alpes.</p></section>",
          css: "",
        },
      ],
    });
    expect(customStatus.isDemoTemplate).toBe(false);
    expect(customStatus.hasUnchangedDemoMarkers).toBe(false);
  });

  it("24. Synchronisation déterministe de selectedSiteId au chargement, changement de projet, rechargement et isolation par siteId", () => {
    const projects = [
      { id: 101, slug: "cabinet-autre" },
      { id: 202, slug: "association-familiale-ath-vahloul" },
      { id: 303, slug: "collectif-montagne" },
    ];

    // 1. Chargement initial sans ?siteId= ni sessionStorage : préfère le slug actif (ATH VAHLOUL) s'il est accessible
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: null,
        requestedSiteId: null,
        requestedSlug: null,
        storedSiteId: null,
        preferredSlug: "association-familiale-ath-vahloul",
      }),
    ).toBe(202);

    // 2. Sans slug préféré correspondant, retombe sur le premier projet autorisé
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: null,
        preferredSlug: "inexistant",
      }),
    ).toBe(101);

    // 3. Changement de projet actif : currentSiteId autorisé est préservé
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: 303,
        requestedSiteId: 202,
        storedSiteId: 101,
      }),
    ).toBe(303);

    // 4. Rechargement complet : ?siteId= ou storedSiteId restaure exactement le projet ouvert
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: null,
        requestedSiteId: 303,
        storedSiteId: 202,
      }),
    ).toBe(303);
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: null,
        requestedSiteId: null,
        storedSiteId: 303,
        preferredSlug: "association-familiale-ath-vahloul",
      }),
    ).toBe(303);

    // 5. Ouverture par ?siteSlug= prioritaire sur sessionStorage
    expect(
      resolveInitialIndependentSiteId({
        projects,
        currentSiteId: null,
        requestedSlug: "collectif-montagne",
        storedSiteId: 202,
      }),
    ).toBe(303);

    // 6. Isolation stricte : un siteId non présent dans la liste autorisée est rejeté
    expect(
      resolveInitialIndependentSiteId({
        projects: [{ id: 202, slug: "association-familiale-ath-vahloul" }],
        currentSiteId: 999,
        requestedSiteId: 888,
        storedSiteId: 777,
      }),
    ).toBe(202);

    // 7. Aucun projet accessible -> null
    expect(
      resolveInitialIndependentSiteId({
        projects: [],
        currentSiteId: 202,
        requestedSiteId: 202,
      }),
    ).toBeNull();

    // 8. Synchronisation d'URL ?siteId= en supprimant les anciens siteSlug/slug tout en préservant page=
    expect(
      buildIndependentBuilderSelectionUrl("?siteSlug=association-familiale-ath-vahloul&page=/contact", 202),
    ).toBe("/constructeur-sites?page=%2Fcontact&siteId=202");
    expect(buildIndependentBuilderSelectionUrl("?siteId=202", null)).toBe(
      "/constructeur-sites",
    );
  });

  it("25. Réparation effective des alias connus ATH VAHLOUL (allowlist stricte) et conservation des liens inconnus", async () => {
    const ownerId = 1091;
    // Créer un projet ATH brut depuis le modèle (contient les 45 anciens liens connus)
    const athProject = await createIndependentSiteProject(ownerId, {
      title: "Association familiale ATH VAHLOUL",
      siteType: "familial",
      slug: "association-familiale-ath-vahloul-audit",
      templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
    });

    const initialReport = verifyIndependentInternalLinks(athProject.pages);
    expect(initialReport.brokenLinks).toHaveLength(45);

    // Injecter en plus un lien inconnu pour vérifier qu'il n'est JAMAIS remplacé automatiquement
    const pagesWithUnknown = athProject.pages.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            html: `${p.html}<a href="/lien-inconnu-editorial">Lien inconnu</a>`,
          }
        : p,
    );
    await saveIndependentSiteProject(ownerId, {
      siteId: athProject.id,
      pages: pagesWithUnknown,
    });

    const beforeRepair = verifyIndependentInternalLinks(pagesWithUnknown);
    expect(beforeRepair.brokenLinks).toHaveLength(46);

    // Exécuter la réparation serveur
    const repairedResult = await repairKnownIndependentSiteLinks(ownerId, athProject.id);
    expect(repairedResult.changes).toHaveLength(45);

    // Tous les alias connus doivent être mappés selon l'allowlist exacte
    const changeTargetsBySource = new Map<string, Set<string>>();
    for (const ch of repairedResult.changes) {
      if (!changeTargetsBySource.has(ch.sourceHref)) {
        changeTargetsBySource.set(ch.sourceHref, new Set());
      }
      changeTargetsBySource.get(ch.sourceHref)!.add(ch.targetHref);
    }
    expect(Array.from(changeTargetsBySource.get("/a-propos") ?? [])).toEqual(["/notre-famille"]);
    expect(Array.from(changeTargetsBySource.get("/histoire") ?? [])).toEqual(["/notre-famille"]);
    expect(Array.from(changeTargetsBySource.get("/membres") ?? [])).toEqual(["/notre-famille"]);
    expect(Array.from(changeTargetsBySource.get("/charte") ?? [])).toEqual(["/notre-famille"]);
    expect(Array.from(changeTargetsBySource.get("/participer") ?? [])).toEqual(["/contact"]);
    expect(Array.from(changeTargetsBySource.get("/mentions-legales") ?? [])).toEqual(["/contact"]);
    expect(Array.from(changeTargetsBySource.get("/confidentialite") ?? [])).toEqual(["/contact"]);

    // Le lien inconnu DOIT rester intact et signalé (jamais remplacé par /contact)
    const afterRepairReport = verifyIndependentInternalLinks(repairedResult.project.pages);
    expect(afterRepairReport.valid).toBe(false);
    expect(afterRepairReport.brokenLinks).toHaveLength(1);
    expect(afterRepairReport.brokenLinks[0]?.targetHref).toBe("/lien-inconnu-editorial");

    // Rechargement depuis le store : persistance vérifiée
    const reloaded = await getIndependentSiteProject(ownerId, athProject.id);
    expect(reloaded).not.toBeNull();
    const reloadedReport = verifyIndependentInternalLinks(reloaded!.pages);
    expect(reloadedReport.brokenLinks).toHaveLength(1);
    expect(reloadedReport.brokenLinks[0]?.targetHref).toBe("/lien-inconnu-editorial");

    // Si des pages dédiées /mentions-legales et /confidentialite existent, les liens restent vers elles
    const dedicatedPages = [
      {
        ...athProject.pages[0],
        html: '<a href="/mentions-legales">Mentions</a><a href="/confidentialite">Vie privée</a><a href="/inconnu-test">Inconnu</a>',
      },
      { ...athProject.pages[0], id: "p-ml", title: "Mentions légales", slug: "/mentions-legales", html: "<p>Mentions</p>" },
      { ...athProject.pages[0], id: "p-conf", title: "Confidentialité", slug: "/confidentialite", html: "<p>Conf</p>" },
      { ...athProject.pages[0], id: "p-contact", title: "Contact", slug: "/contact", html: "<p>Contact</p>" },
    ];
    const dedicatedRepaired = repairKnownIndependentInternalLinks(dedicatedPages);
    expect(dedicatedRepaired.changes).toHaveLength(0);
    expect(dedicatedRepaired.pages[0].html).toContain('href="/mentions-legales"');
    expect(dedicatedRepaired.pages[0].html).toContain('href="/confidentialite"');
    expect(dedicatedRepaired.pages[0].html).toContain('href="/inconnu-test"');

    // Absence de régression : zéro contamination boutique/e-commerce
    expect(() => assertZeroEcommerceInIndependentSite(reloaded!)).not.toThrow();
  });

  it("26. Absence de régression du constructeur boutique : le produit indépendant reste strictement séparé des fichiers Studio/Boutique", () => {
    const builderSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/site-builder/IndependentSiteBuilderPage.tsx"),
      "utf8",
    );
    expect(builderSource).toContain("resolveInitialIndependentSiteId");
    expect(builderSource).toContain("buildIndependentBuilderSelectionUrl");
    expect(builderSource).toContain("repairKnownInternalLinks");
    expect(builderSource).not.toContain("trpc.visualBuilder");
    expect(builderSource).not.toContain("trpc.shopify");
    expect(builderSource).not.toContain("trpc.orders");
  });

  it("27. enregistre les pages vues anonymes, agrège les pages populaires et isole les sites", async () => {
    const siteA = await createIndependentSiteProject(99101, { title: "Analytics A" });
    const siteB = await createIndependentSiteProject(99102, { title: "Analytics B" });

    await recordIndependentSitePageView({ siteId: siteA.id, visitorKey: "a".repeat(32), path: "/" });
    await recordIndependentSitePageView({ siteId: siteA.id, visitorKey: "a".repeat(32), path: "/contact" });
    await recordIndependentSitePageView({ siteId: siteA.id, visitorKey: "b".repeat(32), path: "/" });
    await recordIndependentSitePageView({ siteId: siteB.id, visitorKey: "c".repeat(32), path: "/autre-site" });
    await createIndependentSiteFormSubmission({
      siteId: siteA.id,
      name: "Visiteur",
      email: "visiteur@example.test",
      message: "Bonjour",
    });

    const summaryA = await getIndependentSiteAnalyticsSummary(siteA.id);
    expect(summaryA).toMatchObject({ visitors: 2, pageViews: 3, formsReceived: 1 });
    expect(summaryA.popularPages).toEqual([
      { path: "/", views: 2 },
      { path: "/contact", views: 1 },
    ]);
    const summaryB = await getIndependentSiteAnalyticsSummary(siteB.id);
    expect(summaryB).toMatchObject({ visitors: 1, pageViews: 1, formsReceived: 0 });
  });

  it("28. refuse les clés visiteur invalides avant toute écriture", async () => {
    await expect(
      recordIndependentSitePageView({ siteId: 99103, visitorKey: "not-a-valid-key", path: "/" }),
    ).rejects.toThrow("INDEPENDENT_ANALYTICS_VISITOR_KEY_INVALID");
  });
});
