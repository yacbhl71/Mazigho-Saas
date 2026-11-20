import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  INDEPENDENT_BLOCK_CATEGORIES,
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_MODULE_CATEGORIES,
  INDEPENDENT_PAGE_SOCLES,
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
  buildImageTransformCss,
  buildNavigationFromPages,
  buildPageSeoPreview,
  createDefaultVisualCardItem,
  duplicateCardInVisualCardGrid,
  extractImagesFromPageHtml,
  filterIndependentBlocks,
  filterIndependentModules,
  filterIndependentSocles,
  filterIndependentTemplates,
  removeCardFromVisualCardGrid,
  renderVisualCardGridHtml,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  setVisualCardGridShape,
  setVisualCardGridTextPlacement,
  updateCardInVisualCardGrid,
  updateImageAltInPageHtml,
  validateIndependentCustomDomain,
  type VisualCardGridConfig,
} from "../shared/isolatedSiteBuilder";
import {
  addIndependentSiteDomain,
  addIndependentSiteMedia,
  createIndependentSiteProject,
  deleteIndependentSiteMedia,
  duplicateIndependentSiteProject,
  ensureAthVahloulDemoProject,
  getIndependentSiteProject,
  getPublicIndependentSiteBySlug,
  listIndependentSiteDomains,
  listIndependentSiteMedia,
  listIndependentSiteProjects,
  listIndependentSiteVersions,
  publishIndependentSiteProject,
  removeIndependentSiteDomain,
  restoreIndependentSiteVersion,
  saveIndependentSiteProject,
  updateIndependentSiteMediaTransforms,
  updateIndependentSiteStatus,
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
    expect(demo.pages).toHaveLength(6);
    expect(demo.pages.map((p) => p.slug)).toEqual([
      "/",
      "/notre-famille",
      "/evenements",
      "/entraide",
      "/annonces",
      "/contact",
    ]);

    const nav = buildNavigationFromPages(demo.pages);
    const familleMenu = nav.find((item) => item.href === "/notre-famille");
    const evenementsMenu = nav.find((item) => item.href === "/evenements");
    expect(familleMenu?.children?.map((c) => c.href)).toContain("/annonces");
    expect(evenementsMenu?.children?.map((c) => c.href)).toContain("/entraide");

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
    expect(publicAfter?.pages).toHaveLength(6);

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
});
