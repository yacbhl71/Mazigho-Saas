export type VisualProjectCategory = "association" | "vitrine" | "evenement" | "boutique" | "autre";

export type VisualProjectMode = "storefront" | "independent" | "hybrid";

export type VisualProjectButtonStatus =
  | "Disponible"
  | "Désactivé"
  | "Nécessite une boutique"
  | "Brouillon non enregistré"
  | "Projet prêt à publier";

export interface VisualProjectModeOption {
  value: VisualProjectMode;
  label: string;
  shortLabel: string;
  description: string;
  requiresStoreInitially: boolean;
}

export const COMMERCE_MODULE_DISABLED_MESSAGE =
  "Ce module nécessite une boutique. Vous pourrez l’activer plus tard depuis les réglages du projet.";

export const VISUAL_PROJECT_MODE_OPTIONS: ReadonlyArray<VisualProjectModeOption> = [
  {
    value: "storefront",
    label: "Site avec boutique",
    shortLabel: "Site avec boutique",
    description: "Catalogue réel, produits, catégories, panier et publication directe vers une boutique MAZIGHO.",
    requiresStoreInitially: true,
  },
  {
    value: "independent",
    label: "Site vitrine sans boutique",
    shortLabel: "Site vitrine sans boutique",
    description: "Pages éditoriales, Hero, images, vidéos, FAQ, témoignages et contact, sans module e-commerce.",
    requiresStoreInitially: false,
  },
  {
    value: "hybrid",
    label: "Site hybride",
    shortLabel: "Site hybride",
    description: "Démarre comme un site vitrine et permet d’ajouter ou désactiver une boutique à tout moment sans perdre vos pages.",
    requiresStoreInitially: false,
  },
] as const;

export function getVisualProjectModeLabel(mode: VisualProjectMode): string {
  const found = VISUAL_PROJECT_MODE_OPTIONS.find((item) => item.value === mode);
  return found ? found.label : "Site avec boutique";
}

export function normalizeVisualProjectCategory(
  value: unknown,
  fallback: VisualProjectCategory = "vitrine"
): VisualProjectCategory {
  if (
    value === "association" ||
    value === "vitrine" ||
    value === "evenement" ||
    value === "boutique" ||
    value === "autre"
  ) {
    return value;
  }
  return fallback;
}

export function normalizeVisualProjectMode(
  value: unknown,
  fallback: VisualProjectMode = "storefront"
): VisualProjectMode {
  if (value === "storefront" || value === "independent" || value === "hybrid") {
    return value;
  }
  return fallback;
}

export interface ResolvedVisualProjectState {
  projectMode: VisualProjectMode;
  commerceEnabled: boolean;
  attachedStoreId: number | null;
}

/**
 * Resolves the functional mode of a visual project with full backward compatibility:
 * - Legacy store projects (context = "store") default to projectMode = "storefront", commerceEnabled = true.
 * - Legacy library projects (context = "library") default to projectMode = "independent", commerceEnabled = false.
 * - Category is NEVER used to force or alter the functional mode.
 */
export function resolveVisualProjectState(
  raw: Record<string, unknown> | null | undefined,
  context: "store" | "library" = "store"
): ResolvedVisualProjectState {
  const defaultMode: VisualProjectMode = context === "library" ? "independent" : "storefront";
  const rawMode = raw?.projectMode ?? raw?.siteMode;
  const projectMode = normalizeVisualProjectMode(rawMode, defaultMode);

  let commerceEnabled: boolean;
  if (projectMode === "storefront") {
    commerceEnabled = true;
  } else if (projectMode === "independent") {
    commerceEnabled = false;
  } else {
    // hybrid mode: respects explicit boolean commerceEnabled, defaults to false when created without commerce
    commerceEnabled = typeof raw?.commerceEnabled === "boolean" ? raw.commerceEnabled : false;
  }

  const rawStoreId = raw?.attachedStoreId ?? raw?.storeId;
  const attachedStoreId =
    typeof rawStoreId === "number" && Number.isFinite(rawStoreId) && rawStoreId > 0
      ? Math.trunc(rawStoreId)
      : null;

  return {
    projectMode,
    commerceEnabled,
    attachedStoreId,
  };
}

export interface VisualProjectCapabilityInput {
  projectMode: VisualProjectMode;
  commerceEnabled?: boolean;
  hasStoreSelected: boolean;
  saveTarget: "store" | "independent";
  hasUnsavedChanges?: boolean;
  preflightReady?: boolean;
}

