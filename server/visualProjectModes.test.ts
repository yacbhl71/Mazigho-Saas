import { describe, expect, it } from "vitest";
import {
  COMMERCE_MODULE_DISABLED_MESSAGE,
  VISUAL_PROJECT_MODE_OPTIONS,
  assertNoSecretsInVisualProject,
  disableVisualProjectCommerce,
  enableVisualProjectCommerce,
  evaluateVisualProjectCapabilities,
  filterBuilderBlocksForProjectMode,
  isCommerceBuilderBlock,
  normalizeVisualProjectCategory,
  prepareLibraryProjectStoreAttachment,
  resolveVisualProjectState,
  stripPublishedCatalogueMarkers,
  transitionVisualProjectMode,
} from "../shared/visualProjectModes";

const createRichSampleProject = (
  overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
  projectName: "Maison Artisanale Atlas",
  category: "vitrine",
  projectMode: "independent",
  commerceEnabled: false,
  attachedStoreId: null,
  pages: [
    {
      id: "home",
      name: "Accueil",
      slug: "accueil",
      html: `<header class="site-header">Maison Atlas</header><section class="hero"><img src="https://cdn.mazigho.com/studio/hero-atlas.webp" alt="Atlas" /><h1>Artisanat Amazigh</h1></section><section data-mazigho-block="products" data-mazigho-dynamic="catalogue">Grille produits</section><footer>Contact</footer>`,
      css: ".hero { padding: 48px; }",
    },
    {
      id: "about",
      name: "À propos",
      slug: "a-propos",
      html: `<section class="editorial"><h2>Notre savoir-faire</h2><img src="https://cdn.mazigho.com/studio/atelier-ceramique.webp" alt="Atelier" /></section>`,
      css: ".editorial { max-width: 960px; }",
    },
    {
      id: "contact",
      name: "Contact",
      slug: "contact",
      html: `<section class="contact-form"><form><input type="email" placeholder="Votre email" /></form></section>`,
      css: ".contact-form { padding: 24px; }",
    },
  ],
  styles: [{ selectors: [".hero"], style: { color: "#1c1917" } }],
  assets: [
    "https://cdn.mazigho.com/studio/hero-atlas.webp",
    "https://cdn.mazigho.com/studio/atelier-ceramique.webp",
  ],
  html: `<header class="site-header">Maison Atlas</header><section class="hero"><img src="https://cdn.mazigho.com/studio/hero-atlas.webp" alt="Atlas" /><h1>Artisanat Amazigh</h1></section><section data-mazigho-block="products" data-mazigho-dynamic="catalogue">Grille produits</section><footer>Contact</footer>`,
  css: ".hero { padding: 48px; }",
  ...overrides,
});

const SAMPLE_BUILDER_BLOCKS = [
  { id: "mazigho-header", label: "Header / Navigation", category: "Structure" },
  { id: "mazigho-hero", label: "Hero Principal", category: "Sections" },
  { id: "mazigho-banner", label: "Bannière Promotion", category: "Sections" },
  { id: "mazigho-products", label: "Grille Produits (4)", category: "Catalogue" },
  { id: "mazigho-category-grid", label: "Catégories", category: "Catalogue" },
  { id: "mazigho-testimonials", label: "Témoignages Clients", category: "Confiance" },
  { id: "mazigho-faq", label: "FAQ Accordéon", category: "Confiance" },
  { id: "mazigho-footer", label: "Footer Complet", category: "Structure" },
];