export interface VisualProjectCapabilities {
  projectMode: VisualProjectMode;
  modeLabel: string;
  isCommerceActive: boolean;
  requiresStoreSelection: boolean;
  canSaveToLibrary: boolean;
  canSaveToStore: boolean;
  canUseRealCatalogue: boolean;
  canUseProductBlocks: boolean;
  canPublishToStore: boolean;
  canExportHtml: boolean;
  canEnableCommerce: boolean;
  canDisableCommerce: boolean;
  disabledCommerceReason: string | null;
  statusBadge: VisualProjectButtonStatus;
  buttonStates: {
    realCatalogue: VisualProjectButtonStatus;
    productBlocks: VisualProjectButtonStatus;
    save: VisualProjectButtonStatus;
    publish: VisualProjectButtonStatus;
    exportHtml: VisualProjectButtonStatus;
    addStore: VisualProjectButtonStatus;
    disableStore: VisualProjectButtonStatus;
  };
}

export function evaluateVisualProjectCapabilities(
  input: VisualProjectCapabilityInput
): VisualProjectCapabilities {
  const projectMode = normalizeVisualProjectMode(input.projectMode, "storefront");
  const isCommerceActive =
    projectMode === "storefront" || (projectMode === "hybrid" && Boolean(input.commerceEnabled));

  const requiresStoreSelection =
    projectMode === "storefront" ||
    (projectMode === "hybrid" && isCommerceActive) ||
    input.saveTarget === "store";

  const canSaveToLibrary = true;
  const canSaveToStore = input.hasStoreSelected && projectMode !== "independent";
  const canUseRealCatalogue = isCommerceActive && input.hasStoreSelected;
  const canUseProductBlocks = isCommerceActive;
  const canPublishToStore =
    isCommerceActive &&
    input.hasStoreSelected &&
    input.saveTarget === "store";
  const canExportHtml = true;
  const canEnableCommerce = projectMode !== "storefront" && !isCommerceActive;
  const canDisableCommerce = projectMode !== "independent" && isCommerceActive;

  const disabledCommerceReason = isCommerceActive ? null : COMMERCE_MODULE_DISABLED_MESSAGE;

  let statusBadge: VisualProjectButtonStatus;
  if (input.hasUnsavedChanges) {
    statusBadge = "Brouillon non enregistré";
  } else if (canPublishToStore && input.preflightReady) {
    statusBadge = "Projet prêt à publier";
  } else if (requiresStoreSelection && !input.hasStoreSelected) {
    statusBadge = "Nécessite une boutique";
  } else {
    statusBadge = "Disponible";
  }

  const realCatalogueState: VisualProjectButtonStatus = !isCommerceActive
    ? "Désactivé"
    : !input.hasStoreSelected
      ? "Nécessite une boutique"
      : "Disponible";

  const productBlocksState: VisualProjectButtonStatus = isCommerceActive
    ? "Disponible"
    : "Désactivé";

  const saveState: VisualProjectButtonStatus =
    input.saveTarget === "store" && !input.hasStoreSelected
      ? "Nécessite une boutique"
      : input.hasUnsavedChanges
        ? "Brouillon non enregistré"
        : "Disponible";

  const publishState: VisualProjectButtonStatus =
    projectMode === "independent" || !isCommerceActive
      ? "Désactivé"
      : !input.hasStoreSelected || input.saveTarget !== "store"
        ? "Nécessite une boutique"
        : input.preflightReady
          ? "Projet prêt à publier"
          : "Disponible";

  return {
    projectMode,
    modeLabel: getVisualProjectModeLabel(projectMode),
    isCommerceActive,
    requiresStoreSelection,
    canSaveToLibrary,
    canSaveToStore,
    canUseRealCatalogue,
    canUseProductBlocks,
    canPublishToStore,
    canExportHtml,
    canEnableCommerce,
    canDisableCommerce,
    disabledCommerceReason,
    statusBadge,
    buttonStates: {
      realCatalogue: realCatalogueState,
      productBlocks: productBlocksState,
      save: saveState,
      publish: publishState,
      exportHtml: "Disponible",
      addStore: canEnableCommerce
        ? input.hasStoreSelected
          ? "Disponible"
          : "Nécessite une boutique"
        : "Désactivé",
      disableStore: canDisableCommerce ? "Disponible" : "Désactivé",
    },
  };
}

export const COMMERCE_BUILDER_BLOCK_IDS = new Set<string>([
  "mazigho-products",
  "mazigho-category-grid",
  "mazigho-services-booking",
  "mazigho-services-menu",
  "mazigho-digital-asset-card",
  "mazigho-customer-portal",
]);

export function isCommerceBuilderBlock(block: { id: string; category?: string }): boolean {
  return COMMERCE_BUILDER_BLOCK_IDS.has(block.id) || Boolean(block.category?.includes("Catalogue") || block.category?.includes("Boutique") || block.category?.includes("Services & Numérique"));
}

export function filterBuilderBlocksForProjectMode<
  T extends { id: string; label?: string; category?: string; content?: string }
>(
  blocks: ReadonlyArray<T>,
  state: { projectMode: VisualProjectMode; commerceEnabled?: boolean }
): T[] {
  const isCommerceActive =
    state.projectMode === "storefront" ||
    (state.projectMode === "hybrid" && Boolean(state.commerceEnabled));

  if (isCommerceActive) {
    return [...blocks];
  }
  return blocks.filter((block) => !isCommerceBuilderBlock(block));
}

export interface VisualProjectModeTransitionResult {
  project: Record<string, unknown>;
  previousMode: VisualProjectMode;
  nextMode: VisualProjectMode;
  commerceEnabled: boolean;
  attachedStoreId: number | null;
  preservedPageCount: number;
  publicationExecuted: false;
  paymentKeysModified: false;
}

/**
 * Transitions a visual builder project JSON between modes without ever deleting pages,
 * editorial blocks, existing e-commerce blocks, reusable components, comments, styles, or images.
 * Never auto-publishes and never modifies payment keys.
 */
export function transitionVisualProjectMode(
  project: Record<string, unknown>,
  nextMode: VisualProjectMode,
  options?: {
    storeId?: number | null;
    enableCommerce?: boolean;
    context?: "store" | "library";
  }
): VisualProjectModeTransitionResult {
  const current = resolveVisualProjectState(project, options?.context ?? "store");
  const normalizedNext = normalizeVisualProjectMode(nextMode, current.projectMode);

  let commerceEnabled: boolean;
  if (normalizedNext === "storefront") {
    commerceEnabled = true;
  } else if (normalizedNext === "independent") {
    commerceEnabled = false;
  } else {
    commerceEnabled =
      typeof options?.enableCommerce === "boolean"
        ? options.enableCommerce
        : current.commerceEnabled;
  }

  const nextStoreId =
    options?.storeId !== undefined
      ? options.storeId && options.storeId > 0
        ? Math.trunc(options.storeId)
        : null
      : current.attachedStoreId;

  const pages = Array.isArray(project.pages) ? project.pages : [];

  const nextProject: Record<string, unknown> = {
    ...project,
    projectMode: normalizedNext,
    commerceEnabled,
    attachedStoreId: nextStoreId,
    modeUpdatedAt: new Date().toISOString(),
  };

  return {
    project: nextProject,
    previousMode: current.projectMode,
    nextMode: normalizedNext,
    commerceEnabled,
    attachedStoreId: nextStoreId,
    preservedPageCount: pages.length,
    publicationExecuted: false,
    paymentKeysModified: false,
  };
}

/**
 * Action « Ajouter une boutique »:
 * Requires a valid target storeId, enables commerce modules, preserves 100% of existing pages/blocks/images/styles,
 * never modifies payment keys, and never auto-publishes.
 */
export function enableVisualProjectCommerce(
  project: Record<string, unknown>,
  storeId: number | null | undefined,
  options?: { targetMode?: "hybrid" | "storefront" }
): VisualProjectModeTransitionResult {
  const validStoreId =
    typeof storeId === "number" && Number.isFinite(storeId) && storeId > 0
      ? Math.trunc(storeId)
      : null;

  if (!validStoreId) {
    throw new Error("VISUAL_PROJECT_STORE_REQUIRED");
  }

  const current = resolveVisualProjectState(project, "store");
  const targetMode: VisualProjectMode =
    options?.targetMode ?? (current.projectMode === "storefront" ? "storefront" : "hybrid");

  return transitionVisualProjectMode(project, targetMode, {
    storeId: validStoreId,
    enableCommerce: true,
    context: "store",
  });
}

/**
 * Action « Désactiver la boutique »:
 * Hides e-commerce modules in the Visual Builder while preserving all pages, blocks, images, styles,
 * and existing e-commerce block definitions inside the project JSON. Never deletes store catalogue,
 * never deletes orders, never modifies API keys, and never auto-publishes.
 */
export function disableVisualProjectCommerce(
  project: Record<string, unknown>
): VisualProjectModeTransitionResult {
  return transitionVisualProjectMode(project, "hybrid", {
    enableCommerce: false,
    context: "store",
  });
}

export interface LibraryProjectAttachmentResult {
  storeId: number;
  sourceLibraryProjectId: number;
  sourceLibraryPreserved: true;
  targetStoreProject: Record<string, unknown>;
  projectMode: "storefront" | "hybrid";
  commerceEnabled: boolean;
  publicationExecuted: false;
  paymentKeysModified: false;
}