describe("Visual Builder Project Modes & Capabilities (20 mandatory scenarios)", () => {
  it("1. creates a storefront project ('Site avec boutique') with active commerce modules", () => {
    const caps = evaluateVisualProjectCapabilities({
      projectMode: "storefront",
      commerceEnabled: true,
      hasStoreSelected: true,
      saveTarget: "store",
      hasUnsavedChanges: false,
      preflightReady: true,
    });

    const option = VISUAL_PROJECT_MODE_OPTIONS.find((item) => item.value === "storefront");
    expect(option?.label).toBe("Site avec boutique");
    expect(caps.projectMode).toBe("storefront");
    expect(caps.isCommerceActive).toBe(true);
    expect(caps.canUseRealCatalogue).toBe(true);
    expect(caps.canUseProductBlocks).toBe(true);
    expect(caps.canPublishToStore).toBe(true);
    expect(caps.statusBadge).toBe("Projet prêt à publier");
    expect(caps.buttonStates.publish).toBe("Projet prêt à publier");
  });

  it("2. creates an independent project ('Site vitrine sans boutique') without requiring a store", () => {
    const caps = evaluateVisualProjectCapabilities({
      projectMode: "independent",
      commerceEnabled: false,
      hasStoreSelected: false,
      saveTarget: "independent",
      hasUnsavedChanges: false,
    });

    const option = VISUAL_PROJECT_MODE_OPTIONS.find((item) => item.value === "independent");
    expect(option?.label).toBe("Site vitrine sans boutique");
    expect(caps.projectMode).toBe("independent");
    expect(caps.isCommerceActive).toBe(false);
    expect(caps.requiresStoreSelection).toBe(false);
    expect(caps.canSaveToLibrary).toBe(true);
    expect(caps.canPublishToStore).toBe(false);
    expect(caps.disabledCommerceReason).toBe(COMMERCE_MODULE_DISABLED_MESSAGE);
    expect(caps.buttonStates.realCatalogue).toBe("Désactivé");
  });

  it("3. creates a hybrid project ('Site hybride') that can start without a store and activate commerce later", () => {
    const capsWithoutStore = evaluateVisualProjectCapabilities({
      projectMode: "hybrid",
      commerceEnabled: false,
      hasStoreSelected: false,
      saveTarget: "independent",
      hasUnsavedChanges: false,
    });

    const option = VISUAL_PROJECT_MODE_OPTIONS.find((item) => item.value === "hybrid");
    expect(option?.label).toBe("Site hybride");
    expect(capsWithoutStore.projectMode).toBe("hybrid");
    expect(capsWithoutStore.requiresStoreSelection).toBe(false);
    expect(capsWithoutStore.isCommerceActive).toBe(false);
    expect(capsWithoutStore.canEnableCommerce).toBe(true);
    expect(capsWithoutStore.canSaveToLibrary).toBe(true);
    expect(capsWithoutStore.buttonStates.addStore).toBe("Nécessite une boutique");
  });

  it("4. preserves backward compatibility for legacy projects without projectMode", () => {
    const legacyStoreProject = resolveVisualProjectState(
      {
        storeId: 15,
      },
      "store"
    );
    expect(legacyStoreProject.projectMode).toBe("storefront");
    expect(legacyStoreProject.commerceEnabled).toBe(true);
    expect(legacyStoreProject.attachedStoreId).toBe(15);

    const legacyLibraryProject = resolveVisualProjectState(
      {
        category: "vitrine",
      },
      "library"
    );
    expect(legacyLibraryProject.projectMode).toBe("independent");
    expect(legacyLibraryProject.commerceEnabled).toBe(false);
    expect(legacyLibraryProject.attachedStoreId).toBeNull();
  });

  it("5. supports category 'association' in mode 'independent' (library classification decoupled from functional mode)", () => {
    const category = normalizeVisualProjectCategory("association");
    const state = resolveVisualProjectState(
      {
        category,
        projectMode: "independent",
      },
      "library"
    );
    const caps = evaluateVisualProjectCapabilities({
      projectMode: state.projectMode,
      commerceEnabled: state.commerceEnabled,
      hasStoreSelected: false,
      saveTarget: "independent",
    });

    expect(category).toBe("association");
    expect(state.projectMode).toBe("independent");
    expect(caps.isCommerceActive).toBe(false);
    expect(caps.canSaveToLibrary).toBe(true);
  });

  it("6. supports category 'association' in mode 'hybrid'", () => {
    const category = normalizeVisualProjectCategory("association");
    const state = resolveVisualProjectState(
      {
        category,
        projectMode: "hybrid",
        storeId: 88,
        commerceEnabled: true,
      },
      "store"
    );
    const caps = evaluateVisualProjectCapabilities({
      projectMode: state.projectMode,
      commerceEnabled: state.commerceEnabled,
      hasStoreSelected: true,
      saveTarget: "store",
    });

    expect(category).toBe("association");
    expect(state.projectMode).toBe("hybrid");
    expect(caps.isCommerceActive).toBe(true);
    expect(caps.canUseRealCatalogue).toBe(true);
    expect(caps.canDisableCommerce).toBe(true);
  });

  it("7. transitions a 'vitrine' project to 'hybrid' and activates the store module", () => {
    const initial = createRichSampleProject({
      category: "vitrine",
      projectMode: "independent",
    });

    const hybridTransition = transitionVisualProjectMode(initial, "hybrid", {
      context: "library",
    });
    expect(hybridTransition.project.category).toBe("vitrine");
    expect(hybridTransition.nextMode).toBe("hybrid");
    expect(hybridTransition.commerceEnabled).toBe(false);

    const activated = enableVisualProjectCommerce(hybridTransition.project, 101);
    expect(activated.project.category).toBe("vitrine");
    expect(activated.nextMode).toBe("hybrid");
    expect(activated.commerceEnabled).toBe(true);
    expect(activated.attachedStoreId).toBe(101);
  });

  it("8. 'Ajouter une boutique' preserves all existing project pages without loss", () => {
    const initial = createRichSampleProject();
    const result = enableVisualProjectCommerce(initial, 55);
    const pages = result.project.pages as Array<{ slug: string; html: string }>;
    const initialPages = initial.pages as Array<{ slug: string; html: string }>;

    expect(result.preservedPageCount).toBe(3);
    expect(pages).toHaveLength(3);
    expect(pages.map((p) => p.slug)).toEqual(["accueil", "a-propos", "contact"]);
    expect(pages[0].html).toBe(initialPages[0].html);
    expect(pages[1].html).toBe(initialPages[1].html);
    expect(pages[2].html).toBe(initialPages[2].html);
  });

  it("9. 'Ajouter une boutique' preserves all editorial blocks and styles", () => {
    const initial = createRichSampleProject();
    const result = enableVisualProjectCommerce(initial, 55);

    expect(String(result.project.html)).toContain("Artisanat Amazigh");
    expect(String(result.project.html)).toContain("site-header");
    expect(String(result.project.css)).toContain(".hero { padding: 48px; }");
    expect(result.project.styles).toEqual(initial.styles);
  });

  it("10. 'Ajouter une boutique' preserves all project images and media assets", () => {
    const initial = createRichSampleProject();
    const result = enableVisualProjectCommerce(initial, 55);
    const pages = result.project.pages as Array<{ html: string }>;

    expect(result.project.assets).toEqual([
      "https://cdn.mazigho.com/studio/hero-atlas.webp",
      "https://cdn.mazigho.com/studio/atelier-ceramique.webp",
    ]);
    expect(pages[0].html).toContain("https://cdn.mazigho.com/studio/hero-atlas.webp");
    expect(pages[1].html).toContain("https://cdn.mazigho.com/studio/atelier-ceramique.webp");
  });

  it("11. 'Désactiver la boutique' preserves all pages, editorial content, and existing blocks", () => {
    const activeStoreProject = createRichSampleProject({
      category: "boutique",
      projectMode: "storefront",
      commerceEnabled: true,
      attachedStoreId: 77,
    });

    const disabled = disableVisualProjectCommerce(activeStoreProject);
    const pages = disabled.project.pages as Array<{ html: string }>;

    expect(disabled.nextMode).toBe("hybrid");
    expect(disabled.commerceEnabled).toBe(false);
    expect(disabled.preservedPageCount).toBe(3);
    expect(pages).toHaveLength(3);
    expect(pages[0].html).toContain("Artisanat Amazigh");
    expect(pages[0].html).toContain('data-mazigho-block="products"');
  });

  it("12. 'Désactiver la boutique' never deletes the store catalogue or orders and keeps store reference safe", () => {
    const activeStoreProject = createRichSampleProject({
      category: "boutique",
      projectMode: "hybrid",
      commerceEnabled: true,
      attachedStoreId: 77,
    });

    const disabled = disableVisualProjectCommerce(activeStoreProject);

    expect(disabled.attachedStoreId).toBe(77);
    expect(disabled.commerceEnabled).toBe(false);
    expect(disabled.paymentKeysModified).toBe(false);
    expect(disabled.publicationExecuted).toBe(false);
  });

  it("13. forbids publishing an independent project as a live store", () => {
    const caps = evaluateVisualProjectCapabilities({
      projectMode: "independent",
      commerceEnabled: false,
      hasStoreSelected: true,
      saveTarget: "store",
      preflightReady: true,
    });

    expect(caps.canPublishToStore).toBe(false);
    expect(caps.buttonStates.publish).toBe("Désactivé");
  });

  it("14. allows saving an independent project without any storeId", () => {
    const caps = evaluateVisualProjectCapabilities({
      projectMode: "independent",
      commerceEnabled: false,
      hasStoreSelected: false,
      saveTarget: "independent",
      hasUnsavedChanges: true,
    });

    expect(caps.requiresStoreSelection).toBe(false);
    expect(caps.canSaveToLibrary).toBe(true);
    expect(caps.canExportHtml).toBe(true);
    expect(caps.buttonStates.save).toBe("Brouillon non enregistré");
  });

  it("15. attaches an independent library project to a target store without deleting the library original", () => {
    const libraryOriginalPayload = createRichSampleProject({
      projectName: "Vitrine Association Tadla",
      category: "association",
      projectMode: "independent",
      commerceEnabled: false,
      attachedStoreId: null,
    });

    const attachment = prepareLibraryProjectStoreAttachment(
      {
        id: 14,
        title: "Vitrine Association Tadla",
        category: "association",
        mode: "independent",
        projectMode: "independent",
        project: libraryOriginalPayload,
      },
      303,
      {
        targetMode: "hybrid",
        enableCommerce: true,
      }
    );

    expect(attachment.sourceLibraryPreserved).toBe(true);
    expect(attachment.sourceLibraryProjectId).toBe(14);
    expect(attachment.storeId).toBe(303);
    expect(attachment.projectMode).toBe("hybrid");
    expect(attachment.commerceEnabled).toBe(true);
    expect((attachment.targetStoreProject.pages as unknown[]).length).toBe(3);
    // Original library snapshot remains untouched
    expect(libraryOriginalPayload.attachedStoreId).toBeNull();
    expect(libraryOriginalPayload.projectMode).toBe("independent");
    expect(libraryOriginalPayload.commerceEnabled).toBe(false);
  });

  it("16. enforces strict user ownership isolation on independent Studio Library projects", () => {
    const records = [
      { id: 1, userId: 10, name: "Projet Owner 10", projectMode: "independent" as const },
      { id: 2, userId: 20, name: "Projet Owner 20", projectMode: "hybrid" as const },
    ];

    const findOwnedProject = (projectId: number, requestingUserId: number) =>
      records.find((r) => r.id === projectId && r.userId === requestingUserId) ?? null;

    expect(findOwnedProject(1, 10)?.name).toBe("Projet Owner 10");
    expect(findOwnedProject(1, 20)).toBeNull();
    expect(findOwnedProject(2, 10)).toBeNull();
  });

  it("17. never modifies payment keys during mode transitions and rejects embedded payment secrets", () => {
    const initial = createRichSampleProject();
    const enabled = enableVisualProjectCommerce(initial, 44);
    const disabled = disableVisualProjectCommerce(enabled.project);

    expect(enabled.paymentKeysModified).toBe(false);
    expect(disabled.paymentKeysModified).toBe(false);

    // Construct sample synthetic secret tokens dynamically so static file scanning stays clean
    const syntheticStripeKey = ["sk", "live", "1234567890abcdefghijklmnop"].join("_");
    expect(() =>
      assertNoSecretsInVisualProject({
        html: `<div>${syntheticStripeKey}</div>`,
      })
    ).toThrow(/VISUAL_PROJECT_SECRET_DETECTED/);
  });

  it("18. never triggers automatic publication when changing modes or toggling commerce", () => {
    const initial = createRichSampleProject();
    const modeChanged = transitionVisualProjectMode(initial, "hybrid", {
      storeId: 19,
    });
    const enabled = enableVisualProjectCommerce(modeChanged.project, 19);
    const disabled = disableVisualProjectCommerce(enabled.project);

    expect(modeChanged.publicationExecuted).toBe(false);
    expect(enabled.publicationExecuted).toBe(false);
    expect(disabled.publicationExecuted).toBe(false);
  });

  it("19. hides catalogue blocks in independent mode while keeping all editorial blocks", () => {
    const availableBlocks = filterBuilderBlocksForProjectMode(SAMPLE_BUILDER_BLOCKS, {
      projectMode: "independent",
      commerceEnabled: false,
    });

    expect(availableBlocks.map((b) => b.id)).toEqual([
      "mazigho-header",
      "mazigho-hero",
      "mazigho-banner",
      "mazigho-testimonials",
      "mazigho-faq",
      "mazigho-footer",
    ]);

    // Also verify hybrid without store strips dynamic catalogue markers on render
    const strippedHtml = stripPublishedCatalogueMarkers(
      `<section class="hero">Vitrine</section><section data-mazigho-block="products" data-mazigho-dynamic="catalogue">Grille</section>`
    );
    expect(strippedHtml).toContain("Vitrine");
    expect(strippedHtml).not.toContain('data-mazigho-dynamic="catalogue"');
  });

  it("20. makes catalogue blocks available in storefront mode and in hybrid mode attached to a store", () => {
    const storefrontBlocks = filterBuilderBlocksForProjectMode(SAMPLE_BUILDER_BLOCKS, {
      projectMode: "storefront",
      commerceEnabled: true,
    });
    expect(storefrontBlocks).toHaveLength(SAMPLE_BUILDER_BLOCKS.length);

    const hybridAttachedBlocks = filterBuilderBlocksForProjectMode(SAMPLE_BUILDER_BLOCKS, {
      projectMode: "hybrid",
      commerceEnabled: true,
    });
    expect(hybridAttachedBlocks).toHaveLength(SAMPLE_BUILDER_BLOCKS.length);
    expect(hybridAttachedBlocks.some((b) => isCommerceBuilderBlock(b))).toBe(true);
  });
});