/**
 * Attaches/copies an independent library project to a target store without modifying or deleting
 * the original project in the Bibliothèque Studio Mazigho.
 */
export function prepareLibraryProjectStoreAttachment(
  sourceProject: {
    id: number;
    title: string;
    category: string;
    mode: string;
    projectMode?: unknown;
    project: Record<string, unknown>;
  },
  targetStoreId: number,
  options?: {
    targetMode?: "storefront" | "hybrid";
    enableCommerce?: boolean;
  }
): LibraryProjectAttachmentResult {
  if (!Number.isFinite(targetStoreId) || targetStoreId <= 0) {
    throw new Error("VISUAL_PROJECT_STORE_REQUIRED");
  }

  const normalizedStoreId = Math.trunc(targetStoreId);
  const targetMode: "storefront" | "hybrid" = options?.targetMode ?? "hybrid";
  const commerceEnabled =
    targetMode === "storefront"
      ? true
      : typeof options?.enableCommerce === "boolean"
        ? options.enableCommerce
        : true;

  // Deep clone the project payload so the source library record is untouched
  const clonedPayload = JSON.parse(JSON.stringify(sourceProject.project || {})) as Record<
    string,
    unknown
  >;

  const targetStoreProject: Record<string, unknown> = {
    ...clonedPayload,
    projectMode: targetMode,
    commerceEnabled,
    attachedStoreId: normalizedStoreId,
    sourceLibraryProjectId: sourceProject.id,
    sourceLibraryTitle: sourceProject.title,
    sourceLibraryCategory: normalizeVisualProjectCategory(sourceProject.category, "vitrine"),
    attachedAt: new Date().toISOString(),
  };

  return {
    storeId: normalizedStoreId,
    sourceLibraryProjectId: sourceProject.id,
    sourceLibraryPreserved: true,
    targetStoreProject,
    projectMode: targetMode,
    commerceEnabled,
    publicationExecuted: false,
    paymentKeysModified: false,
  };
}

const FORBIDDEN_SECRET_KEY_NAME_PATTERN =
  /^(?:stripe(?:SecretKey|[_-]secret[_-]key)|stripe(?:WebhookSecret|[_-]webhook[_-]secret)|paypal(?:ClientSecret|[_-]client[_-]secret|WebhookId|[_-]webhook[_-]id)|api(?:Secret|[_-]secret)|private(?:Key|[_-]key)|secret(?:Key|[_-]key)|client(?:Secret|[_-]secret)|access(?:Token|[_-]token)|refresh(?:Token|[_-]token)|encryption(?:Key|[_-]key)|sentry(?:AuthToken|[_-]auth[_-]token))$/i;

const FORBIDDEN_SECRET_VALUE_PATTERNS: ReadonlyArray<RegExp> = [
  new RegExp(["sk", "(?:live|test)", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp(["rk", "(?:live|test)", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp(["whsec", "[A-Za-z0-9]{16,}"].join("_")),
  new RegExp("xkeysib-[A-Za-z0-9-]{20,}"),
  new RegExp(["(?:ghp|github_pat)", "[A-Za-z0-9_]{20,}"].join("_")),
  new RegExp("-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
];

/**
 * Ensures no payment keys, API secrets, or sensitive credentials are stored inside
 * a visual builder project JSON payload.
 */
export function assertNoSecretsInVisualProject(payload: unknown): void {
  const visited = new Set<unknown>();

  function inspect(node: unknown): void {
    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        for (const pattern of FORBIDDEN_SECRET_VALUE_PATTERNS) {
          if (pattern.test(node)) {
            throw new Error("VISUAL_PROJECT_SECRET_DETECTED");
          }
        }
      }
      return;
    }

    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        inspect(item);
      }
      return;
    }

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_SECRET_KEY_NAME_PATTERN.test(key) && typeof value === "string" && value.trim().length > 0) {
        throw new Error("VISUAL_PROJECT_SECRET_DETECTED");
      }
      inspect(value);
    }
  }

  inspect(payload);
}

/**
 * Strips dynamic store catalogue placeholder sections when a hybrid project is saved/published
 * with commerceEnabled === false so it never renders a fake or unauthorized catalogue.
 */
export function stripPublishedCatalogueMarkers(html: string): string {
  if (!html) return "";
  return html.replace(
    /<section\b[^>]*\bdata-mazigho-dynamic=["']catalogue["'][^>]*>[\s\S]*?<\/section>/gi,
    ""
  );
}
