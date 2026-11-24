import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import GjsEditor from "@grapesjs/react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { trpc } from "@/lib/trpc";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  DEFAULT_IMAGE_TRANSFORMS,
  DEMO_CONTENT_NOTICE_LABEL,
  INDEPENDENT_BLOCK_CATEGORIES,
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_HELP_GUIDES,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_MODULE_CATEGORIES,
  INDEPENDENT_NAV_AND_FOOTER_PRESETS,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_PROJECT_MODE_OPTIONS,
  INDEPENDENT_RESPONSIVE_BASE_CSS,
  INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE,
  INDEPENDENT_SITE_ROLE_PRESENTATIONS,
  INDEPENDENT_SITE_TEMPLATES,
  INDEPENDENT_SITE_TYPE_OPTIONS,
  RESPONSIVE_DEVICE_PRESETS,
  VISUAL_CARD_SAMPLE_IMAGES,
  VISUAL_CARD_USE_CASE_PRESETS,
  addCardToVisualCardGrid,
  applyVisualCardUseCasePreset,
  assessIndependentMediaItem,
  auditIndependentPageSeo,
  buildEditorPreviewUrl,
  buildImageTransformCss,
  buildIndependentBuilderSelectionUrl,
  buildIndependentVersionPreview,
  buildLocalSafetyStorageKey,
  buildNavigationFromPages,
  buildPageSeoPreview,
  computeIndependentProjectWorkflowState,
  createDefaultVisualCardItem,
  createLocalSafetySnapshot,
  duplicateCardInVisualCardGrid,
  duplicateIndependentPageInList,
  duplicateIndependentReusableBlockInList,
  ensureNonEmptyIndependentPages,
  evaluateIndependentSiteQualityAndChecklist,
  exportIndependentSiteProjectToJson,
  extractImagesFromPageHtml,
  filterIndependentBlocks,
  filterIndependentMediaItems,
  filterIndependentModules,
  filterIndependentSocles,
  filterIndependentTemplates,
  formatIndependentBuilderErrorMessage,
  getIndependentSiteRolePresentation,
  normalizeIndependentPageSlug,
  parseBuilderQueryParams,
  removeCardFromVisualCardGrid,
  renderVisualCardGridHtml,
  reorderIndependentPagesMenu,
  replaceMediaUrlAcrossPages,
  resolveInitialIndependentSiteId,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  setVisualCardGridShape,
  setVisualCardGridTextPlacement,
  shouldOfferLocalSafetyRestore,
  updateCardInVisualCardGrid,
  updateImageAltInPageHtml,
  validateAndSanitizeIndependentSiteImport,
  verifyIndependentInternalLinks,
  type IndependentBuilderBlock,
  type IndependentBuilderLibraryTab,
  type IndependentBuilderLocalSafetySnapshot,
  type IndependentImageTransforms,
  type IndependentProjectMode,
  type IndependentSitePage,
  type IndependentSiteReusableBlock,
  type IndependentSiteStatus,
  type IndependentSiteType,
  type ResponsiveDevicePresetId,
  type ResponsiveViewportMode,
  type VisualCardGridConfig,
  type VisualCardShape,
  type VisualCardTextPlacement,
  type VisualCardUseCaseId,
} from "@shared/isolatedSiteBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  Film,
  FlipHorizontal,
  FlipVertical,
  FolderKanban,
  Globe,
  HelpCircle,
  History,
  ImagePlus,
  Laptop,
  Layers,
  LayoutGrid,
  Lock,
  Move,
  Palette,
  Pencil,
  Plus,
  Redo2,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  Unlock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BUILDER_GUIDE_CONFIG } from "@/components/site-guides/builderGuideContent";
import {
  SiteTrainingModal,
  type TrainingModalMode,
} from "@/components/site-guides/SiteTrainingModal";
import { buildClientPreviewSrcDoc } from "./clientAdminHelpers";

const INDEPENDENT_BLOCK_PALETTE: Record<
  string,
  { surface: string; border: string; text: string; active: string }
> = {
  Code: { surface: "#f1e8ff", border: "#c4a5f5", text: "#6d28d9", active: "#7c3aed" },
  "Navigation & Structure": { surface: "#e2f8f5", border: "#8bd8cf", text: "#0f766e", active: "#0f9f93" },
  "Hero & Bannières": { surface: "#fff3d6", border: "#f3cc72", text: "#a16207", active: "#d69b16" },
  "Textes & Actions": { surface: "#e5f2ff", border: "#9bc7f2", text: "#2563a8", active: "#3b82c4" },
  "Images & Médias": { surface: "#fff3d6", border: "#f3cc72", text: "#a16207", active: "#d69b16" },
  "Cartes & Grilles": { surface: "#f7e8f1", border: "#e4a8c5", text: "#a63d70", active: "#c05286" },
  "Confiance & Contenu": { surface: "#e5f2ff", border: "#9bc7f2", text: "#2563a8", active: "#3b82c4" },
  "Contact & Décoration": { surface: "#f1e8ff", border: "#c4a5f5", text: "#6d28d9", active: "#7c3aed" },
};

function getIndependentBlockPalette(category: IndependentBuilderBlock["category"]) {
  return INDEPENDENT_BLOCK_PALETTE[category] ?? INDEPENDENT_BLOCK_PALETTE["Textes & Actions"];
}

interface LayerSummaryItem {
  id: string;
  tagName: string;
  label: string;
  locked: boolean;
  hidden: boolean;
}

interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
}

type InspectorTabId = "seo" | "qualite" | "publication" | "versions" | "access";

const LIBRARY_TAB_META: Record<
  IndependentBuilderLibraryTab,
  {
    icon: LucideIcon;
    hint: string;
    roleExplanation: string;
    activeClass: string;
    iconClass: string;
  }
> = {
  pages: {
    icon: FilePlus2,
    hint: "Pages & menus",
    roleExplanation:
      "Gérez l’arborescence de votre site : ajoutez des pages principales, créez des sous-menus et organisez la navigation.",
    activeClass: "bg-[#172033] text-white shadow-xs",
    iconClass: "text-sky-600",
  },
  blocs: {
    icon: LayoutGrid,
    hint: "Sections visuelles",
    roleExplanation:
      "Élément visuel simple (bannière, texte, cartes avec bouton « + », boutons, colonnes) à insérer où vous le souhaitez dans la page active.",
    activeClass: "bg-[#9b563e] text-white shadow-xs",
    iconClass: "text-[#9b563e]",
  },
  medias: {
    icon: ImagePlus,
    hint: "Images du projet",
    roleExplanation:
      "Ajoutez vos photos et logos, ajustez leur rotation, zoom ou inclinaison, puis insérez-les en un clic dans la page.",
    activeClass: "bg-emerald-800 text-white shadow-xs",
    iconClass: "text-emerald-600",
  },
  calques: {
    icon: Layers,
    hint: "Ordre des sections",
    roleExplanation:
      "Visualisez toutes les sections de la page active pour les déplacer vers le haut/bas, les masquer, les verrouiller ou les dupliquer.",
    activeClass: "bg-slate-800 text-white shadow-xs",
    iconClass: "text-violet-600",
  },
  modules: {
    icon: Sparkles,
    hint: "Fonctions prêtes",
    roleExplanation:
      "Composant fonctionnel complet (agenda d’événements, formulaire de contact, galerie photo, trombinoscope, FAQ, horaires) prêt à l’emploi.",
    activeClass: "bg-[#7c3f2c] text-white shadow-xs",
    iconClass: "text-amber-600",
  },
  socles: {
    icon: FolderKanban,
    hint: "Structures de page",
    roleExplanation:
      "Structure complète d’une seule page (ex. page Accueil, page Contact, page Équipe) qui remplace le contenu de la page active.",
    activeClass: "bg-teal-800 text-white shadow-xs",
    iconClass: "text-teal-600",
  },
  modeles: {
    icon: Palette,
    hint: "Sites complets",
    roleExplanation:
      "Site multi-pages complet prêt à personnaliser (avec son thème, ses couleurs, son menu et toutes ses pages pré-remplies).",
    activeClass: "bg-[#172033] text-white shadow-xs",
    iconClass: "text-indigo-600",
  },
};

const INDEPENDENT_BUILDER_SELECTED_SITE_STORAGE_KEY =
  "mazigho_independent_builder_selected_site_id";

function readStoredSelectedSiteId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(
      INDEPENDENT_BUILDER_SELECTED_SITE_STORAGE_KEY,
    );
    if (!raw || !/^\d+$/.test(raw)) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export default function IndependentSiteBuilderPage() {
  const utils = trpc.useUtils();
  const editorRef = useRef<Editor | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const isSyncingCanvasRef = useRef<boolean>(false);
  const activePageRef = useRef<IndependentSitePage | undefined>(undefined);
  const devicePresetRef = useRef<ResponsiveDevicePresetId>("desktop");
  const saveInFlightRef = useRef<boolean>(false);
  const requestedPageSlugRef = useRef<string | null>(null);
  const lastLoadedProjectSignatureRef = useRef<string | null>(null);

  // Affichage repliable de l’espace "Mes sites & projets" et du guide d’aide utilisateur
  const [showProjectsDrawer, setShowProjectsDrawer] = useState<boolean>(false);
  const [showHelpGuideDrawer, setShowHelpGuideDrawer] = useState<boolean>(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [trainingModalMode, setTrainingModalMode] = useState<TrainingModalMode>("guide");
  const [statusFilter, setStatusFilter] = useState<IndependentSiteStatus | "all">("all");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    return parseBuilderQueryParams(window.location.search).siteId;
  });

  function selectActiveSiteId(nextSiteId: number | null) {
    const normalizedId =
      typeof nextSiteId === "number" && Number.isInteger(nextSiteId) && nextSiteId > 0
        ? nextSiteId
        : null;
    setSelectedSiteId(normalizedId);
    if (typeof window === "undefined") return;
    try {
      if (normalizedId) {
        window.sessionStorage.setItem(
          INDEPENDENT_BUILDER_SELECTED_SITE_STORAGE_KEY,
          String(normalizedId),
        );
      } else {
        window.sessionStorage.removeItem(
          INDEPENDENT_BUILDER_SELECTED_SITE_STORAGE_KEY,
        );
      }
    } catch {
      // Ignorer si sessionStorage est restreint
    }
    try {
      const nextUrl = buildIndependentBuilderSelectionUrl(
        window.location.search,
        normalizedId,
      );
      const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;
      if (currentPathWithSearch !== nextUrl) {
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    } catch {
      // Ignorer si replaceState est indisponible
    }
  }

  // Navigation dans la bibliothèque (7 espaces) + Recherche & Filtres par catégorie
  const [activeLibraryTab, setActiveLibraryTab] = useState<IndependentBuilderLibraryTab>("pages");
  const [librarySearch, setLibrarySearch] = useState("");
  const [blockCategoryFilter, setBlockCategoryFilter] = useState<string>("all");
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>("all");
  const [socleTypeFilter, setSocleTypeFilter] = useState<IndependentSiteType | "all">("all");
  const [templateTypeFilter, setTemplateTypeFilter] = useState<IndependentSiteType | "all">("all");

  // Panneau de droite : Réglages & SEO | Publication & Domaine | Versions & Historique
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTabId>("seo");

  // Responsive : 3 modes principaux + 5 tailles d'écran précises + double écran simultané
  const [viewport, setViewport] = useState<ResponsiveViewportMode>("desktop");
  const [devicePresetId, setDevicePresetId] = useState<ResponsiveDevicePresetId>("desktop");
  const [sideBySidePreview, setSideBySidePreview] = useState(false);

  // Bandeaux d'état, erreurs, confirmations inline & suivi des modifications non enregistrées
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<PendingConfirmAction | null>(
    null
  );
  const [pendingSafetySnapshot, setPendingSafetySnapshot] =
    useState<IndependentBuilderLocalSafetySnapshot | null>(null);

  // Formulaire de création d’un nouveau site indépendant
  const [newSiteTitle, setNewSiteTitle] = useState("Association familiale ATH VAHLOUL");
  const [newSiteType, setNewSiteType] = useState<IndependentSiteType>("familial");
  const [newSiteTemplateId, setNewSiteTemplateId] = useState<string>(ATH_VAHLOUL_DEMO_TEMPLATE_ID);

  // État local d’édition du projet actif
  const [siteTitle, setSiteTitle] = useState("Association familiale ATH VAHLOUL");
  const [siteSlug, setSiteSlug] = useState("association-familiale-ath-vahloul");
  const [siteType, setSiteType] = useState<IndependentSiteType>("familial");
  const [projectMode, setProjectMode] = useState<IndependentProjectMode>("site_vitrine");
  const [siteStatus, setSiteStatus] = useState<IndependentSiteStatus>("draft");
  const [pages, setPages] = useState<IndependentSitePage[]>(() =>
    JSON.parse(JSON.stringify(INDEPENDENT_SITE_TEMPLATES[0].pages))
  );
  const [activePageId, setActivePageId] = useState<string>("page-accueil");
  const [reusableBlocks, setReusableBlocks] = useState<IndependentSiteReusableBlock[]>([]);

  // Formulaire d’ajout de page / sous-menu
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageParentId, setNewPageParentId] = useState<string>("");
  const [newPageSocleId, setNewPageSocleId] = useState<string>("socle-accueil");

  // Studio de transformations d’images
  const [imageTransforms, setImageTransforms] = useState<IndependentImageTransforms>({
    ...DEFAULT_IMAGE_TRANSFORMS,
  });
  const [newMediaLabel, setNewMediaLabel] = useState("");
  const [newMediaAlt, setNewMediaAlt] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Studio de cartes visuelles (Chantier 3 : carrée, rectangulaire, ronde, texte dessus/dessous/intérieur, bouton "+", édition par carte, aperçu immédiat)
  const [cardGridConfig, setCardGridConfig] = useState<VisualCardGridConfig>(() => ({
    sectionEyebrow: "Rubriques personnalisables",
    sectionTitle: "Cartes visuelles du site",
    columns: 3,
    gapPx: 20,
    useCase: "famille",
    shape: "rectangular",
    textPlacement: "bottom",
    showButton: true,
    cards: [
      createDefaultVisualCardItem(1, {
        title: "Histoire & Patrimoine",
        subtitle: "Mémoire",
        description: "Récits, archives photographiques et transmission familiale.",
        imageUrl: VISUAL_CARD_SAMPLE_IMAGES[0].url,
        imageAlt: "Histoire et patrimoine familial",
      }),
      createDefaultVisualCardItem(2, {
        title: "Rencontres & Événements",
        subtitle: "Agenda",
        description: "Assemblées annuelles, ateliers culturels et fêtes intergénérationnelles.",
        imageUrl: VISUAL_CARD_SAMPLE_IMAGES[1].url,
        imageAlt: "Rencontres et événements associatifs",
      }),
      createDefaultVisualCardItem(3, {
        title: "Entraide & Solidarité",
        subtitle: "Collectif",
        description: "Prêt de matériel associatif et soutien mutuel entre membres.",
        imageUrl: VISUAL_CARD_SAMPLE_IMAGES[2].url,
        imageAlt: "Entraide et solidarité",
      }),
    ],
  }));
  const [selectedVisualCardId, setSelectedVisualCardId] = useState<string>("vcard-1");
  const [showVisualCardLivePreview, setShowVisualCardLivePreview] = useState<boolean>(true);

  // Calques de la page active
  const [layers, setLayers] = useState<LayerSummaryItem[]>([]);

  // Domaines personnalisés & Versions
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [versionLabelInput, setVersionLabelInput] = useState("");
  const [reusableBlockNameInput, setReusableBlockNameInput] = useState("");
  const [previewedVersionId, setPreviewedVersionId] = useState<number | null>(null);

  // Phase 2 : Duplication avec demande de nom personnalisable
  const [duplicateProjectCustomTitle, setDuplicateProjectCustomTitle] = useState("");
  const [duplicatePageCustomTitle, setDuplicatePageCustomTitle] = useState("");
  const [duplicateBlockCustomName, setDuplicateBlockCustomName] = useState("");

  // Phase 2 : Recherche & Filtre Médias + Édition/Remplacement média
  const [mediaSearchInput, setMediaSearchInput] = useState("");
  const [mediaMimeFilter, setMediaMimeFilter] = useState("all");
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [editMediaLabel, setEditMediaLabel] = useState("");
  const [editMediaAlt, setEditMediaAlt] = useState("");
  const [editMediaNewUrl, setEditMediaNewUrl] = useState("");

  // Phase 2 : Import / Export JSON contrôlé
  const [exportedJsonText, setExportedJsonText] = useState<string | null>(null);
  const [importJsonRawInput, setImportJsonRawInput] = useState("");
  const [importCustomTitleInput, setImportCustomTitleInput] = useState("");

  // Phase 2 : Collaboration contrôlée (Partage d'aperçu privé en lecture seule)
  const [collabLabelInput, setCollabLabelInput] = useState("");
  const [collabEmailInput, setCollabEmailInput] = useState("");
  const [collabExpiresHours, setCollabExpiresHours] = useState<number>(72);

  // Restauration du contexte de projet et de page lors du retour depuis la prévisualisation (?siteId=&page=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseBuilderQueryParams(window.location.search);
    if (parsed.siteId) {
      selectActiveSiteId(parsed.siteId);
    }
    if (parsed.pageSlug) {
      requestedPageSlugRef.current = parsed.pageSlug;
    }
  }, []);

  // Avertissement navigateur si l'utilisateur quitte avec des modifications non enregistrées ou pendant une sauvegarde
  useEffect(() => {
    if (!hasUnsavedChanges && !saveInFlightRef.current) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Filet de sécurité local temporaire (uniquement lorsqu'il y a des modifications non enregistrées)
  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") return;
    try {
      const storageKey = buildLocalSafetyStorageKey(selectedSiteId, siteSlug);
      const snapshot = createLocalSafetySnapshot({
        siteId: selectedSiteId,
        slug: siteSlug,
        title: siteTitle,
        siteType,
        projectMode,
        pages,
        reusableBlocks,
        activePageId,
      });
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Ignorer silencieusement si localStorage est indisponible ou contient un secret rejeté
    }
  }, [
    hasUnsavedChanges,
    selectedSiteId,
    siteSlug,
    siteTitle,
    siteType,
    projectMode,
    pages,
    reusableBlocks,
    activePageId,
  ]);

  function clearLocalSafetySnapshotForProject(siteId: number | null, slug?: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(buildLocalSafetyStorageKey(siteId, slug));
    } catch {
      // Ignorer si localStorage est restreint
    }
    setPendingSafetySnapshot(null);
  }

  function readLocalSafetySnapshotForProject(
    siteId: number | null,
    slug?: string
  ): IndependentBuilderLocalSafetySnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(buildLocalSafetyStorageKey(siteId, slug));
      if (!raw) return null;
      return JSON.parse(raw) as IndependentBuilderLocalSafetySnapshot;
    } catch {
      return null;
    }
  }

  // Filtrage déterministe des 7 espaces de la bibliothèque
  const filteredBlocks = useMemo(
    () =>
      filterIndependentBlocks({
        search: librarySearch,
        category: blockCategoryFilter as any,
      }),
    [librarySearch, blockCategoryFilter]
  );

  const filteredModules = useMemo(
    () =>
      filterIndependentModules({
        search: librarySearch,
        category: moduleCategoryFilter as any,
      }),
    [librarySearch, moduleCategoryFilter]
  );

  const filteredSocles = useMemo(
    () =>
      filterIndependentSocles({
        search: librarySearch,
        siteType: socleTypeFilter,
      }),
    [librarySearch, socleTypeFilter]
  );

  const filteredTemplates = useMemo(
    () =>
      filterIndependentTemplates({
        search: librarySearch,
        siteType: templateTypeFilter,
      }),
    [librarySearch, templateTypeFilter]
  );

  // Carte visuelle actuellement sélectionnée dans l'Atelier Cartes Visuelles
  const activeVisualCard = useMemo(() => {
    return (
      cardGridConfig.cards.find((c) => c.id === selectedVisualCardId) ??
      cardGridConfig.cards[0] ??
      null
    );
  }, [cardGridConfig.cards, selectedVisualCardId]);

  // Queries & Mutations tRPC
  const projectsQuery = trpc.independentSiteBuilder.listProjects.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter },
    { retry: false, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    const accessibleProjects = projectsQuery.data;
    if (!accessibleProjects) return;
    if (statusFilter !== "all" && selectedSiteId !== null) return;

    const search = typeof window !== "undefined" ? window.location.search : "";
    const parsed = parseBuilderQueryParams(search);
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const requestedSlug = params.get("siteSlug")?.trim() || parsed.slug || null;

    const resolvedSiteId = resolveInitialIndependentSiteId({
      projects: accessibleProjects,
      currentSiteId: selectedSiteId,
      requestedSiteId: parsed.siteId,
      requestedSlug,
      storedSiteId: readStoredSelectedSiteId(),
      preferredSlug: siteSlug,
    });

    if (resolvedSiteId === null) {
      if (statusFilter === "all" && selectedSiteId !== null) {
        selectActiveSiteId(null);
      }
      return;
    }

    if (resolvedSiteId !== selectedSiteId) {
      selectActiveSiteId(resolvedSiteId);
    }

    const matchedProject = accessibleProjects.find((p) => p.id === resolvedSiteId);
    if (matchedProject) {
      const signature = `${matchedProject.id}:${matchedProject.updatedAt ?? ""}`;
      if (lastLoadedProjectSignatureRef.current !== signature) {
        loadProjectIntoWorkspace(matchedProject);
        setHasUnsavedChanges(false);
      }
    }
  }, [projectsQuery.data, selectedSiteId, statusFilter]);
  const activeProjectQuery = trpc.independentSiteBuilder.getProject.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );
  const accessRoleQuery = trpc.independentSiteBuilder.getAccessRole.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false },
  );
  const accessRole = accessRoleQuery.data?.role ?? "editor";
  const canAdministerSite = accessRole === "admin" || accessRole === "owner";
  const canManageAccess = accessRole === "owner";
  const canManageDomains = accessRole === "owner";

  const versionsQuery = trpc.independentSiteBuilder.listVersions.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId) && canAdministerSite, retry: false, refetchOnWindowFocus: false }
  );

  const mediaQuery = trpc.independentSiteBuilder.listMedia.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );

  const domainsQuery = trpc.independentSiteBuilder.listDomains.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId) && canManageDomains, retry: false, refetchOnWindowFocus: false }
  );

  const currentRolePresentation = useMemo(
    () => getIndependentSiteRolePresentation(accessRole),
    [accessRole]
  );

  const publicationLogsQuery = trpc.independentSiteBuilder.listPublicationLogs.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId) && canAdministerSite, retry: false, refetchOnWindowFocus: false }
  );

  const [accessEmailInput, setAccessEmailInput] = useState("");
  const [accessRoleInput, setAccessRoleInput] = useState<"admin" | "editor">("editor");
  const [accessExpiresHours, setAccessExpiresHours] = useState<number>(72);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [lastCreatedInvitation, setLastCreatedInvitation] = useState<{
    email: string;
    role: "admin" | "editor";
    expiresAtIso: string;
    invitationPath: string;
    invitationDelivery: "not_configured" | "delivered" | "failed";
    siteTitle: string;
  } | null>(null);

  const accessQuery = trpc.independentSiteBuilder.listAccess.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId) && canManageAccess, retry: false, refetchOnWindowFocus: false }
  );
  const inviteAccessMutation = trpc.independentSiteBuilder.inviteAccess.useMutation({
    onSuccess: (created) => {
      void accessQuery.refetch();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const path =
        created.invitationPath ||
        (created.developmentOnlyToken
          ? `/constructeur-sites/invitation/${encodeURIComponent(created.developmentOnlyToken)}`
          : "/connexion-administration");
      const fullLink = `${origin}${path}`;
      const expiresAtIso =
        typeof created.expiresAt === "string"
          ? created.expiresAt
          : created.invitationExpiresAt || new Date(Date.now() + accessExpiresHours * 3600000).toISOString();
      setLastCreatedInvitation({
        email: created.email,
        role: created.role === "admin" ? "admin" : "editor",
        expiresAtIso,
        invitationPath: fullLink,
        invitationDelivery: created.invitationDelivery,
        siteTitle: created.siteTitle || siteTitle,
      });
      setCopiedInviteLink(false);
      setAccessEmailInput("");
      setErrorBanner(null);
      setStatusBanner(
        created.invitationDelivery === "delivered"
          ? `Invitation envoyée à ${created.email} (${created.role === "admin" ? "Administrateur" : "Éditeur"}). Vous pouvez également copier le lien d’activation ci-dessous.`
          : `Invitation à usage unique prête pour ${created.email} (${created.role === "admin" ? "Administrateur" : "Éditeur"}). Copiez et transmettez le lien d’activation ci-dessous.`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de créer l’invitation pour ce membre.");
    },
  });
  const revokeAccessMutation = trpc.independentSiteBuilder.revokeAccess.useMutation({
    onSuccess: () => {
      void accessQuery.refetch();
      setStatusBanner("Accès révoqué. Le lien d’invitation et les droits associés sont désormais bloqués.");
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de révoquer cet accès.");
    },
  });
  const updateAccessRoleMutation = trpc.independentSiteBuilder.updateAccessRole.useMutation({
    onSuccess: () => {
      void accessQuery.refetch();
      setStatusBanner("Rôle du membre mis à jour.");
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de modifier le rôle de ce membre.");
    },
  });
  const collaboratorSharesQuery = trpc.independentSiteBuilder.listCollaboratorShares.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId) && canAdministerSite, retry: false, refetchOnWindowFocus: false }
  );

  const createProjectMutation = trpc.independentSiteBuilder.createProject.useMutation({
    onSuccess: async (created) => {
      saveInFlightRef.current = false;
      await utils.independentSiteBuilder.listProjects.invalidate();
      clearLocalSafetySnapshotForProject(null, siteSlug);
      clearLocalSafetySnapshotForProject(created.id, created.slug);
      selectActiveSiteId(created.id);
      loadProjectIntoWorkspace(created);
      setHasUnsavedChanges(false);
      setLastSavedAt(
        new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setErrorBanner(null);
      setStatusBanner(`Site « ${created.title} » créé et sauvegardé dans votre espace.`);
    },
    onError: (err) => {
      saveInFlightRef.current = false;
      setErrorBanner(formatIndependentBuilderErrorMessage(err));
    },
  });

  const ensureAthVahloulMutation = trpc.independentSiteBuilder.ensureAthVahloulDemo.useMutation({
    onSuccess: async (demo) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      selectActiveSiteId(demo.id);
      loadProjectIntoWorkspace(demo);
      setHasUnsavedChanges(false);
      setLastSavedAt(
        new Date(demo.updatedAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setErrorBanner(null);
      setStatusBanner(
        "Modèle complet « Association familiale ATH VAHLOUL » chargé avec ses 6 pages associatives et familiales (100 % sans boutique)."
      );
    },
    onError: (err) => {
      setErrorBanner(formatIndependentBuilderErrorMessage(err));
    },
  });

  const saveProjectMutation = trpc.independentSiteBuilder.saveProject.useMutation({
    onSuccess: async (saved) => {
      saveInFlightRef.current = false;
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: saved.id });
      clearLocalSafetySnapshotForProject(saved.id, saved.slug);
      setSiteStatus(saved.status);
      setHasUnsavedChanges(false);
      const formattedNow = new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastSavedAt(formattedNow);
      setErrorBanner(null);
      setStatusBanner(
        `Sauvegarde confirmée (${formattedNow}) : toutes les modifications de « ${saved.title} » sont enregistrées.`
      );
    },
    onError: (err) => {
      saveInFlightRef.current = false;
      setErrorBanner(formatIndependentBuilderErrorMessage(err));
    },
  });

  const repairKnownInternalLinksMutation = trpc.independentSiteBuilder.repairKnownInternalLinks.useMutation({
    onSuccess: async ({ project, changes }) => {
      utils.independentSiteBuilder.getProject.setData({ siteId: project.id }, project);
      await Promise.all([
        utils.independentSiteBuilder.listProjects.invalidate(),
        utils.independentSiteBuilder.getProject.invalidate({ siteId: project.id }),
        utils.independentSiteBuilder.listVersions.invalidate({ siteId: project.id }),
      ]);
      loadProjectIntoWorkspace(project);
      setHasUnsavedChanges(false);
      setErrorBanner(null);
      const remainingReport = verifyIndependentInternalLinks(project.pages);
      const remainingCount = remainingReport.brokenLinks.length;
      setStatusBanner(
        changes.length > 0
          ? remainingCount > 0
            ? `${changes.length} lien(s) connu(s) réparé(s) et sauvegardé(s) sur « ${project.title} ». ${remainingCount} lien(s) inconnu(s) restant(s) à vérifier manuellement.`
            : `${changes.length} lien(s) connu(s) réparé(s) et sauvegardé(s) sur « ${project.title} ». Tous les liens internes sont désormais valides.`
          : remainingCount > 0
            ? `Aucun alias connu à réparer. ${remainingCount} lien(s) inconnu(s) nécessitent une vérification manuelle.`
            : "Aucun lien cassé détecté : tous les liens internes sont déjà valides.",
      );
    },
    onError: (err) => {
      setErrorBanner(formatIndependentBuilderErrorMessage(err));
    },
  });

  const handleRepairKnownInternalLinks = () => {
    const resolvedSiteId =
      selectedSiteId ??
      activeProjectQuery.data?.id ??
      (projectsQuery.data
        ? resolveInitialIndependentSiteId({
            projects: projectsQuery.data,
            currentSiteId: selectedSiteId,
            storedSiteId: readStoredSelectedSiteId(),
            preferredSlug: siteSlug,
          })
        : null);

    if (!resolvedSiteId) {
      setErrorBanner("Aucun site n’est sélectionné pour la réparation des liens.");
      return;
    }
    if (resolvedSiteId !== selectedSiteId) {
      selectActiveSiteId(resolvedSiteId);
    }
    if (repairKnownInternalLinksMutation.isPending) return;
    repairKnownInternalLinksMutation.mutate({ siteId: resolvedSiteId });
  };

  const duplicateProjectMutation = trpc.independentSiteBuilder.duplicateProject.useMutation({
    onSuccess: async (copy) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      selectActiveSiteId(copy.id);
      loadProjectIntoWorkspace(copy);
      setDuplicateProjectCustomTitle("");
      setHasUnsavedChanges(false);
      setErrorBanner(null);
      setStatusBanner(`Site dupliqué sous le nom « ${copy.title} » (slug unique : /${copy.slug}).`);
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de dupliquer ce projet.");
    },
  });

  const publishSiteMutation = trpc.independentSiteBuilder.publishSite.useMutation({
    onSuccess: async (published) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: published.id });
      await utils.independentSiteBuilder.listPublicationLogs.invalidate({ siteId: published.id });
      setSiteStatus(published.status);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      setErrorBanner(null);
      setStatusBanner(
        `Site « ${published.title} » publié ! Il est désormais accessible sur /sites/${published.slug} et en aperçu sur /constructeur-sites/apercu/${published.slug}.`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Échec de la publication du site.");
    },
  });

  const unpublishSiteMutation = trpc.independentSiteBuilder.unpublishSite.useMutation({
    onSuccess: async (unpublished) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: unpublished.id });
      await utils.independentSiteBuilder.listPublicationLogs.invalidate({ siteId: unpublished.id });
      setSiteStatus(unpublished.status);
      setErrorBanner(null);
      setStatusBanner(
        `Site « ${unpublished.title} » dépublié et repassé en brouillon privé (invisible sur /sites/${unpublished.slug}).`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Échec de la dépublication du site.");
    },
  });

  const updateStatusMutation = trpc.independentSiteBuilder.updateStatus.useMutation({
    onSuccess: async (updated) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      setSiteStatus(updated.status);
      setErrorBanner(null);
      setStatusBanner(
        `Statut du site mis à jour : ${
          updated.status === "published"
            ? "Publié"
            : updated.status === "archived"
              ? "Archivé"
              : "Brouillon"
        }.`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de changer le statut du site.");
    },
  });

  const createVersionMutation = trpc.independentSiteBuilder.createVersion.useMutation({
    onSuccess: async (ver) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listVersions.invalidate({ siteId: selectedSiteId });
      }
      setVersionLabelInput("");
      setErrorBanner(null);
      setStatusBanner(`Point de sauvegarde v${ver.versionNumber} (« ${ver.label} ») créé.`);
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de créer la version.");
    },
  });

  const restoreVersionMutation = trpc.independentSiteBuilder.restoreVersion.useMutation({
    onSuccess: async (restored) => {
      loadProjectIntoWorkspace(restored);
      setHasUnsavedChanges(false);
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listVersions.invalidate({ siteId: selectedSiteId });
        await utils.independentSiteBuilder.listPublicationLogs.invalidate({ siteId: selectedSiteId });
      }
      setErrorBanner(null);
      setStatusBanner(`Version restaurée avec succès pour « ${restored.title} ».`);
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de restaurer cette version.");
    },
  });

  const addMediaMutation = trpc.independentSiteBuilder.addMedia.useMutation({
    onSuccess: async () => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listMedia.invalidate({ siteId: selectedSiteId });
      }
      setNewMediaLabel("");
      setNewMediaAlt("");
      setNewMediaUrl("");
      setErrorBanner(null);
      setStatusBanner("Image enregistrée dans la médiathèque du projet.");
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible d’ajouter ce média.");
    },
  });

  const updateMediaMetadataMutation = trpc.independentSiteBuilder.updateMediaMetadata.useMutation({
    onSuccess: async (result) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listMedia.invalidate({ siteId: selectedSiteId });
        await utils.independentSiteBuilder.getProject.invalidate({ siteId: selectedSiteId });
      }
      setEditingMediaId(null);
      setErrorBanner(null);
      setStatusBanner(
        result.replacedOccurrencesCount > 0
          ? `Média « ${result.media.label} » mis à jour et remplacé dans ${result.replacedOccurrencesCount} emplacement(s) de page sans casser les références.`
          : `Média « ${result.media.label} » renommé / mis à jour.`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de modifier ce média.");
    },
  });

  const deleteMediaMutation = trpc.independentSiteBuilder.deleteMedia.useMutation({
    onSuccess: async () => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listMedia.invalidate({ siteId: selectedSiteId });
      }
      setErrorBanner(null);
      setStatusBanner("Média supprimé de la bibliothèque du projet.");
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de supprimer ce média.");
    },
  });

  const importProjectJsonMutation = trpc.independentSiteBuilder.importProjectJson.useMutation({
    onSuccess: async (importedProject) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: importedProject.id });
      await utils.independentSiteBuilder.listPublicationLogs.invalidate({
        siteId: importedProject.id,
      });
      selectActiveSiteId(importedProject.id);
      loadProjectIntoWorkspace(importedProject);
      setImportJsonRawInput("");
      setImportCustomTitleInput("");
      setHasUnsavedChanges(false);
      setErrorBanner(null);
      setStatusBanner(
        `Import JSON validé et appliqué sur « ${importedProject.title} » (${importedProject.pages.length} page(s)).`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Import JSON refusé.");
    },
  });

  const createCollaboratorShareMutation =
    trpc.independentSiteBuilder.createCollaboratorShare.useMutation({
      onSuccess: async (share) => {
        if (selectedSiteId) {
          await utils.independentSiteBuilder.listCollaboratorShares.invalidate({
            siteId: selectedSiteId,
          });
        }
        setCollabLabelInput("");
        setCollabEmailInput("");
        setErrorBanner(null);
        setStatusBanner(
          `Lien d’aperçu privé en lecture seule créé pour « ${share.collaboratorLabel} » (expire le ${new Date(share.expiresAt).toLocaleString("fr-FR")}).`
        );
      },
      onError: (err) => {
        setErrorBanner(err.message || "Impossible de créer le lien d’aperçu collaborateur.");
      },
    });

  const revokeCollaboratorShareMutation =
    trpc.independentSiteBuilder.revokeCollaboratorShare.useMutation({
      onSuccess: async (revoked) => {
        if (selectedSiteId) {
          await utils.independentSiteBuilder.listCollaboratorShares.invalidate({
            siteId: selectedSiteId,
          });
        }
        setErrorBanner(null);
        setStatusBanner(
          `Accès d’aperçu privé révoqué immédiatement pour « ${revoked.collaboratorLabel} ».`
        );
      },
      onError: (err) => {
        setErrorBanner(err.message || "Impossible de révoquer ce partage.");
      },
    });

  const addDomainMutation = trpc.independentSiteBuilder.addDomain.useMutation({
    onSuccess: async (dom) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setCustomDomainInput("");
      setErrorBanner(null);
      setStatusBanner(
        `Domaine ${dom.hostname} rattaché (statut : En attente de DNS TXT). Ajoutez l’enregistrement TXT indiqué chez votre hébergeur DNS.`
      );
    },
    onError: (err) => {
      setErrorBanner(err.message || "Nom de domaine personnalisé invalide.");
    },
  });

  const verifyDomainMutation = trpc.independentSiteBuilder.verifyDomain.useMutation({
    onSuccess: async (dom) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setErrorBanner(null);
      setStatusBanner(
        `Preuve DNS TXT validée pour ${dom.hostname}. Le domaine est marqué comme Vérifié.`
      );
    },
    onError: (err) => {
      setErrorBanner(
        err.message ||
          "L’enregistrement DNS TXT n’a pas encore été détecté. Vérifiez la propagation DNS avant de réessayer."
      );
    },
  });

  const removeDomainMutation = trpc.independentSiteBuilder.removeDomain.useMutation({
    onSuccess: async () => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setErrorBanner(null);
      setStatusBanner("Domaine personnalisé retiré du projet.");
    },
    onError: (err) => {
      setErrorBanner(err.message || "Impossible de retirer ce domaine.");
    },
  });

  function loadProjectIntoWorkspace(project: {
    id: number;
    title: string;
    slug: string;
    siteType: IndependentSiteType;
    status: IndependentSiteStatus;
    pages: IndependentSitePage[];
    reusableBlocks: IndependentSiteReusableBlock[];
    updatedAt?: string | null;
  }) {
    selectActiveSiteId(project.id);
    lastLoadedProjectSignatureRef.current = `${project.id}:${project.updatedAt ?? ""}`;
    setSiteTitle(project.title);
    setSiteSlug(project.slug);
    setSiteType(project.siteType);
    setSiteStatus(project.status);
    const nextPages = ensureNonEmptyIndependentPages(project.pages, project.title);
    setPages(nextPages);
    const requestedSlug = requestedPageSlugRef.current;
    const matchedRequestedPage = requestedSlug
      ? nextPages.find((p) => p.slug === requestedSlug)
      : null;
    const targetPage = matchedRequestedPage ?? nextPages[0];
    setActivePageId(targetPage.id);
    requestedPageSlugRef.current = null;
    setReusableBlocks(project.reusableBlocks || []);
    if (project.updatedAt) {
      setLastSavedAt(
        new Date(project.updatedAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    if (editorRef.current && targetPage) {
      syncCanvasPage(editorRef.current, targetPage);
      refreshLayersFromEditor(editorRef.current);
    }

    // Vérifier s'il existe un filet de sécurité local non sauvegardé pour ce projet
    // (ne jamais remplacer automatiquement ni silencieusement un projet sauvegardé)
    const candidateSafety = readLocalSafetySnapshotForProject(project.id, project.slug);
    if (shouldOfferLocalSafetyRestore(candidateSafety, project)) {
      setPendingSafetySnapshot(candidateSafety);
    } else {
      setPendingSafetySnapshot(null);
    }
  }

  function stripResponsiveBaseCss(rawCss: string): string {
    const trimmed = (rawCss || "").trim();
    if (!trimmed) return "";
    return trimmed
      .replace(INDEPENDENT_RESPONSIVE_BASE_CSS, "")
      .replace(INDEPENDENT_RESPONSIVE_BASE_CSS.trim(), "")
      .trim();
  }

  function applyCanvasBaseStyleSheet(editor: Editor) {
    try {
      const canvasDocument = editor.Canvas.getDocument();
      if (canvasDocument?.head) {
        let styleElement = canvasDocument.head.querySelector<HTMLStyleElement>(
          "style[data-independent-canvas-style]",
        );
        if (!styleElement) {
          styleElement = canvasDocument.createElement("style");
          styleElement.dataset.independentCanvasStyle = "true";
          canvasDocument.head.appendChild(styleElement);
        }
        styleElement.textContent = INDEPENDENT_RESPONSIVE_BASE_CSS;
      }
    } catch {
      // The canvas:load handler retries after the iframe is ready.
    }
  }

  function syncCanvasDeviceAndZoom(editor: Editor | null, presetId: ResponsiveDevicePresetId) {
    if (!editor) return;
    const preset =
      RESPONSIVE_DEVICE_PRESETS.find((p) => p.id === presetId) ?? RESPONSIVE_DEVICE_PRESETS[0];
    const targetFrameWidth = `${preset.maxWidthPx}px`;
    try {
      const device = editor.DeviceManager?.get?.(preset.id);
      if (device && device.get("width") !== targetFrameWidth) {
        device.set({ width: targetFrameWidth, widthMedia: targetFrameWidth });
      }
      if (editor.getDevice() !== preset.id) {
        editor.setDevice(preset.id);
      }
      const frame = editor.Canvas?.getFrame?.();
      if (frame && frame.get("width") !== targetFrameWidth) {
        frame.set({ width: targetFrameWidth }, { noUndo: 1 });
      }
      const frameWrapper = canvasHostRef.current?.querySelector<HTMLElement>(".gjs-frame-wrapper");
      if (frameWrapper && frameWrapper.style.width !== targetFrameWidth) {
        frameWrapper.style.width = targetFrameWidth;
      }
    } catch {
      // DeviceManager or Canvas may not be initialized yet
    }
    try {
      const canvasEl = canvasHostRef.current?.querySelector<HTMLElement>(".gjs-cv-canvas");
      const fallbackWidth = (canvasHostRef.current?.clientWidth || 0) * 0.84;
      const availableWidth = canvasEl?.clientWidth || fallbackWidth;
      if (availableWidth > 0 && preset.maxWidthPx > availableWidth) {
        const fittedZoom = Math.max(
          40,
          Math.floor(((availableWidth - 20) / preset.maxWidthPx) * 100),
        );
        editor.Canvas.setZoom(fittedZoom);
      } else {
        editor.Canvas.setZoom(100);
      }
    } catch {
      // Canvas zoom may throw before mount completes
    }
  }

  function syncCanvasPage(editor: Editor, page: IndependentSitePage) {
    const cleanCss = stripResponsiveBaseCss(sanitizeIndependentCss(page.css || ""));
    const cleanHtml = sanitizeIndependentHtml(page.html || "");

    isSyncingCanvasRef.current = true;
    try {
      // Ordre critique : setStyle AVANT setComponents pour préserver les styles inline
      // et éviter que setStyle() ne vide les règles générées dans CssComposer.
      editor.setStyle(cleanCss);
      editor.setComponents(cleanHtml);
    } finally {
      isSyncingCanvasRef.current = false;
    }

    // Injecter la feuille responsive/structurelle dans <head> de l'iframe uniquement
    // afin qu'elle ne pollue jamais page.css lors des sauvegardes.
    applyCanvasBaseStyleSheet(editor);
  }

  function requestRestoreLocalSafetySnapshot() {
    if (!pendingSafetySnapshot) return;
    const snap = pendingSafetySnapshot;
    setPendingConfirmAction({
      title: `Restaurer le brouillon local de secours pour « ${snap.title} » ?`,
      description: `Ce filet de sécurité local a été enregistré le ${new Date(snap.savedAtIso).toLocaleString("fr-FR")} (${snap.pages.length} page(s)). Il remplacera l’état affiché dans l’éditeur sans écraser votre sauvegarde serveur tant que vous ne cliquez pas sur « Enregistrer ».`,
      confirmLabel: "Restaurer ce brouillon local",
      variant: "primary",
      onConfirm: () => {
        const restoredPages = ensureNonEmptyIndependentPages(snap.pages, snap.title);
        setSiteTitle(snap.title);
        setSiteType(snap.siteType);
        setProjectMode(snap.projectMode);
        setPages(restoredPages);
        const restoredActive =
          restoredPages.find((p) => p.id === snap.activePageId) ?? restoredPages[0];
        setActivePageId(restoredActive.id);
        setReusableBlocks(snap.reusableBlocks || []);
        setHasUnsavedChanges(true);
        setPendingSafetySnapshot(null);
        if (editorRef.current && restoredActive) {
          syncCanvasPage(editorRef.current, restoredActive);
          refreshLayersFromEditor(editorRef.current);
        }
        setStatusBanner(
          `Filet de sécurité local restauré pour « ${snap.title} ». Vérifiez vos pages puis cliquez sur « Enregistrer » pour valider.`
        );
      },
    });
  }

  function requestSwitchProjectWithGuard(actionLabel: string, onProceed: () => void) {
    if (!hasUnsavedChanges) {
      onProceed();
      return;
    }
    setPendingConfirmAction({
      title: "Des modifications non enregistrées sont en cours",
      description: `Vous avez des modifications non sauvegardées sur « ${siteTitle} ». Voulez-vous vraiment ${actionLabel} sans enregistrer d’abord ?`,
      confirmLabel: "Continuer sans enregistrer",
      variant: "danger",
      onConfirm: onProceed,
    });
  }

  useEffect(() => {
    const project = activeProjectQuery.data;
    if (!project) return;
    const signature = `${project.id}:${project.updatedAt ?? ""}`;
    if (lastLoadedProjectSignatureRef.current === signature) return;
    loadProjectIntoWorkspace(project);
    setHasUnsavedChanges(false);
  }, [activeProjectQuery.data]);

  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activePageId) ?? pages[0];
  }, [pages, activePageId]);

  activePageRef.current = activePage;
  devicePresetRef.current = devicePresetId;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activePage) return;
    syncCanvasPage(editor, activePage);
    refreshLayersFromEditor(editor);
  }, [activePage?.id, activePage?.html, activePage?.css]);

  useEffect(() => {
    syncCanvasDeviceAndZoom(editorRef.current, devicePresetId);
  }, [devicePresetId]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      syncCanvasDeviceAndZoom(editorRef.current, devicePresetRef.current);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const navigationTree = useMemo(() => buildNavigationFromPages(pages), [pages]);

  const activePageImages = useMemo(
    () => extractImagesFromPageHtml(activePage?.html || ""),
    [activePage?.html]
  );

  const seoPreview = useMemo(() => {
    if (!activePage) return null;
    return buildPageSeoPreview(activePage, siteSlug);
  }, [activePage, siteSlug]);

  const activePageSeoAudit = useMemo(() => {
    if (!activePage) return null;
    return auditIndependentPageSeo(activePage, siteSlug);
  }, [activePage, siteSlug]);

  const internalLinkCheck = useMemo(
    () => verifyIndependentInternalLinks(pages),
    [pages]
  );

  const qualityReport = useMemo(
    () =>
      evaluateIndependentSiteQualityAndChecklist({
        title: siteTitle,
        slug: siteSlug,
        siteType,
        projectMode,
        status: siteStatus,
        templateId: activeProjectQuery.data?.templateId ?? newSiteTemplateId,
        theme: activeProjectQuery.data?.theme ?? INDEPENDENT_SITE_TEMPLATES[0].theme,
        navigation: navigationTree,
        pages,
        mediaItems: mediaQuery.data ?? [],
      }),
    [
      siteTitle,
      siteSlug,
      siteType,
      projectMode,
      siteStatus,
      activeProjectQuery.data?.templateId,
      activeProjectQuery.data?.theme,
      newSiteTemplateId,
      navigationTree,
      pages,
      mediaQuery.data?.length,
    ]
  );

  const filteredMediaItems = useMemo(
    () =>
      filterIndependentMediaItems(mediaQuery.data ?? [], {
        search: mediaSearchInput,
        mimeTypeFilter: mediaMimeFilter,
      }),
    [mediaQuery.data, mediaSearchInput, mediaMimeFilter]
  );

  const importValidationPreview = useMemo(() => {
    if (!importJsonRawInput.trim()) return null;
    return validateAndSanitizeIndependentSiteImport(importJsonRawInput);
  }, [importJsonRawInput]);

  function syncCurrentEditorToPageState(): IndependentSitePage[] {
    const editor = editorRef.current;
    if (!editor || !activePage) return pages;
    const html = editor.getHtml();
    const rawCss = stripResponsiveBaseCss(editor.getCss() || "");
    const css = rawCss || stripResponsiveBaseCss(activePage.css || "");
    const next = pages.map((p) => (p.id === activePage.id ? { ...p, html, css } : p));
    setPages(next);
    return next;
  }

  function updateActivePageFields(patch: Partial<IndependentSitePage>) {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((page) => (page.id === activePage.id ? { ...page, ...patch } : page))
    );
    setHasUnsavedChanges(true);
  }

  function handleUpdateImageAltOnActivePage(imageIndex: number, newAlt: string) {
    if (!activePage) return;
    const synced = syncCurrentEditorToPageState();
    const current = synced.find((p) => p.id === activePage.id) ?? activePage;
    const updatedHtml = updateImageAltInPageHtml(current.html, imageIndex, newAlt);
    const next = synced.map((p) => (p.id === activePage.id ? { ...p, html: updatedHtml } : p));
    setPages(next);
    setHasUnsavedChanges(true);
    if (editorRef.current) {
      syncCanvasPage(editorRef.current, { ...current, html: updatedHtml });
    }
    setStatusBanner(`Texte alternatif de l’image #${imageIndex + 1} mis à jour.`);
  }

  function handleSelectPage(pageId: string) {
    const updatedPages = syncCurrentEditorToPageState();
    const target = updatedPages.find((p) => p.id === pageId);
    setActivePageId(pageId);
    if (editorRef.current && target) {
      syncCanvasPage(editorRef.current, target);
      refreshLayersFromEditor(editorRef.current);
    }
  }

  function insertHtmlIntoCanvas(html: string, label: string) {
    const editor = editorRef.current;
    if (editor) {
      editor.addComponents(html);
      syncCurrentEditorToPageState();
      refreshLayersFromEditor(editor);
      setHasUnsavedChanges(true);
      setStatusBanner(`« ${label} » ajouté dans la page « ${activePage?.title || "Accueil"} ».`);
    } else if (activePage) {
      const next = pages.map((p) =>
        p.id === activePage.id ? { ...p, html: `${p.html}\n${html}` } : p
      );
      setPages(next);
      setHasUnsavedChanges(true);
      setStatusBanner(`« ${label} » ajouté à la page « ${activePage.title} ».`);
    }
  }

  function executeApplySocleToCurrentPage(socleId: string) {
    const socle = INDEPENDENT_PAGE_SOCLES.find((s) => s.id === socleId);
    if (!socle || !activePage) return;
    if (editorRef.current) {
      syncCanvasPage(editorRef.current, { ...activePage, html: socle.html });
      refreshLayersFromEditor(editorRef.current);
    }
    const next = pages.map((p) =>
      p.id === activePage.id
        ? {
            ...p,
            html: socle.html,
            seoDescription: p.seoDescription || socle.description,
          }
        : p
    );
    setPages(next);
    setHasUnsavedChanges(true);
    setStatusBanner(`Socle « ${socle.label} » appliqué à la page « ${activePage.title} ».`);
  }

  function requestApplySocleToCurrentPage(socleId: string) {
    const socle = INDEPENDENT_PAGE_SOCLES.find((s) => s.id === socleId);
    if (!socle || !activePage) return;
    setPendingConfirmAction({
      title: `Remplacer la structure de la page « ${activePage.title} » ?`,
      description: `Le socle « ${socle.label} » remplacera le contenu visuel actuel de la page « ${activePage.title} ». Les autres pages du site ne seront pas modifiées.`,
      confirmLabel: "Appliquer ce socle",
      variant: "primary",
      onConfirm: () => executeApplySocleToCurrentPage(socleId),
    });
  }

  function executeApplyTemplateToSite(templateId: string) {
    const tpl = INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const clonedPages: IndependentSitePage[] = JSON.parse(JSON.stringify(tpl.pages));
    setSiteTitle(tpl.name);
    setSiteType(tpl.siteType);
    setPages(clonedPages);
    setActivePageId(clonedPages[0].id);
    setHasUnsavedChanges(true);
    if (editorRef.current && clonedPages[0]) {
      syncCanvasPage(editorRef.current, clonedPages[0]);
      refreshLayersFromEditor(editorRef.current);
    }
    setStatusBanner(
      `Modèle complet « ${tpl.name} » (${clonedPages.length} pages avec menus et sous-menus) chargé dans l’éditeur. Pensez à cliquer sur « Enregistrer » pour sauvegarder.`
    );
  }

  function requestApplyTemplateToSite(templateId: string) {
    const tpl = INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setPendingConfirmAction({
      title: `Charger le modèle complet « ${tpl.name} » ?`,
      description: `Ce modèle remplace les pages actuelles de l’éditeur par les ${tpl.pages.length} pages pré-construites du modèle « ${tpl.name} ».`,
      confirmLabel: "Charger ce modèle complet",
      variant: "primary",
      onConfirm: () => executeApplyTemplateToSite(templateId),
    });
  }

  function handleAddPage() {
    if (!newPageTitle.trim()) {
      setErrorBanner("Veuillez saisir un titre pour la nouvelle page.");
      return;
    }
    const socle =
      INDEPENDENT_PAGE_SOCLES.find((s) => s.id === newPageSocleId) ?? INDEPENDENT_PAGE_SOCLES[0];
    const slug = normalizeIndependentPageSlug(newPageSlug || newPageTitle);
    const id = `page-${Date.now().toString(36)}`;
    const createdPage: IndependentSitePage = {
      id,
      title: newPageTitle.trim(),
      slug,
      parentPageId: newPageParentId || null,
      showInMenu: true,
      menuOrder: pages.length + 1,
      visibility: "public",
      seoTitle: `${newPageTitle.trim()} | ${siteTitle}`,
      seoDescription: socle.description,
      indexable: true,
      html: socle.html,
      css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
    };
    const next = [...syncCurrentEditorToPageState(), createdPage];
    setPages(next);
    setActivePageId(id);
    setHasUnsavedChanges(true);
    if (editorRef.current) {
      syncCanvasPage(editorRef.current, createdPage);
      refreshLayersFromEditor(editorRef.current);
    }
    setNewPageTitle("");
    setNewPageSlug("");
    setNewPageParentId("");
    setErrorBanner(null);
    setStatusBanner(`Page « ${createdPage.title} » (${createdPage.slug}) ajoutée au site.`);
  }

  function handleDuplicatePage(sourcePageId: string) {
    const synced = syncCurrentEditorToPageState();
    const source = synced.find((p) => p.id === sourcePageId);
    if (!source) return;
    const requestedTitle = duplicatePageCustomTitle.trim() || `${source.title} (copie)`;
    const { pages: nextPages, duplicatedPage } = duplicateIndependentPageInList(
      synced,
      sourcePageId,
      requestedTitle
    );
    if (!duplicatedPage) return;
    setPages(nextPages);
    setActivePageId(duplicatedPage.id);
    setDuplicatePageCustomTitle("");
    setHasUnsavedChanges(true);
    if (editorRef.current) {
      syncCanvasPage(editorRef.current, duplicatedPage);
      refreshLayersFromEditor(editorRef.current);
    }
    setStatusBanner(
      `Page dupliquée sous le nom « ${duplicatedPage.title} » avec le slug unique « ${duplicatedPage.slug} ».`
    );
  }

  function handleReorderPageMenu(pageId: string, direction: "up" | "down") {
    const synced = syncCurrentEditorToPageState();
    const reordered = reorderIndependentPagesMenu(synced, pageId, direction);
    setPages(reordered);
    setHasUnsavedChanges(true);
    setStatusBanner("Ordre du menu mis à jour.");
  }

  function handleDuplicateReusableBlock(blockId: string) {
    const source = reusableBlocks.find((b) => b.id === blockId);
    if (!source) return;
    const requestedName = duplicateBlockCustomName.trim() || `${source.name} (copie)`;
    const { reusableBlocks: nextBlocks, duplicatedBlock } = duplicateIndependentReusableBlockInList(
      reusableBlocks,
      blockId,
      requestedName
    );
    if (!duplicatedBlock) return;
    setReusableBlocks(nextBlocks);
    setDuplicateBlockCustomName("");
    setHasUnsavedChanges(true);
    setStatusBanner(`Bloc réutilisable dupliqué sous le nom « ${duplicatedBlock.name} ».`);
  }

  function handleExportProjectJson() {
    const syncedPages = syncCurrentEditorToPageState();
    const exported = exportIndependentSiteProjectToJson({
      title: siteTitle,
      slug: siteSlug,
      siteType,
      projectMode,
      templateId: activeProjectQuery.data?.templateId ?? newSiteTemplateId,
      theme: activeProjectQuery.data?.theme ?? INDEPENDENT_SITE_TEMPLATES[0].theme,
      navigation: buildNavigationFromPages(syncedPages),
      pages: syncedPages,
      reusableBlocks,
    });
    const raw = JSON.stringify(exported, null, 2);
    setExportedJsonText(raw);
    if (typeof window !== "undefined") {
      try {
        const blob = new Blob([raw], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${siteSlug || "site-independant"}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: le JSON est affiché dans la zone de texte
      }
    }
    setStatusBanner(
      `Export JSON contrôlé généré (${exported.project.pages.length} page(s), sans secret ni donnée e-commerce).`
    );
  }

  function requestImportProjectJson(replaceCurrent: boolean) {
    const check = validateAndSanitizeIndependentSiteImport(importJsonRawInput);
    if (!check.valid || !check.sanitizedPackage || !check.preview) {
      setErrorBanner(
        `Import JSON refusé : ${check.error || "Format non reconnu."}`
      );
      return;
    }
    const targetTitle = importCustomTitleInput.trim() || check.preview.title;
    setPendingConfirmAction({
      title: replaceCurrent
        ? `Remplacer le projet actuel par l’import « ${targetTitle} » ?`
        : `Créer un nouveau projet à partir de l’import « ${targetTitle} » ?`,
      description: `L’import JSON contrôlé contient ${check.preview.pageCount} page(s) (${check.preview.pageTitles.join(", ")}) et ${check.preview.reusableBlockCount} bloc(s) réutilisable(s). Le HTML et le CSS ont été nettoyés et vérifiés sans script ni secret.`,
      confirmLabel: replaceCurrent
        ? "Confirmer le remplacement"
        : "Importer comme nouveau projet",
      variant: replaceCurrent ? "danger" : "primary",
      onConfirm: () => {
        if (selectedSiteId && replaceCurrent) {
          importProjectJsonMutation.mutate({
            siteId: selectedSiteId,
            rawJson: importJsonRawInput,
            newTitle: targetTitle,
          });
        } else if (selectedSiteId && !replaceCurrent) {
          importProjectJsonMutation.mutate({
            siteId: null,
            rawJson: importJsonRawInput,
            newTitle: targetTitle,
          });
        } else {
          const imported = check.sanitizedPackage!.project;
          setSiteTitle(targetTitle);
          setSiteType(imported.siteType);
          setProjectMode(imported.projectMode);
          setPages(imported.pages);
          setActivePageId(imported.pages[0].id);
          setReusableBlocks(imported.reusableBlocks);
          setHasUnsavedChanges(true);
          if (editorRef.current && imported.pages[0]) {
            syncCanvasPage(editorRef.current, imported.pages[0]);
            refreshLayersFromEditor(editorRef.current);
          }
          setImportJsonRawInput("");
          setImportCustomTitleInput("");
          setStatusBanner(
            `Projet « ${targetTitle} » chargé depuis l’import JSON (${imported.pages.length} page(s)). Cliquez sur « Sauvegarder » pour l’enregistrer.`
          );
        }
      },
    });
  }

  function requestUnpublishCurrentSite() {
    if (!selectedSiteId) return;
    setPendingConfirmAction({
      title: `Dépublier le site « ${siteTitle} » ?`,
      description: `Le site repassera immédiatement en statut Brouillon privé. Il ne sera plus visible par le public sur /sites/${siteSlug}, mais tout votre travail restera intact dans l’éditeur et dans l’historique des versions.`,
      confirmLabel: "Confirmer la dépublication",
      variant: "danger",
      onConfirm: () => {
        unpublishSiteMutation.mutate({
          siteId: selectedSiteId,
          reason: "Dépublication manuelle depuis le constructeur",
        });
      },
    });
  }

  function requestDeletePage(pageId: string) {
    if (pages.length <= 1) {
      setErrorBanner("Un site doit conserver au moins une page.");
      return;
    }
    const target = pages.find((p) => p.id === pageId);
    if (!target) return;
    setPendingConfirmAction({
      title: `Supprimer la page « ${target.title} » ?`,
      description: `La page « ${target.title} » (${target.slug}) sera retirée de ce site. Vous pourrez annuler tant que vous n’avez pas écrasé votre sauvegarde.`,
      confirmLabel: "Supprimer la page",
      variant: "danger",
      onConfirm: () => {
        const filtered = pages.filter((p) => p.id !== pageId);
        setPages(filtered);
        setHasUnsavedChanges(true);
        if (activePageId === pageId) {
          setActivePageId(filtered[0].id);
          if (editorRef.current) {
            syncCanvasPage(editorRef.current, filtered[0]);
          }
        }
        setStatusBanner(`Page « ${target.title} » supprimée.`);
      },
    });
  }

  function applyImageTransformsToSelectedOrInsert() {
    const css = buildImageTransformCss(imageTransforms);
    const editor = editorRef.current;
    if (editor) {
      const selected = editor.getSelected();
      if (selected && selected.is("image")) {
        selected.setAttributes({
          ...selected.getAttributes(),
          style: css,
        });
        syncCurrentEditorToPageState();
        setHasUnsavedChanges(true);
        setStatusBanner(
          `Réglages appliqués à l’image sélectionnée (rotation ${imageTransforms.rotationDeg}°, zoom ${imageTransforms.scalePercent}%, décalage ${imageTransforms.offsetX}px/${imageTransforms.offsetY}px).`
        );
        return;
      }
    }
    const sampleUrl = newMediaUrl.trim() || VISUAL_CARD_SAMPLE_IMAGES[0].url;
    const sampleAlt = newMediaAlt.trim() || newMediaLabel.trim() || "Image illustrée du site";
    const html = `<figure data-site-block="transformable-image" style="margin:0;padding:32px;text-align:center"><img src="${sampleUrl}" alt="${sampleAlt}" data-site-transformable-image="true" style="${css}" /></figure>`;
    insertHtmlIntoCanvas(html, sampleAlt);
  }

  function saveSelectionAsReusableBlock() {
    const editor = editorRef.current;
    const selected = editor?.getSelected();
    const html = selected ? selected.toHTML() : activePage?.html || "";
    if (!html.trim()) return;
    const label =
      reusableBlockNameInput.trim() || `Bloc mémorisé #${reusableBlocks.length + 1}`;
    const item: IndependentSiteReusableBlock = {
      id: `reusable-${Date.now().toString(36)}`,
      name: label,
      category: "Mes blocs multi-pages",
      html,
      createdAt: new Date().toISOString(),
    };
    setReusableBlocks((prev) => [item, ...prev]);
    setReusableBlockNameInput("");
    setHasUnsavedChanges(true);
    setStatusBanner(`Bloc « ${label} » mémorisé pour être réutilisé sur toutes vos pages.`);
  }

  function refreshLayersFromEditor(editor: Editor | null) {
    if (!editor) return;
    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    const comps = wrapper.components().models || [];
    const list: LayerSummaryItem[] = comps.map((comp: any, idx: number) => {
      const attrs = comp.getAttributes?.() || {};
      const tagName = (comp.get?.("tagName") || "section").toUpperCase();
      const label =
        attrs["data-site-block"] ||
        attrs["data-site-module"] ||
        attrs["data-site-card-grid"] ||
        comp.getName?.() ||
        `${tagName} #${idx + 1}`;
      return {
        id: comp.cid || `layer-${idx}`,
        tagName,
        label: String(label),
        locked: Boolean(comp.get?.("locked")),
        hidden: attrs?.style?.includes("display:none") || false,
      };
    });
    setLayers(list);
  }

  function handleLayerAction(
    index: number,
    action: "up" | "down" | "lock" | "hide" | "duplicate" | "delete"
  ) {
    const editor = editorRef.current;
    const wrapper = editor?.getWrapper();
    if (!editor || !wrapper) return;
    const collection = wrapper.components();
    const comp = collection.at(index);
    if (!comp) return;

    if (action === "up" && index > 0) {
      collection.remove(comp);
      collection.add(comp, { at: index - 1 });
    } else if (action === "down" && index < collection.length - 1) {
      collection.remove(comp);
      collection.add(comp, { at: index + 1 });
    } else if (action === "lock") {
      const nextLocked = !comp.get("locked");
      comp.set({ locked: nextLocked, draggable: !nextLocked, selectable: !nextLocked });
    } else if (action === "hide") {
      const style = comp.getStyle() || {};
      comp.setStyle({
        ...style,
        display: style.display === "none" ? "block" : "none",
      });
    } else if (action === "duplicate") {
      const clone = comp.clone();
      collection.add(clone, { at: index + 1 });
    } else if (action === "delete") {
      comp.remove();
    }

    syncCurrentEditorToPageState();
    refreshLayersFromEditor(editor);
    setHasUnsavedChanges(true);
  }

  function handleSaveCurrentProject(versionLabel?: string) {
    // Prévention synchrone contre les doubles clics sur Sauvegarder
    if (
      saveInFlightRef.current ||
      saveProjectMutation.isPending ||
      createProjectMutation.isPending ||
      publishSiteMutation.isPending
    ) {
      return;
    }
    saveInFlightRef.current = true;
    setErrorBanner(null);

    const syncedPages = ensureNonEmptyIndependentPages(
      syncCurrentEditorToPageState(),
      siteTitle
    );
    const nav = buildNavigationFromPages(syncedPages);
    if (!selectedSiteId) {
      createProjectMutation.mutate({
        title: siteTitle,
        siteType,
        slug: siteSlug,
        templateId: newSiteTemplateId || ATH_VAHLOUL_DEMO_TEMPLATE_ID,
      });
      return;
    }
    saveProjectMutation.mutate({
      siteId: selectedSiteId,
      title: siteTitle,
      siteType,
      navigation: nav,
      pages: syncedPages,
      reusableBlocks,
      ...(versionLabel ? { createVersionLabel: versionLabel } : {}),
    });
  }

  function requestPublishCurrentSite() {
    if (!qualityReport.canPublish) {
      setActiveInspectorTab("qualite");
      const failedLabels = qualityReport.checklist
        .filter((c) => c.blocking && !c.passed)
        .map((c) => c.label);
      setErrorBanner(
        `Publication bloquée par la checklist qualité : ${failedLabels.join(" | ")}`
      );
      return;
    }
    const demoNotice = qualityReport.demoStatus.hasUnchangedDemoMarkers
      ? ` Attention : ce projet contient encore des mentions de démonstration (${qualityReport.demoStatus.badgeLabel}).`
      : "";
    setPendingConfirmAction({
      title: `Publier le site « ${siteTitle} » en ligne (Score qualité : ${qualityReport.overallScore100}/100) ?`,
      description: `Résumé des changements : ${pages.length} page(s) vérifiées (${internalLinkCheck.checkedLinksCount} lien(s) vérifié(s)) seront publiées sur /sites/${siteSlug} et journalisées avec création automatique d’une version.${demoNotice}`,
      confirmLabel: "Confirmer la publication",
      variant: "primary",
      onConfirm: () => {
        if (!selectedSiteId) {
          handleSaveCurrentProject("Avant publication");
          return;
        }
        const syncedPages = ensureNonEmptyIndependentPages(
          syncCurrentEditorToPageState(),
          siteTitle
        );
        const nav = buildNavigationFromPages(syncedPages);
        saveProjectMutation.mutate(
          {
            siteId: selectedSiteId,
            title: siteTitle,
            siteType,
            navigation: nav,
            pages: syncedPages,
            reusableBlocks,
          },
          {
            onSuccess: (saved) => {
              publishSiteMutation.mutate({ siteId: saved.id });
            },
          }
        );
      },
    });
  }

  function handleSelectViewportMode(mode: ResponsiveViewportMode) {
    setSideBySidePreview(false);
    setViewport(mode);
    if (mode === "desktop") setDevicePresetId("desktop");
    else if (mode === "tablet") setDevicePresetId("tablet-portrait");
    else setDevicePresetId("narrow-phone");
  }

  function handleSelectDevicePreset(presetId: ResponsiveDevicePresetId) {
    setSideBySidePreview(false);
    setDevicePresetId(presetId);
    const found = RESPONSIVE_DEVICE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setViewport(found.viewportMode);
    }
  }

  function handleToggleSideBySidePreview() {
    if (!sideBySidePreview) {
      syncCurrentEditorToPageState();
    }
    setSideBySidePreview((prev) => !prev);
  }

  const sideBySideSrcDoc = useMemo(() => {
    if (!sideBySidePreview || !activePage) return "";
    return buildClientPreviewSrcDoc({
      pageTitle: activePage.title || "Page",
      siteTitle: siteTitle || "Aperçu",
      html: activePage.html || "",
      css: activePage.css || "",
    });
  }, [activePage, sideBySidePreview, siteTitle]);

  const currentDevicePreset =
    RESPONSIVE_DEVICE_PRESETS.find((p) => p.id === devicePresetId) ?? RESPONSIVE_DEVICE_PRESETS[0];

  const isBusySaving =
    saveProjectMutation.isPending ||
    createProjectMutation.isPending ||
    publishSiteMutation.isPending;

  const workflowSummary = useMemo(
    () =>
      computeIndependentProjectWorkflowState({
        projectId: selectedSiteId,
        title: siteTitle,
        siteType,
        projectMode,
        status: siteStatus,
        hasUnsavedChanges,
        isSaving: isBusySaving,
        lastSavedAt,
        saveError: errorBanner,
      }),
    [
      selectedSiteId,
      siteTitle,
      siteType,
      projectMode,
      siteStatus,
      hasUnsavedChanges,
      isBusySaving,
      lastSavedAt,
      errorBanner,
    ]
  );

  const privatePreviewHref = useMemo(
    () =>
      buildEditorPreviewUrl({
        slug: siteSlug || "association-familiale-ath-vahloul",
        siteId: selectedSiteId,
        pageSlug: activePage?.slug || "/",
      }),
    [siteSlug, selectedSiteId, activePage?.slug]
  );

  return (
    <div
      className="min-h-screen bg-[#f6f3ee] text-[#172033]"
      data-active-site-id={selectedSiteId ?? ""}
      data-active-site-slug={siteSlug}
    >
      {/* BANDEAU DE REPÉRAGE IMMÉDIAT DU SITE ADMINISTRÉ, DU RÔLE ACTIF & DU RETOUR AU SITE PUBLIC */}
      <div
        role="region"
        aria-label="Informations sur le site administré et votre rôle d'accès"
        className="border-b border-[#d9dfcf] bg-[#eef2e8] px-4 py-2.5 text-[#172033] md:px-6"
      >
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#40552d] px-2.5 py-1 font-bold text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              Espace d’administration du site : « {siteTitle} »
              {selectedSiteId ? ` (#${selectedSiteId})` : ""}
            </span>
            <Badge
              variant="outline"
              className="border-[#40552d]/40 bg-white font-bold text-[#172033]"
            >
              Votre rôle : {currentRolePresentation.badgeLabel}
            </Badge>
            <span className="hidden text-slate-700 lg:inline">
              {currentRolePresentation.description}
            </span>
            {!canAdministerSite && (
              <Badge
                variant="outline"
                className="border-amber-400 bg-amber-50 font-semibold text-amber-950"
              >
                Mode Éditeur : vos modifications sont enregistrées en brouillon (publication par un Administrateur)
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveInspectorTab("access")}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#40552d]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#40552d] transition hover:bg-[#f7f9f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40552d]"
            >
              <Lock className="h-3.5 w-3.5" />
              {canManageAccess
                ? "Inviter un client / Gérer les accès"
                : "Voir mes permissions & aide"}
            </button>
            <Link
              href={`/sites/${siteSlug || "association-familiale-ath-vahloul"}`}
            >
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#172033]/20 bg-[#172033] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#24324f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40552d]">
                <Globe className="h-3.5 w-3.5 text-[#f5b98f]" />
                Retour au site public (/sites/{siteSlug || "association-familiale-ath-vahloul"})
              </span>
            </Link>
          </div>
        </div>
      </div>
      {/* EN-TÊTE PRINCIPAL DU PRODUIT INDÉPENDANT */}
      <header className="sticky top-0 z-40 border-b border-[#e2dad0] bg-white/95 px-4 py-3 shadow-2xs backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3">
          {/* 1. État clair du projet : Nom, Type (Site vitrine / Boutique hybride), Statut (Brouillon / Sauvegardé / Publié), Date de dernière sauvegarde, Indicateur de modifications non enregistrées */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-white shadow-2xs">
              <Globe className="h-5 w-5 text-[#f5b98f]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-[#172033] md:text-lg">
                  Constructeur de Sites Internet Indépendant
                </h1>
                <Badge className="bg-emerald-100 text-emerald-950 hover:bg-emerald-100">
                  Séparé de Studio MAZIGHO
                </Badge>

                {/* Sélecteur / Badge du Type de projet : Site vitrine ou Boutique hybride */}
                <div className="inline-flex items-center gap-1 rounded-lg border border-[#e2dad0] bg-[#faf8f5] px-2 py-0.5 text-xs">
                  <span className="font-semibold text-slate-600">Type :</span>
                  <select
                    aria-label="Type de projet (Site vitrine ou Boutique hybride)"
                    value={projectMode}
                    onChange={(e) => {
                      setProjectMode(e.target.value as IndependentProjectMode);
                      setHasUnsavedChanges(true);
                    }}
                    className="bg-transparent font-bold text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                  >
                    {INDEPENDENT_PROJECT_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge de statut clair : Brouillon / Sauvegardé / Publié / Archivé */}
                <Badge
                  variant="outline"
                  className={
                    workflowSummary.workflowStatus === "publie"
                      ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-900"
                      : workflowSummary.workflowStatus === "sauvegarde"
                        ? "border-sky-400 bg-sky-50 font-semibold text-sky-900"
                        : workflowSummary.workflowStatus === "archive"
                          ? "border-slate-300 bg-slate-100 text-slate-700"
                          : "border-amber-400 bg-amber-50 font-semibold text-amber-950"
                  }
                >
                  Statut : {workflowSummary.workflowStatusLabel}
                </Badge>

                {/* Indicateur explicite des modifications non enregistrées & date de dernière sauvegarde */}
                {workflowSummary.hasUnsavedChanges ? (
                  <Badge
                    variant="outline"
                    className="border-amber-400 bg-amber-50/90 text-[11px] font-semibold text-amber-900"
                  >
                    ● {workflowSummary.unsavedIndicatorLabel}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50/60 text-[11px] font-medium text-emerald-900"
                  >
                    ✓ {workflowSummary.unsavedIndicatorLabel}
                  </Badge>
                )}

                {/* Phase 2 : Score global de Qualité du site (cliquable vers le panneau Qualité) */}
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab("qualite")}
                  title="Ouvrir le panneau Qualité du site, Checklist avant publication, Accessibilité & Responsive"
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                    qualityReport.overallScore100 >= 85
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      : qualityReport.overallScore100 >= 65
                        ? "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        : "border-rose-400 bg-rose-50 text-rose-900 hover:bg-rose-100"
                  }`}
                >
                  Qualité : {qualityReport.overallScore100}/100
                </button>

                {/* Phase 2 : Mention explicite "Démonstration à personnaliser" si contenu démo */}
                {qualityReport.demoStatus.hasUnchangedDemoMarkers && (
                  <Badge
                    variant="outline"
                    className="border-amber-400 bg-amber-50/90 text-[11px] font-semibold text-amber-950"
                  >
                    ★ {DEMO_CONTENT_NOTICE_LABEL}
                  </Badge>
                )}
              </div>

              <p className="mt-0.5 text-xs text-slate-600">
                Projet : <strong className="text-[#172033]">{workflowSummary.projectTitle}</strong>{" "}
                ({workflowSummary.projectModeLabel}) · {workflowSummary.statusDetailLabel} ·{" "}
                <span className="text-slate-500">{workflowSummary.lastSavedLabel}</span> · Page
                active : <strong className="text-[#9b563e]">{activePage?.title}</strong> (
                <code>{activePage?.slug}</code>)
              </p>
            </div>
          </div>

          {/* Contrôles Responsive + Undo/Redo + Parcours distinct : 1. Modifier | 2. Prévisualiser | 3. Sauvegarder | 4. Publier */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Modes d'affichage responsive"
              className="flex items-center rounded-lg border border-[#e2dad0] bg-[#faf8f5] p-1"
            >
              <button
                type="button"
                onClick={() => handleSelectViewportMode("desktop")}
                aria-pressed={!sideBySidePreview && viewport === "desktop"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                  !sideBySidePreview && viewport === "desktop"
                    ? "bg-[#172033] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                Ordinateur
              </button>
              <button
                type="button"
                onClick={() => handleSelectViewportMode("tablet")}
                aria-pressed={!sideBySidePreview && viewport === "tablet"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                  !sideBySidePreview && viewport === "tablet"
                    ? "bg-[#172033] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Tablet className="h-3.5 w-3.5" />
                Tablette
              </button>
              <button
                type="button"
                onClick={() => handleSelectViewportMode("mobile")}
                aria-pressed={!sideBySidePreview && viewport === "mobile"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                  !sideBySidePreview && viewport === "mobile"
                    ? "bg-[#172033] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
              <button
                type="button"
                onClick={handleToggleSideBySidePreview}
                aria-pressed={sideBySidePreview}
                title="Comparer simultanément le rendu Ordinateur et Mobile"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                  sideBySidePreview
                    ? "bg-[#9b563e] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Côte à côte
              </button>
            </div>

            <select
              aria-label="Format d'écran précis"
              value={devicePresetId}
              onChange={(e) =>
                handleSelectDevicePreset(e.target.value as ResponsiveDevicePresetId)
              }
              className="h-8 rounded-lg border border-[#e2dad0] bg-white px-2.5 text-xs font-medium text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              {RESPONSIVE_DEVICE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.shortLabel})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.UndoManager.undo()}
                title="Annuler la dernière modification"
                aria-label="Annuler la dernière modification"
                className="h-8 w-8 border-[#e2dad0] p-0 focus-visible:ring-2 focus-visible:ring-[#9b563e]"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.UndoManager.redo()}
                title="Rétablir la modification"
                aria-label="Rétablir la modification"
                className="h-8 w-8 border-[#e2dad0] p-0 focus-visible:ring-2 focus-visible:ring-[#9b563e]"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Étape 1 : Modifier (mode actif dans l'éditeur) */}
            <span
              title="Vous êtes actuellement dans l’éditeur visuel"
              className="hidden items-center gap-1 rounded-md border border-[#172033]/20 bg-[#172033]/5 px-2.5 py-1 text-xs font-bold text-[#172033] md:inline-flex"
            >
              <Pencil className="h-3.5 w-3.5 text-[#9b563e]" />
              1. Modifier (actif)
            </span>

            {/* Action Sauvegarder avec prévention des doubles clics */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSaveCurrentProject()}
              disabled={isBusySaving || !workflowSummary.canTriggerSave}
              title={INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.sauvegarder.description}
              className="h-8 border-[#9b563e] bg-[#faf8f5] text-xs font-semibold text-[#9b563e] hover:bg-[#f3ece2] focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveProjectMutation.isPending || createProjectMutation.isPending
                ? "Sauvegarde en cours…"
                : "Sauvegarder"}
            </Button>

            {/* Étape 2 : Prévisualiser (Aperçu privé distinct de la publication) */}
            <Link href={privatePreviewHref}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title={INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.previsualiser.description}
                className="h-8 border-[#e2dad0] bg-white text-xs font-semibold text-[#172033] hover:bg-[#faf8f5] focus-visible:ring-2 focus-visible:ring-[#9b563e]"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5 text-[#9b563e]" />
                2. Prévisualiser (Privé)
              </Button>
            </Link>

            {/* Étape 3 : Publier en ligne (réservé Administrateur / Propriétaire) */}
            <Button
              type="button"
              size="sm"
              title={
                !canAdministerSite
                  ? "La publication en ligne est réservée à l’Administrateur ou au Propriétaire du site. Vous pouvez sauvegarder votre brouillon et vérifier l’aperçu privé."
                  : INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.publier.description
              }
              className="h-8 bg-[#172033] text-xs font-semibold text-white hover:bg-[#24324f] focus-visible:ring-2 focus-visible:ring-[#9b563e] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={requestPublishCurrentSite}
              disabled={isBusySaving || !canAdministerSite}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#f5b98f]" />
              {!canAdministerSite
                ? "3. Publier (Réservé Admin)"
                : publishSiteMutation.isPending
                  ? "Publication…"
                  : "3. Publier"}
            </Button>

            {/* Guide illustré privé (18 étapes) et vidéo de prise en main (12 chapitres) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTrainingModalMode("guide");
                setTrainingModalOpen(true);
              }}
              className="h-8 border-[#e2dad0] bg-white text-xs font-semibold text-[#172033] hover:bg-[#faf8f5] focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              <BookOpen className="mr-1 h-3.5 w-3.5 text-[#1e3a2f]" />
              Guide (18 étapes)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTrainingModalMode("video");
                setTrainingModalOpen(true);
              }}
              className="h-8 border-[#e2dad0] bg-white text-xs font-semibold text-[#172033] hover:bg-[#faf8f5] focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              <Film className="mr-1 h-3.5 w-3.5 text-[#1e3a2f]" />
              Vidéo (3 min)
            </Button>

            {/* Bouton Aide contextuelle non intrusive */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHelpGuideDrawer((prev) => !prev)}
              aria-expanded={showHelpGuideDrawer}
              className={`h-8 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                showHelpGuideDrawer
                  ? "border-[#172033] bg-[#172033] text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:bg-[#faf8f5]"
              }`}
            >
              <HelpCircle className="mr-1 h-3.5 w-3.5 text-[#9b563e]" />
              Aide & Repères
            </Button>
          </div>
        </div>

        {/* BARRE DES 9 ACTIONS RAPIDES IMMÉDIATEMENT IDENTIFIABLES (Chantier 1) */}
        <div className="mx-auto mt-2.5 flex max-w-[1640px] flex-wrap items-center justify-between gap-2 border-t border-[#efe9e0] pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#9b563e]">
              Actions rapides :
            </span>
            <button
              type="button"
              onClick={() => setShowProjectsDrawer((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dad0] bg-[#faf8f5] px-2.5 py-1 text-xs font-semibold text-[#172033] transition hover:border-[#9b563e] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              <Plus className="h-3.5 w-3.5 text-[#9b563e]" />
              Créer un site / Mes sites
              {showProjectsDrawer ? (
                <ChevronUp className="h-3 w-3 text-slate-500" />
              ) : (
                <ChevronDown className="h-3 w-3 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLibraryTab("modeles")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                activeLibraryTab === "modeles"
                  ? "border-[#172033] bg-[#172033] text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:border-[#9b563e]"
              }`}
            >
              <Palette className="h-3.5 w-3.5 text-[#9b563e]" />
              Choisir un modèle ({INDEPENDENT_SITE_TEMPLATES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLibraryTab("pages")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                activeLibraryTab === "pages"
                  ? "border-[#172033] bg-[#172033] text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:border-[#9b563e]"
              }`}
            >
              <FilePlus2 className="h-3.5 w-3.5 text-sky-600" />
              Ajouter une page
            </button>
            <button
              type="button"
              onClick={() => setActiveLibraryTab("blocs")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                activeLibraryTab === "blocs"
                  ? "border-[#9b563e] bg-[#9b563e] text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:border-[#9b563e]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-[#9b563e]" />
              Ajouter un bloc
            </button>
            <button
              type="button"
              onClick={() => setActiveLibraryTab("modules")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                activeLibraryTab === "modules"
                  ? "border-[#7c3f2c] bg-[#7c3f2c] text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:border-[#9b563e]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Ajouter un module
            </button>
            <button
              type="button"
              onClick={() => setActiveLibraryTab("medias")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                activeLibraryTab === "medias"
                  ? "border-emerald-800 bg-emerald-800 text-white"
                  : "border-[#e2dad0] bg-white text-[#172033] hover:border-[#9b563e]"
              }`}
            >
              <ImagePlus className="h-3.5 w-3.5 text-emerald-600" />
              Ajouter une image
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                requestSwitchProjectWithGuard("charger la démonstration ATH VAHLOUL", () =>
                  ensureAthVahloulMutation.mutate()
                )
              }
              disabled={ensureAthVahloulMutation.isPending}
              className="h-7 border-amber-300 bg-amber-50/90 text-xs font-semibold text-amber-950 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-[#9b563e]"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5 text-[#9b563e]" />
              Démo ATH VAHLOUL (6 pages)
            </Button>
          </div>
        </div>

        {/* Message visible pendant la sauvegarde */}
        {workflowSummary.savingInProgressMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mt-2 flex max-w-[1640px] items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-950"
          >
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-sky-700 motion-reduce:animate-none" />
            <span>{workflowSummary.savingInProgressMessage}</span>
          </div>
        )}

        {/* Bandeau de confirmation claire après sauvegarde / statut */}
        {statusBanner && (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mt-2 flex max-w-[1640px] items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              {statusBanner}
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="ml-4 font-semibold text-emerald-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Bandeau d'erreur compréhensible en cas d'échec avec bouton Réessayer */}
        {errorBanner && (
          <div
            role="alert"
            className="mx-auto mt-2 flex max-w-[1640px] flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-950"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-700" />
              {errorBanner}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusySaving}
                onClick={() => handleSaveCurrentProject()}
                className="h-7 border-rose-400 bg-white text-xs font-semibold text-rose-900 hover:bg-rose-100"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Réessayer la sauvegarde
              </Button>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="font-semibold text-rose-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Bannière de restauration explicite et contrôlée du filet de sécurité local (jamais silencieuse) */}
        {pendingSafetySnapshot && (
          <div
            role="region"
            aria-label="Récupération contrôlée d'un brouillon local"
            className="mx-auto mt-2.5 flex max-w-[1640px] flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400 bg-amber-50/95 p-3 text-xs text-amber-950"
          >
            <div>
              <p className="font-bold text-[#172033]">
                Filet de sécurité local détecté pour « {pendingSafetySnapshot.title} »
              </p>
              <p className="mt-0.5 text-slate-700">
                Un état local non enregistré datant du{" "}
                <strong>
                  {new Date(pendingSafetySnapshot.savedAtIso).toLocaleString("fr-FR")}
                </strong>{" "}
                ({pendingSafetySnapshot.pages.length} page(s)) a été conservé temporairement. Votre
                projet sauvegardé n’a pas été modifié automatiquement.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-300 bg-white text-xs"
                onClick={() =>
                  clearLocalSafetySnapshotForProject(
                    pendingSafetySnapshot.siteId,
                    pendingSafetySnapshot.slug
                  )
                }
              >
                Ignorer et garder la version sauvegardée
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-[#9b563e] text-xs text-white hover:bg-[#824631]"
                onClick={requestRestoreLocalSafetySnapshot}
              >
                Restaurer ce brouillon local (avec confirmation)
              </Button>
            </div>
          </div>
        )}

        {/* Dialogue de confirmation inline avant toute action destructive, restauration ou publication */}
        {pendingConfirmAction && (
          <div
            role="alertdialog"
            aria-labelledby="confirm-action-title"
            aria-describedby="confirm-action-desc"
            className="mx-auto mt-2.5 flex max-w-[1640px] flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#9b563e] bg-[#faf8f5] p-3 shadow-md"
          >
            <div>
              <h2 id="confirm-action-title" className="text-xs font-bold text-[#172033]">
                {pendingConfirmAction.title}
              </h2>
              <p id="confirm-action-desc" className="mt-0.5 text-xs text-slate-600">
                {pendingConfirmAction.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setPendingConfirmAction(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                className={
                  pendingConfirmAction.variant === "danger"
                    ? "h-8 bg-rose-700 text-xs text-white hover:bg-rose-800"
                    : "h-8 bg-[#172033] text-xs text-white hover:bg-[#263653]"
                }
                onClick={() => {
                  const fn = pendingConfirmAction.onConfirm;
                  setPendingConfirmAction(null);
                  fn();
                }}
              >
                {pendingConfirmAction.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1640px] space-y-5 p-4 md:p-5">
        {/* AIDE UTILISATEUR CONTEXTUELLE NON INTRUSIVE (5 repères clairs en français simple) */}
        {showHelpGuideDrawer && (
          <Card className="border-[#d9c3b0] bg-[#faf5ef] shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                    <HelpCircle className="h-4 w-4 text-[#9b563e]" />
                    Guide rapide & Repères du Constructeur Indépendant
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-700">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.separationNotice}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHelpGuideDrawer(false)}
                  className="h-7 border-[#e2dad0] bg-white text-xs"
                >
                  Masquer l’aide
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* 1. Différence entre un Bloc, un Module, un Socle et un Modèle */}
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#9b563e]">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.bloc.title}
                  </strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.bloc.description}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#9b563e]">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.module.title}
                  </strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.module.description}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-teal-800">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.socle.title}
                  </strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.socle.description}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#172033]">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.modele.title}
                  </strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.libraryRoles.modele.description}
                  </p>
                </div>
              </div>

              {/* 2. Différence entre Sauvegarder, Prévisualiser et Publier + Modes Site vitrine / Boutique hybride */}
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#172033]">
                    Sauvegarder vs Prévisualiser vs Publier
                  </strong>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    <li>
                      • <strong>Sauvegarder</strong> :{" "}
                      {INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.sauvegarder.description}
                    </li>
                    <li>
                      • <strong>Prévisualiser</strong> :{" "}
                      {INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.previsualiser.description}
                    </li>
                    <li>
                      • <strong>Publier</strong> :{" "}
                      {INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.publier.description}
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#172033]">Mode « Site vitrine »</strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.projectModes.site_vitrine}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2dad0] bg-white p-3">
                  <strong className="text-[#172033]">Mode « Boutique hybride »</strong>
                  <p className="mt-1 text-slate-600">
                    {INDEPENDENT_BUILDER_HELP_GUIDES.projectModes.boutique_hybride}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TIROIR REPLIABLE : ESPACE PROJETS & CRÉATION D'UN NOUVEAU SITE */}
        {showProjectsDrawer && (
          <Card className="border-[#e2dad0] bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base text-[#172033]">
                    <FolderKanban className="h-5 w-5 text-[#9b563e]" />
                    Créer un nouveau site ou changer de projet
                  </CardTitle>
                  <CardDescription>
                    Créez un site indépendant à partir d’un modèle, ouvrez un brouillon existant ou dupliquez un site.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["all", "draft", "published", "archived"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                        statusFilter === st
                          ? "bg-[#172033] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {st === "all"
                        ? "Tous mes sites"
                        : st === "draft"
                          ? "Brouillons"
                          : st === "published"
                            ? "Publiés"
                            : "Archivés"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3.5 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033]">
                    Nom du site internet
                  </label>
                  <input
                    type="text"
                    value={newSiteTitle}
                    onChange={(e) => setNewSiteTitle(e.target.value)}
                    placeholder="Ex. Association familiale ATH VAHLOUL"
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033]">
                    Catégorie de site
                  </label>
                  <select
                    value={newSiteType}
                    onChange={(e) => setNewSiteType(e.target.value as IndependentSiteType)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                  >
                    {INDEPENDENT_SITE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033]">
                    Modèle complet de départ (10 modèles)
                  </label>
                  <select
                    value={newSiteTemplateId}
                    onChange={(e) => setNewSiteTemplateId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                  >
                    {INDEPENDENT_SITE_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.pages.length} pages)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    className="h-9 flex-1 bg-[#9b563e] text-white hover:bg-[#824631]"
                    onClick={() =>
                      requestSwitchProjectWithGuard("créer un nouveau site", () =>
                        createProjectMutation.mutate({
                          title: newSiteTitle,
                          siteType: newSiteType,
                          templateId: newSiteTemplateId,
                        })
                      )
                    }
                    disabled={createProjectMutation.isPending}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Créer ce site
                  </Button>
                </div>
              </div>

              {projectsQuery.data && projectsQuery.data.length > 0 && (
                <div className="grid gap-3 md:grid-cols-3">
                  {projectsQuery.data.map((proj) => (
                    <div
                      key={proj.id}
                      className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                        selectedSiteId === proj.id
                          ? "border-[#172033] bg-[#faf8f5] ring-2 ring-[#172033]/10"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#172033]">{proj.title}</span>
                          <Badge
                            variant="outline"
                            className={
                              proj.status === "published"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : proj.status === "archived"
                                  ? "border-slate-300 bg-slate-100 text-slate-600"
                                  : "border-amber-300 bg-amber-50 text-amber-900"
                            }
                          >
                            {proj.status === "published"
                              ? "Publié"
                              : proj.status === "archived"
                                ? "Archivé"
                                : "Brouillon"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Type : {proj.siteType} · {proj.pages.length} pages ·{" "}
                          <code>/{proj.slug}</code>
                        </p>
                      </div>
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={duplicateProjectCustomTitle}
                          onChange={(e) => setDuplicateProjectCustomTitle(e.target.value)}
                          placeholder={`Nouveau nom pour copie (ex. ${proj.title} — V2)`}
                          aria-label={`Nouveau nom avant duplication de ${proj.title}`}
                          className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant={selectedSiteId === proj.id ? "default" : "outline"}
                            className="h-7 text-xs"
                            onClick={() =>
                              requestSwitchProjectWithGuard(
                                `ouvrir le projet « ${proj.title} »`,
                                () => {
                                  selectActiveSiteId(proj.id);
                                  loadProjectIntoWorkspace(proj);
                                  setHasUnsavedChanges(false);
                                }
                              )
                            }
                          >
                            Ouvrir
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              const customTitle = duplicateProjectCustomTitle.trim();
                              if (!canAdministerSite) return;
                              duplicateProjectMutation.mutate({
                                siteId: proj.id,
                                newTitle: customTitle || undefined,
                              });
                              setDuplicateProjectCustomTitle("");
                            }}
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Dupliquer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (!canAdministerSite) return;
                              updateStatusMutation.mutate({
                                siteId: proj.id,
                                status: proj.status === "archived" ? "draft" : "archived",
                              });
                            }}
                          >
                            <Archive className="mr-1 h-3 w-3" />
                            {proj.status === "archived" ? "Désarchiver" : "Archiver"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ARCHITECTURE EN 3 ZONES CLAIREMENT SÉPARÉES : 1. BIBLIOTHÈQUE (Gauche) | 2. CANVAS (Centre) | 3. RÉGLAGES, SEO & PUBLICATION (Droite/Bas) */}
        <div className="grid gap-5 xl:grid-cols-12">
          {/* ZONE 1 — BIBLIOTHÈQUE PROFESSIONNELLE À 7 ESPACES (Chantier 2) */}
          <aside className="space-y-4 xl:col-span-4">
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#9b563e]">
                      1. Bibliothèque du site
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-slate-600">
                      7 espaces organisés par usage pour construire vos pages sans compétence technique.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-[#e2dad0] bg-[#faf8f5] text-[10px] font-semibold text-[#172033]"
                  >
                    7 espaces
                  </Badge>
                </div>

                {/* Barre de recherche universelle de la bibliothèque avec effacement rapide */}
                <div className="relative mt-2.5 flex items-center">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="search"
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="Rechercher un bloc, module, socle ou modèle…"
                    aria-label="Rechercher dans la bibliothèque du constructeur"
                    className="h-8 w-full rounded-lg border border-slate-200 bg-[#faf8f5] pl-8 pr-16 text-xs outline-none transition focus:border-[#9b563e] focus:bg-white focus:ring-2 focus:ring-[#9b563e]/20"
                  />
                  {librarySearch && (
                    <button
                      type="button"
                      onClick={() => setLibrarySearch("")}
                      className="absolute right-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#9b563e] hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Sélecteur des 7 onglets avec icône, compteur, sous-titre métier et navigation clavier */}
                <div
                  role="tablist"
                  aria-label="Espaces de la bibliothèque du constructeur"
                  className="mt-2.5 grid grid-cols-4 gap-1.5 sm:grid-cols-7 xl:grid-cols-4"
                >
                  {INDEPENDENT_BUILDER_LIBRARY_TABS.map((tab, tabIdx) => {
                    const meta = LIBRARY_TAB_META[tab.id];
                    const Icon = meta.icon;
                    const count =
                      tab.id === "pages"
                        ? pages.length
                        : tab.id === "blocs"
                          ? filteredBlocks.length
                          : tab.id === "medias"
                            ? (mediaQuery.data?.length ?? 0)
                            : tab.id === "calques"
                              ? layers.length
                              : tab.id === "modules"
                                ? filteredModules.length
                                : tab.id === "socles"
                                  ? filteredSocles.length
                                  : filteredTemplates.length;
                    const isSelected = activeLibraryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveLibraryTab(tab.id)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight") {
                            e.preventDefault();
                            const nextTab =
                              INDEPENDENT_BUILDER_LIBRARY_TABS[
                                (tabIdx + 1) % INDEPENDENT_BUILDER_LIBRARY_TABS.length
                              ];
                            setActiveLibraryTab(nextTab.id);
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            const prevTab =
                              INDEPENDENT_BUILDER_LIBRARY_TABS[
                                (tabIdx - 1 + INDEPENDENT_BUILDER_LIBRARY_TABS.length) %
                                  INDEPENDENT_BUILDER_LIBRARY_TABS.length
                              ];
                            setActiveLibraryTab(prevTab.id);
                          }
                        }}
                        title={tab.description}
                        className={`group rounded-lg px-2 py-2 text-left text-xs font-bold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                          isSelected
                            ? meta.activeClass
                            : "border border-[#ece5dc] bg-[#faf8f5] text-[#172033] hover:bg-[#efe9e0]"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1 truncate">
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isSelected ? "text-[#f5b98f]" : meta.iconClass
                              }`}
                            />
                            <span className="truncate">{tab.label}</span>
                          </span>
                          <span
                            className={`rounded px-1 text-[10px] font-semibold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-white text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-[10px] font-normal ${
                            isSelected ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {meta.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explication courte et lisible de l'espace actif (Chantier 2 : distinction Blocs / Modules / Socles / Modèles) */}
                <div className="mt-2.5 rounded-lg border border-[#e8e1d7] bg-[#faf8f5] px-3 py-2 text-[11px] leading-4 text-slate-700">
                  <strong className="text-[#172033]">
                    {
                      INDEPENDENT_BUILDER_LIBRARY_TABS.find((t) => t.id === activeLibraryTab)
                        ?.label
                    }{" "}
                    :
                  </strong>{" "}
                  {LIBRARY_TAB_META[activeLibraryTab].roleExplanation}
                </div>
              </CardHeader>

              <CardContent className="max-h-[74vh] space-y-4 overflow-y-auto pr-2">
                {/* ESPACE 1 : PAGES & MENUS */}
                {activeLibraryTab === "pages" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                          Pages du site ({pages.length})
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          Cliquez pour modifier une page
                        </span>
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={duplicatePageCustomTitle}
                          onChange={(e) => setDuplicatePageCustomTitle(e.target.value)}
                          placeholder="Nom personnalisé avant duplication d’une page (optionnel)…"
                          aria-label="Nom personnalisé avant duplication de page"
                          className="mb-2 h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                        />
                      </div>
                      <div className="mt-1 space-y-1.5">
                        {pages.map((p, pageIdx) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition ${
                              activePage?.id === p.id
                                ? "border-[#172033] bg-white font-bold text-[#172033] shadow-2xs"
                                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectPage(p.id)}
                              className="min-w-0 flex-1 truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                            >
                              <span>{p.parentPageId ? `↳ ${p.title}` : p.title}</span>
                              <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                                ({p.slug})
                              </span>
                            </button>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                disabled={pageIdx === 0}
                                onClick={() => handleReorderPageMenu(p.id, "up")}
                                title={`Monter « ${p.title} » dans le menu`}
                                aria-label={`Monter ${p.title} dans le menu`}
                                className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={pageIdx === pages.length - 1}
                                onClick={() => handleReorderPageMenu(p.id, "down")}
                                title={`Descendre « ${p.title} » dans le menu`}
                                aria-label={`Descendre ${p.title} dans le menu`}
                                className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicatePage(p.id)}
                                title={`Dupliquer la page « ${p.title} » avec un slug unique`}
                                aria-label={`Dupliquer la page ${p.title}`}
                                className="rounded p-1 text-[#9b563e] hover:bg-amber-50"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {pages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => requestDeletePage(p.id)}
                                  className="rounded p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                                  title={`Supprimer la page ${p.title}`}
                                  aria-label={`Supprimer la page ${p.title}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formulaire d'ajout de page ou sous-menu */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <FilePlus2 className="h-4 w-4 text-[#9b563e]" />
                        Ajouter une nouvelle page ou un sous-menu
                      </h4>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Titre de la page
                        </label>
                        <input
                          type="text"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          placeholder="Ex. Nos Activités, Tarifs, Galerie…"
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Adresse de la page (optionnel, générée automatiquement)
                        </label>
                        <input
                          type="text"
                          value={newPageSlug}
                          onChange={(e) => setNewPageSlug(e.target.value)}
                          placeholder="Ex. /nos-activites"
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Emplacement dans le menu
                        </label>
                        <select
                          value={newPageParentId}
                          onChange={(e) => setNewPageParentId(e.target.value)}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                        >
                          <option value="">Page principale (Menu supérieur)</option>
                          {pages
                            .filter((p) => !p.parentPageId)
                            .map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                Sous-menu rattaché à : {parent.title}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Structure de départ (Socle)
                        </label>
                        <select
                          value={newPageSocleId}
                          onChange={(e) => setNewPageSocleId(e.target.value)}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                        >
                          {INDEPENDENT_PAGE_SOCLES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#172033] text-xs text-white hover:bg-[#24324f]"
                        onClick={handleAddPage}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Créer et ouvrir cette page
                      </Button>
                    </div>

                    {/* Aperçu de l'arborescence Menus & Sous-menus (limité à 2 niveaux maximum) + Vérification des liens internes */}
                    <div className="space-y-2.5 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#172033]">
                          Aperçu du menu (max 2 niveaux)
                        </h4>
                        <Badge
                          variant="outline"
                          className={
                            internalLinkCheck.valid
                              ? "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                              : "border-rose-300 bg-rose-50 text-[10px] text-rose-900"
                          }
                        >
                          {internalLinkCheck.valid
                            ? "Liens internes : 100 % valides"
                            : `${internalLinkCheck.brokenLinks.length} lien(s) cassé(s)`}
                        </Badge>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {navigationTree.map((item) => (
                          <li key={item.id}>
                            <span className="font-semibold">{item.label}</span>{" "}
                            <code className="text-[11px] text-slate-500">{item.href}</code>
                            {item.children && item.children.length > 0 && (
                              <ul className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-2 text-[11px] text-slate-600">
                                {item.children.map((sub) => (
                                  <li key={sub.id}>
                                    ↳ {sub.label} (<code>{sub.href}</code>)
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                      {!internalLinkCheck.valid && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-900">
                          <strong>Liens internes à corriger :</strong>
                          <ul className="mt-1 space-y-0.5">
                            {internalLinkCheck.brokenLinks.map((bl, idx) => (
                              <li key={idx}>
                                • Page « {bl.fromPageTitle} » → <code>{bl.targetHref}</code> (
                                {bl.linkText})
                              </li>
                            ))}
                          </ul>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 border-rose-300 bg-white text-[11px] font-semibold text-rose-900 hover:bg-rose-100"
                            onClick={handleRepairKnownInternalLinks}
                            disabled={repairKnownInternalLinksMutation.isPending}
                            aria-label="Corriger les anciens liens internes connus"
                          >
                            {repairKnownInternalLinksMutation.isPending
                              ? "Réparation en cours…"
                              : "Corriger les liens connus"}
                          </Button>
                          <p className="mt-1 text-[10px] text-rose-800">
                            Seuls les anciens alias documentés sont modifiés ; les autres erreurs restent visibles pour contrôle manuel.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Préréglages Navigation Principale & Pied de page (Footer) accessibles au clavier */}
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="text-xs font-bold text-[#172033]">
                        Navigation & Pied de page accessibles ({INDEPENDENT_NAV_AND_FOOTER_PRESETS.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Insérez un menu principal avec CTA et menu mobile ou un footer complet (liens légaux, réseaux sociaux).
                      </p>
                      {INDEPENDENT_NAV_AND_FOOTER_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-lg border border-slate-200 bg-[#faf8f5] p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-[#172033]">{preset.label}</strong>
                            <Badge variant="outline" className="text-[10px]">
                              {preset.kind === "header_navigation" ? "Menu & Sous-menu" : "Footer complet"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600">{preset.description}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 w-full border-[#e2dad0] bg-white text-xs font-semibold hover:border-[#9b563e]"
                            onClick={() => insertHtmlIntoCanvas(preset.html, preset.label)}
                          >
                            + Insérer dans la page active
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ESPACE 2 : BLOCS & ATELIER CARTES VISUELLES COMPLET (Chantiers 2 & 3) */}
                {activeLibraryTab === "blocs" && (
                  <div className="space-y-4">
                    {/* ATELIER CARTES VISUELLES COMPLET (Chantier 3) */}
                    <div className="space-y-3 rounded-xl border border-[#d9c3b0] bg-[#faf5ef] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                            <LayoutGrid className="h-4 w-4 text-[#9b563e]" />
                            Atelier Cartes Visuelles (« + »)
                          </h3>
                          <p className="text-[11px] text-slate-600">
                            Créez des cartes carrées, rectangulaires ou rondes avec aperçu immédiat.
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-[#9b563e]/40 bg-white text-[11px] font-bold text-[#9b563e]"
                        >
                          {cardGridConfig.cards.length} cartes
                        </Badge>
                      </div>

                      {/* Préréglages d'usage métier (Catégories, Événements, Membres, Activités, Galeries, Services, Famille, Association) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#172033]">
                          Usage des cartes (pré-remplissage rapide)
                        </label>
                        <select
                          aria-label="Usage des cartes visuelles"
                          value={cardGridConfig.useCase || "famille"}
                          onChange={(e) => {
                            const nextConfig = applyVisualCardUseCasePreset(
                              e.target.value as VisualCardUseCaseId
                            );
                            setCardGridConfig(nextConfig);
                            if (nextConfig.cards[0]) {
                              setSelectedVisualCardId(nextConfig.cards[0].id);
                            }
                          }}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                        >
                          {VISUAL_CARD_USE_CASE_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label} — {preset.sectionEyebrow}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Titre de la section de cartes */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Sur-titre de section
                          </label>
                          <input
                            type="text"
                            value={cardGridConfig.sectionEyebrow}
                            onChange={(e) =>
                              setCardGridConfig((prev) => ({
                                ...prev,
                                sectionEyebrow: e.target.value,
                              }))
                            }
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Titre de section
                          </label>
                          <input
                            type="text"
                            value={cardGridConfig.sectionTitle}
                            onChange={(e) =>
                              setCardGridConfig((prev) => ({
                                ...prev,
                                sectionTitle: e.target.value,
                              }))
                            }
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          />
                        </div>
                      </div>

                      {/* Forme (Rectangulaire, Carrée, Ronde) + Position du texte (Dessous, Dessus, Intérieur) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Forme des cartes
                          </label>
                          <select
                            aria-label="Forme des cartes"
                            value={cardGridConfig.shape}
                            onChange={(e) =>
                              setCardGridConfig((prev) =>
                                setVisualCardGridShape(prev, e.target.value as VisualCardShape)
                              )
                            }
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="rectangular">Rectangulaires</option>
                            <option value="square">Carrées (1:1)</option>
                            <option value="round">Rondes (portraits / icônes)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Position du texte
                          </label>
                          <select
                            aria-label="Position du texte des cartes"
                            value={cardGridConfig.textPlacement}
                            onChange={(e) =>
                              setCardGridConfig((prev) =>
                                setVisualCardGridTextPlacement(
                                  prev,
                                  e.target.value as VisualCardTextPlacement
                                )
                              )
                            }
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="bottom">Texte en dessous de l’image</option>
                            <option value="top">Texte au-dessus de l’image</option>
                            <option value="inside">Texte à l’intérieur de la carte</option>
                          </select>
                        </div>
                      </div>

                      {/* Nombre de colonnes (1 à 4) & Espacement entre cartes (12 à 36 px) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Colonnes sur ordinateur
                          </label>
                          <select
                            aria-label="Nombre de colonnes de cartes"
                            value={cardGridConfig.columns}
                            onChange={(e) =>
                              setCardGridConfig((prev) => ({
                                ...prev,
                                columns: Number(e.target.value) as 1 | 2 | 3 | 4,
                              }))
                            }
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value={1}>1 colonne</option>
                            <option value={2}>2 colonnes</option>
                            <option value={3}>3 colonnes</option>
                            <option value={4}>4 colonnes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Espacement ({cardGridConfig.gapPx ?? 20} px)
                          </label>
                          <input
                            type="range"
                            min={12}
                            max={36}
                            step={2}
                            value={cardGridConfig.gapPx ?? 20}
                            onChange={(e) =>
                              setCardGridConfig((prev) => ({
                                ...prev,
                                gapPx: Number(e.target.value),
                              }))
                            }
                            className="mt-2.5 w-full"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={cardGridConfig.showButton}
                          onChange={(e) => {
                            const showButton = e.target.checked;
                            setCardGridConfig((prev) => ({
                              ...prev,
                              showButton,
                              cards: prev.cards.map((c) => ({ ...c, showButton })),
                            }));
                          }}
                        />
                        Afficher un bouton cliquable sur les cartes
                      </label>

                      {/* Actions rapides sur la liste des cartes : Bouton + Ajouter une carte */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 border-[#9b563e] bg-white text-xs font-bold text-[#9b563e] hover:bg-[#faf8f5]"
                          onClick={() => {
                            const updated = addCardToVisualCardGrid(cardGridConfig);
                            setCardGridConfig(updated);
                            const last = updated.cards[updated.cards.length - 1];
                            if (last) setSelectedVisualCardId(last.id);
                          }}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          + Ajouter une carte
                        </Button>
                        {activeVisualCard && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 bg-white text-xs"
                              onClick={() => {
                                const updated = duplicateCardInVisualCardGrid(
                                  cardGridConfig,
                                  activeVisualCard.id
                                );
                                setCardGridConfig(updated);
                              }}
                              title="Dupliquer la carte sélectionnée"
                            >
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              Dupliquer
                            </Button>
                            {cardGridConfig.cards.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 border-rose-200 bg-white text-xs text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  const updated = removeCardFromVisualCardGrid(
                                    cardGridConfig,
                                    activeVisualCard.id
                                  );
                                  setCardGridConfig(updated);
                                  if (updated.cards[0]) {
                                    setSelectedVisualCardId(updated.cards[0].id);
                                  }
                                }}
                                title="Supprimer la carte sélectionnée"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Sélecteur de carte individuelle pour modifier son image, titre, sous-titre, texte et lien */}
                      <div className="rounded-lg border border-[#e2dad0] bg-white p-2.5">
                        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-2">
                          {cardGridConfig.cards.map((card, idx) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => setSelectedVisualCardId(card.id)}
                              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                                activeVisualCard?.id === card.id
                                  ? "bg-[#172033] text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              Carte {idx + 1}
                            </button>
                          ))}
                        </div>

                        {activeVisualCard && (
                          <div className="mt-2.5 space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600">
                                  Titre de la carte
                                </label>
                                <input
                                  type="text"
                                  value={activeVisualCard.title}
                                  onChange={(e) =>
                                    setCardGridConfig((prev) =>
                                      updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                        title: e.target.value,
                                      })
                                    )
                                  }
                                  className="mt-0.5 h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600">
                                  Sous-titre / Badge
                                </label>
                                <input
                                  type="text"
                                  value={activeVisualCard.subtitle}
                                  onChange={(e) =>
                                    setCardGridConfig((prev) =>
                                      updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                        subtitle: e.target.value,
                                      })
                                    )
                                  }
                                  className="mt-0.5 h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600">
                                Texte descriptif
                              </label>
                              <textarea
                                rows={2}
                                value={activeVisualCard.description}
                                onChange={(e) =>
                                  setCardGridConfig((prev) =>
                                    updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                      description: e.target.value,
                                    })
                                  )
                                }
                                className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600">
                                  Visuel prédéfini
                                </label>
                                <select
                                  value={activeVisualCard.imageUrl}
                                  onChange={(e) =>
                                    setCardGridConfig((prev) =>
                                      updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                        imageUrl: e.target.value,
                                      })
                                    )
                                  }
                                  className="mt-0.5 h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-[11px]"
                                >
                                  {VISUAL_CARD_SAMPLE_IMAGES.map((img) => (
                                    <option key={img.id} value={img.url}>
                                      {img.label}
                                    </option>
                                  ))}
                                  {mediaQuery.data?.map((m) => (
                                    <option key={m.id} value={m.url}>
                                      Média : {m.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600">
                                  Ou URL d’image personnalisée
                                </label>
                                <input
                                  type="text"
                                  value={activeVisualCard.imageUrl}
                                  onChange={(e) =>
                                    setCardGridConfig((prev) =>
                                      updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                        imageUrl: e.target.value,
                                      })
                                    )
                                  }
                                  placeholder="https://..."
                                  className="mt-0.5 h-7 w-full rounded border border-slate-300 px-2 text-[11px]"
                                />
                              </div>
                            </div>

                            {cardGridConfig.showButton && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600">
                                    Texte du bouton
                                  </label>
                                  <input
                                    type="text"
                                    value={activeVisualCard.buttonLabel}
                                    onChange={(e) =>
                                      setCardGridConfig((prev) =>
                                        updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                          buttonLabel: e.target.value,
                                        })
                                      )
                                    }
                                    className="mt-0.5 h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600">
                                    Lien (page ou URL)
                                  </label>
                                  <input
                                    type="text"
                                    value={activeVisualCard.buttonHref}
                                    onChange={(e) =>
                                      setCardGridConfig((prev) =>
                                        updateCardInVisualCardGrid(prev, activeVisualCard.id, {
                                          buttonHref: e.target.value,
                                        })
                                      )
                                    }
                                    placeholder="/contact"
                                    className="mt-0.5 h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Aperçu visuel immédiat des cartes */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowVisualCardLivePreview((prev) => !prev)}
                          className="flex w-full items-center justify-between text-[11px] font-semibold text-[#9b563e]"
                        >
                          <span>Aperçu visuel immédiat ({cardGridConfig.shape})</span>
                          <span>{showVisualCardLivePreview ? "Masquer" : "Afficher"}</span>
                        </button>
                        {showVisualCardLivePreview && (
                          <div className="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-[#e2dad0] bg-white p-2">
                            <div className="origin-top scale-90">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeIndependentHtml(
                                    renderVisualCardGridHtml(cardGridConfig)
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#172033] text-xs font-semibold text-white hover:bg-[#24324f]"
                        onClick={() =>
                          insertHtmlIntoCanvas(
                            renderVisualCardGridHtml(cardGridConfig),
                            `Grille de ${cardGridConfig.cards.length} cartes (${cardGridConfig.sectionTitle})`
                          )
                        }
                      >
                        + Insérer cette grille de cartes dans la page
                      </Button>
                    </div>

                    {/* Filtres de catégories de blocs */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBlockCategoryFilter("all")}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          blockCategoryFilter === "all"
                            ? "bg-[#172033] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Toutes ({INDEPENDENT_BUILDER_BLOCKS.length})
                      </button>
                      {INDEPENDENT_BLOCK_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBlockCategoryFilter(cat)}
                          className="rounded-md border px-2 py-1 text-[11px] font-semibold transition hover:brightness-95"
                          style={
                            blockCategoryFilter === cat
                              ? {
                                  backgroundColor: getIndependentBlockPalette(cat).active,
                                  borderColor: getIndependentBlockPalette(cat).active,
                                  color: "#ffffff",
                                }
                              : {
                                  backgroundColor: getIndependentBlockPalette(cat).surface,
                                  borderColor: getIndependentBlockPalette(cat).border,
                                  color: getIndependentBlockPalette(cat).text,
                                }
                          }
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Liste compacte des blocs éditoriaux */}
                    <div className="space-y-2">
                      {filteredBlocks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                          <p>Aucun bloc ne correspond à votre filtre actuel.</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={() => {
                              setLibrarySearch("");
                              setBlockCategoryFilter("all");
                            }}
                          >
                            Réinitialiser la recherche
                          </Button>
                        </div>
                      ) : (
                        filteredBlocks.map((blk) => (
                          (() => {
                            const palette = getIndependentBlockPalette(blk.category);
                            return (
                              <div
                                key={blk.id}
                                className="flex items-center justify-between gap-2 rounded-xl border p-2.5 transition hover:shadow-sm"
                                style={{ borderColor: palette.border, backgroundColor: palette.surface }}
                              >
                            <div className="min-w-0">
                              <span
                                className="mb-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: palette.border, color: palette.text }}
                              >
                                {blk.category}
                              </span>
                              <strong className="block truncate text-xs text-[#172033]">
                                {blk.label}
                              </strong>
                              <p className="line-clamp-2 text-[11px] text-slate-500">
                                {blk.description}
                              </p>
                            </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                              className="h-7 shrink-0 bg-white/80 text-xs font-semibold"
                              style={{ borderColor: palette.border, color: palette.text }}
                                onClick={() => insertHtmlIntoCanvas(blk.content, blk.label)}
                              >
                                + Insérer
                              </Button>
                              </div>
                            );
                          })()
                        ))
                      )}
                    </div>

                    {/* Blocs réutilisables multi-pages */}
                    <div className="space-y-2 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3">
                      <h4 className="text-xs font-bold text-[#172033]">
                        Mes blocs mémorisés ({reusableBlocks.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Mémorisez une section sélectionnée pour la réinsérer sur d’autres pages.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={reusableBlockNameInput}
                          onChange={(e) => setReusableBlockNameInput(e.target.value)}
                          placeholder="Nom du bloc à mémoriser…"
                          className="h-8 flex-1 rounded border border-slate-300 bg-white px-2 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 bg-white text-xs"
                          onClick={saveSelectionAsReusableBlock}
                        >
                          Mémoriser
                        </Button>
                      </div>
                      {reusableBlocks.length > 0 && (
                        <input
                          type="text"
                          value={duplicateBlockCustomName}
                          onChange={(e) => setDuplicateBlockCustomName(e.target.value)}
                          placeholder="Nouveau nom avant duplication d’un bloc (optionnel)…"
                          aria-label="Nouveau nom avant duplication d'un bloc réutilisable"
                          className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                        />
                      )}
                      {reusableBlocks.map((rb) => (
                        <div
                          key={rb.id}
                          className="flex items-center justify-between gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                        >
                          <span className="truncate font-medium">{rb.name}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => handleDuplicateReusableBlock(rb.id)}
                              title={`Dupliquer le bloc « ${rb.name} »`}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Dupliquer
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => insertHtmlIntoCanvas(rb.html, rb.name)}
                            >
                              Insérer ici
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ESPACE 3 : MÉDIAS & TRANSFORMATIONS D’IMAGES */}
                {activeLibraryTab === "medias" && (
                  <div className="space-y-4">
                    <div className="space-y-3 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <RotateCw className="h-4 w-4 text-[#9b563e]" />
                        Ajuster l’image (Rotation, Zoom, Inclinaison, Position)
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="font-semibold">
                            Rotation ({imageTransforms.rotationDeg}°)
                          </span>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={imageTransforms.rotationDeg}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                rotationDeg: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="font-semibold">
                            Zoom / Taille ({imageTransforms.scalePercent}%)
                          </span>
                          <input
                            type="range"
                            min={25}
                            max={250}
                            value={imageTransforms.scalePercent}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                scalePercent: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="font-semibold">
                            Inclinaison X ({imageTransforms.skewXDeg}°)
                          </span>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            value={imageTransforms.skewXDeg}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                skewXDeg: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="font-semibold">
                            Inclinaison Y ({imageTransforms.skewYDeg}°)
                          </span>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            value={imageTransforms.skewYDeg}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                skewYDeg: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="font-semibold">
                            Décalage X ({imageTransforms.offsetX}px)
                          </span>
                          <input
                            type="range"
                            min={-200}
                            max={200}
                            value={imageTransforms.offsetX}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                offsetX: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="font-semibold">
                            Décalage Y ({imageTransforms.offsetY}px)
                          </span>
                          <input
                            type="range"
                            min={-200}
                            max={200}
                            value={imageTransforms.offsetY}
                            onChange={(e) =>
                              setImageTransforms((p) => ({
                                ...p,
                                offsetY: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={imageTransforms.flipHorizontal ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={() =>
                            setImageTransforms((p) => ({
                              ...p,
                              flipHorizontal: !p.flipHorizontal,
                            }))
                          }
                        >
                          <FlipHorizontal className="mr-1 h-3.5 w-3.5" />
                          Miroir H
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={imageTransforms.flipVertical ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={() =>
                            setImageTransforms((p) => ({
                              ...p,
                              flipVertical: !p.flipVertical,
                            }))
                          }
                        >
                          <FlipVertical className="mr-1 h-3.5 w-3.5" />
                          Miroir V
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setImageTransforms({ ...DEFAULT_IMAGE_TRANSFORMS })}
                        >
                          Réinitialiser
                        </Button>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#172033] text-xs text-white"
                        onClick={applyImageTransformsToSelectedOrInsert}
                      >
                        <Move className="mr-1.5 h-3.5 w-3.5" />
                        Appliquer à l’image sélectionnée / Insérer
                      </Button>
                    </div>

                    {/* Illustrations prêtes à insérer */}
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="text-xs font-bold text-[#172033]">
                        Illustrations prêtes à l’emploi
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {VISUAL_CARD_SAMPLE_IMAGES.map((img) => (
                          <div
                            key={img.id}
                            className="flex flex-col justify-between rounded-lg border border-slate-200 p-2 text-xs"
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className="h-16 w-full rounded object-cover"
                            />
                            <span className="mt-1.5 truncate font-semibold text-[#172033]">
                              {img.label}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-1.5 h-6 text-[11px]"
                              onClick={() =>
                                insertHtmlIntoCanvas(
                                  `<figure style="margin:0;padding:24px;text-align:center"><img src="${img.url}" alt="${img.label}" style="${buildImageTransformCss(imageTransforms)}" /></figure>`,
                                  img.label
                                )
                              }
                            >
                              + Insérer
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ajout d'une image externe dans la médiathèque du projet */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <ImagePlus className="h-4 w-4 text-[#9b563e]" />
                        Médiathèque personnelle du projet
                      </h4>
                      <input
                        type="text"
                        value={newMediaLabel}
                        onChange={(e) => setNewMediaLabel(e.target.value)}
                        placeholder="Titre de l’image (ex. Photo rassemblement 2026)"
                        className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        type="text"
                        value={newMediaAlt}
                        onChange={(e) => setNewMediaAlt(e.target.value)}
                        placeholder="Texte alternatif (important pour le SEO & l’accessibilité)"
                        className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        type="url"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="Adresse URL de l’image (https://...)"
                        className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 text-xs"
                          disabled={!newMediaUrl.trim()}
                          onClick={() => {
                            const label = newMediaLabel.trim() || "Image personnalisée";
                            const alt = newMediaAlt.trim() || label;
                            insertHtmlIntoCanvas(
                              `<figure style="margin:0;padding:24px;text-align:center"><img src="${newMediaUrl.trim()}" alt="${alt}" style="${buildImageTransformCss(imageTransforms)}" /></figure>`,
                              label
                            );
                          }}
                        >
                          Insérer directement
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 flex-1 bg-[#9b563e] text-xs text-white"
                          disabled={!selectedSiteId || !newMediaUrl.trim()}
                          onClick={() => {
                            if (!selectedSiteId) return;
                            addMediaMutation.mutate({
                              siteId: selectedSiteId,
                              label: newMediaLabel || "Média du projet",
                              altText: newMediaAlt || newMediaLabel || "Image",
                              url: newMediaUrl.trim(),
                              transforms: imageTransforms,
                            });
                          }}
                        >
                          Enregistrer
                        </Button>
                      </div>

                      {/* Phase 2 : Recherche, filtre par type MIME, poids/dimensions, renommage, remplacement sans casser les pages et suppression avec confirmation */}
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <input
                            type="search"
                            value={mediaSearchInput}
                            onChange={(e) => setMediaSearchInput(e.target.value)}
                            placeholder="Rechercher une image par nom ou texte alt…"
                            aria-label="Rechercher dans la médiathèque du projet"
                            className="h-7 flex-1 rounded border border-slate-300 bg-[#faf8f5] px-2 text-xs"
                          />
                          <select
                            aria-label="Filtrer les médias par format"
                            value={mediaMimeFilter}
                            onChange={(e) => setMediaMimeFilter(e.target.value)}
                            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="all">Tous formats</option>
                            <option value="image/webp">WebP</option>
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/svg+xml">SVG</option>
                          </select>
                        </div>

                        {filteredMediaItems.length > 0 ? (
                          <div className="space-y-2">
                            {filteredMediaItems.map((m) => {
                              const assessment = assessIndependentMediaItem(m);
                              const isEditing = editingMediaId === m.id;
                              return (
                                <div
                                  key={m.id}
                                  className="space-y-1.5 rounded-lg border border-slate-200 bg-[#faf8f5] p-2.5 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <strong className="block truncate text-[#172033]">
                                        {m.label}
                                      </strong>
                                      <span className="block truncate text-[11px] text-slate-600">
                                        Alt :{" "}
                                        {assessment.hasValidAltText ? (
                                          m.altText
                                        ) : (
                                          <strong className="text-amber-800">
                                            À compléter (recommandé SEO/Accessibilité)
                                          </strong>
                                        )}
                                      </span>
                                      <span className="mt-0.5 block text-[10px] text-slate-500">
                                        {m.mimeType} · {assessment.dimensionsLabel} · ~
                                        {Math.round(assessment.estimatedBytes / 1024)} Ko
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[11px]"
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingMediaId(null);
                                          } else {
                                            setEditingMediaId(m.id);
                                            setEditMediaLabel(m.label);
                                            setEditMediaAlt(m.altText);
                                            setEditMediaNewUrl(m.url);
                                          }
                                        }}
                                      >
                                        {isEditing ? "Fermer" : "Renommer / Remplacer"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[11px]"
                                        onClick={() =>
                                          insertHtmlIntoCanvas(
                                            `<figure style="margin:0;padding:20px;text-align:center"><img src="${m.url}" alt="${m.altText}" data-site-transformable-image="true" style="${buildImageTransformCss(m.transforms)}" /></figure>`,
                                            m.label
                                          )
                                        }
                                      >
                                        Insérer
                                      </Button>
                                      <button
                                        type="button"
                                        title={`Supprimer ${m.label}`}
                                        aria-label={`Supprimer ${m.label}`}
                                        onClick={() => {
                                          if (!selectedSiteId) return;
                                          setPendingConfirmAction({
                                            title: `Supprimer le média « ${m.label} » ?`,
                                            description:
                                              "Ce média sera retiré de la bibliothèque de ce projet.",
                                            confirmLabel: "Supprimer ce média",
                                            variant: "danger",
                                            onConfirm: () =>
                                              deleteMediaMutation.mutate({
                                                siteId: selectedSiteId,
                                                mediaId: m.id,
                                              }),
                                          });
                                        }}
                                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {assessment.warningMessage && (
                                    <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] text-amber-950">
                                      ⚠ {assessment.warningMessage}
                                    </p>
                                  )}

                                  {isEditing && selectedSiteId && (
                                    <div className="space-y-1.5 rounded border border-slate-300 bg-white p-2">
                                      <input
                                        type="text"
                                        value={editMediaLabel}
                                        onChange={(e) => setEditMediaLabel(e.target.value)}
                                        placeholder="Nouveau nom du média"
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                      />
                                      <input
                                        type="text"
                                        value={editMediaAlt}
                                        onChange={(e) => setEditMediaAlt(e.target.value)}
                                        placeholder="Texte alternatif (alt) obligatoire/recommandé"
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                      />
                                      <input
                                        type="url"
                                        value={editMediaNewUrl}
                                        onChange={(e) =>
                                          setEditMediaNewUrl(e.target.value)
                                        }
                                        placeholder="Nouvelle URL pour remplacer l’image dans toutes les pages"
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-7 w-full bg-[#172033] text-xs text-white"
                                        disabled={updateMediaMetadataMutation.isPending}
                                        onClick={() => {
                                          const oldUrl = m.url;
                                          const newUrl = editMediaNewUrl.trim();
                                          if (newUrl && newUrl !== oldUrl) {
                                            const replaced = replaceMediaUrlAcrossPages(
                                              syncCurrentEditorToPageState(),
                                              oldUrl,
                                              newUrl,
                                              editMediaAlt.trim() || undefined
                                            );
                                            setPages(replaced.pages);
                                            setHasUnsavedChanges(true);
                                          }
                                          updateMediaMetadataMutation.mutate({
                                            siteId: selectedSiteId,
                                            mediaId: m.id,
                                            label: editMediaLabel.trim() || m.label,
                                            altText: editMediaAlt.trim() || m.label,
                                            newUrl:
                                              newUrl && newUrl !== oldUrl ? newUrl : undefined,
                                          });
                                        }}
                                      >
                                        Enregistrer & Mettre à jour dans les pages
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Aucun média ne correspond à votre filtre dans la médiathèque de ce projet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ESPACE 4 : CALQUES */}
                {activeLibraryTab === "calques" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <Layers className="h-4 w-4 text-[#9b563e]" />
                        Sections de la page ({layers.length})
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => refreshLayersFromEditor(editorRef.current)}
                      >
                        Actualiser
                      </Button>
                    </div>
                    {layers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                        <p>Aucune section détectée ou l’éditeur est vide.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => setActiveLibraryTab("blocs")}
                        >
                          Ajouter un bloc à la page
                        </Button>
                      </div>
                    ) : (
                      layers.map((layer, index) => (
                        <div
                          key={layer.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <div className="truncate">
                            <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                              {layer.tagName}
                            </span>
                            <strong className="text-[#172033]">{layer.label}</strong>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "up")}
                              className="rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                              title="Monter la section"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "down")}
                              className="rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                              title="Descendre la section"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "lock")}
                              className="rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                              title="Verrouiller / Déverrouiller"
                            >
                              {layer.locked ? (
                                <Lock className="h-3.5 w-3.5 text-amber-600" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "hide")}
                              className="rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                              title="Masquer / Afficher"
                            >
                              {layer.hidden ? (
                                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "duplicate")}
                              className="rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                              title="Dupliquer la section"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "delete")}
                              className="rounded p-1 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                              title="Supprimer la section"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ESPACE 5 : MODULES FONCTIONNELS */}
                {activeLibraryTab === "modules" && (
                  <div className="space-y-3">
                    {/* Filtres par catégorie de module */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModuleCategoryFilter("all")}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          moduleCategoryFilter === "all"
                            ? "bg-[#172033] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Tous ({INDEPENDENT_BUILDER_MODULES.length})
                      </button>
                      {INDEPENDENT_MODULE_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setModuleCategoryFilter(cat)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            moduleCategoryFilter === cat
                              ? "bg-[#7c3f2c] text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {filteredModules.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                        <p>Aucun module ne correspond à votre recherche.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            setLibrarySearch("");
                            setModuleCategoryFilter("all");
                          }}
                        >
                          Afficher tous les modules
                        </Button>
                      </div>
                    ) : (
                      filteredModules.map((mod) => (
                        <div
                          key={mod.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#9b563e]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b563e]">
                              {mod.category}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Module fonctionnel
                            </Badge>
                          </div>
                          <h4 className="mt-0.5 text-xs font-bold text-[#172033]">{mod.label}</h4>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                            {mod.description}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2.5 h-7 w-full border-[#e2dad0] text-xs font-semibold hover:border-[#9b563e] hover:text-[#9b563e]"
                            onClick={() => insertHtmlIntoCanvas(mod.html, mod.label)}
                          >
                            + Ajouter ce module à la page
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ESPACE 6 : SOCLES DE PAGES (Chantiers 2 & 4) */}
                {activeLibraryTab === "socles" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSocleTypeFilter("all")}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          socleTypeFilter === "all"
                            ? "bg-[#172033] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Tous ({INDEPENDENT_PAGE_SOCLES.length})
                      </button>
                      {INDEPENDENT_SITE_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSocleTypeFilter(opt.value)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            socleTypeFilter === opt.value
                              ? "bg-teal-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {filteredSocles.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                        <p>Aucun socle de page ne correspond à ce filtre.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            setLibrarySearch("");
                            setSocleTypeFilter("all");
                          }}
                        >
                          Afficher tous les socles
                        </Button>
                      </div>
                    ) : (
                      filteredSocles.map((socle) => (
                        <div
                          key={socle.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-teal-700"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-xs text-[#172033]">{socle.label}</strong>
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                              {socle.defaultSlug}
                            </code>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                            {socle.description}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2.5 h-7 w-full text-xs font-semibold"
                            onClick={() => requestApplySocleToCurrentPage(socle.id)}
                          >
                            Remplacer la page active par ce socle
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ESPACE 7 : 10 MODÈLES DE SITES COMPLETS (Chantiers 2 & 4) */}
                {activeLibraryTab === "modeles" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTemplateTypeFilter("all")}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          templateTypeFilter === "all"
                            ? "bg-[#172033] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Tous ({INDEPENDENT_SITE_TEMPLATES.length})
                      </button>
                      {INDEPENDENT_SITE_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTemplateTypeFilter(opt.value)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            templateTypeFilter === opt.value
                              ? "bg-[#9b563e] text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                        <p>Aucun modèle ne correspond à ce filtre.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            setLibrarySearch("");
                            setTemplateTypeFilter("all");
                          }}
                        >
                          Afficher les {INDEPENDENT_SITE_TEMPLATES.length} modèles
                        </Button>
                      </div>
                    ) : (
                      filteredTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-[#172033]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge className="bg-[#172033] text-white">{tpl.siteType}</Badge>
                            <span className="text-xs font-semibold text-[#9b563e]">
                              {tpl.pages.length} pages · Menu inclus
                            </span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-[#172033]">{tpl.name}</h4>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {tpl.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tpl.pages.map((p) => (
                              <span
                                key={p.id}
                                className="rounded bg-[#faf8f5] px-1.5 py-0.5 text-[10px] text-slate-600"
                              >
                                {p.title}
                              </span>
                            ))}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-3 w-full bg-[#172033] text-xs font-semibold text-white hover:bg-[#263653]"
                            onClick={() => requestApplyTemplateToSite(tpl.id)}
                          >
                            <Palette className="mr-1.5 h-3.5 w-3.5 text-[#f5b98f]" />
                            Utiliser ce modèle complet
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* ZONE 2 & ZONE 3 — CANVAS CENTRAL GRAPESJS + INSPECTEUR (SEO, PUBLICATION & DOMAINE, VERSIONS) */}
          <div className="space-y-5 xl:col-span-8">
            {/* ZONE 2 — CANVAS VISUEL GRAPESJS */}
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9b563e]">
                        2. Canevas visuel de la page
                      </span>
                      <Badge variant="outline" className="border-[#e2dad0] bg-[#faf8f5] text-xs">
                        {currentDevicePreset.label} ({currentDevicePreset.shortLabel})
                      </Badge>
                    </div>
                    <CardTitle className="mt-0.5 text-base text-[#172033]">
                      {siteTitle} — Page « {activePage?.title} »
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Double-cliquez sur un texte ou une image dans la page pour le modifier directement, ou utilisez la bibliothèque à gauche.
                    </CardDescription>
                  </div>

                  {/* Navigation directe entre les pages du site au-dessus du canvas */}
                  <div className="flex flex-wrap items-center gap-1">
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPage(p.id)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                          activePage?.id === p.id
                            ? "bg-[#172033] text-white"
                            : "bg-[#faf8f5] text-slate-700 hover:bg-[#ece5dc]"
                        }`}
                      >
                        {p.parentPageId ? `↳ ${p.title}` : p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="bg-[#efebe4] p-3 md:p-4">
                {sideBySidePreview && (
                  <div className="space-y-3" data-testid="side-by-side-preview">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dfd6ca] bg-white px-4 py-2.5 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-[#172033]">
                        <Columns2 className="h-4 w-4 text-[#9b563e]" />
                        <span>Comparaison simultanée · Ordinateur + Mobile ({activePage?.title || "Page"})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => syncCurrentEditorToPageState()}
                          className="h-8 border-[#e2dad0] text-xs"
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Actualiser
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSideBySidePreview(false)}
                          className="h-8 bg-[#172033] text-xs text-white hover:bg-[#24324d]"
                        >
                          Revenir à l’éditeur
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_395px]">
                      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <Laptop className="h-3.5 w-3.5 text-[#172033]" />
                            Ordinateur
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">1280 px</span>
                        </div>
                        <iframe
                          title="Aperçu simultané ordinateur"
                          srcDoc={sideBySideSrcDoc}
                          sandbox="allow-same-origin"
                          className="h-[660px] w-full bg-white"
                        />
                      </div>

                      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <Smartphone className="h-3.5 w-3.5 text-[#9b563e]" />
                            Mobile
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">375 px</span>
                        </div>
                        <div className="flex flex-1 justify-center bg-slate-100/80 p-2.5">
                          <iframe
                            title="Aperçu simultané mobile"
                            srcDoc={sideBySideSrcDoc}
                            sandbox="allow-same-origin"
                            className="h-[640px] w-[375px] max-w-full rounded-lg border border-slate-300 bg-white shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  ref={canvasHostRef}
                  className={
                    sideBySidePreview
                      ? "hidden"
                      : "w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md"
                  }
                >
                  <GjsEditor
                    grapesjs={grapesjs}
                    options={{
                      height: "700px",
                      storageManager: false,
                      noticeOnUnload: false,
                      avoidInlineStyle: false,
                      forceClass: false,
                      deviceManager: {
                        default: "desktop",
                        devices: RESPONSIVE_DEVICE_PRESETS.map((preset) => ({
                          id: preset.id,
                          name: preset.shortLabel,
                          width: `${preset.maxWidthPx}px`,
                          widthMedia: `${preset.maxWidthPx}px`,
                        })),
                      },
                    }}
                    onEditor={(editor) => {
                      editorRef.current = editor;
                      const dm = editor.DeviceManager;
                      dm.getDevices()
                        .slice()
                        .forEach((device) => dm.remove(device));
                      RESPONSIVE_DEVICE_PRESETS.forEach((preset) => {
                        dm.add({
                          id: preset.id,
                          name: preset.shortLabel,
                          width: `${preset.maxWidthPx}px`,
                          widthMedia: `${preset.maxWidthPx}px`,
                        });
                      });
                      const bm = editor.BlockManager;
                      INDEPENDENT_BUILDER_BLOCKS.forEach((blk) => {
                        bm.add(blk.id, {
                          label: blk.label,
                          category: blk.category,
                          content: blk.content,
                        });
                      });
                      INDEPENDENT_BUILDER_MODULES.forEach((mod) => {
                        bm.add(mod.id, {
                          label: mod.label,
                          category: `Modules · ${mod.category}`,
                          content: mod.html,
                        });
                      });
                      if (activePageRef.current) {
                        syncCanvasPage(editor, activePageRef.current);
                      }
                      syncCanvasDeviceAndZoom(editor, devicePresetRef.current);
                      editor.on("load", () => {
                        if (activePageRef.current) {
                          syncCanvasPage(editor, activePageRef.current);
                        } else {
                          applyCanvasBaseStyleSheet(editor);
                        }
                        syncCanvasDeviceAndZoom(editor, devicePresetRef.current);
                        refreshLayersFromEditor(editor);
                      });
                      editor.on("canvas:load", () => {
                        applyCanvasBaseStyleSheet(editor);
                        syncCanvasDeviceAndZoom(editor, devicePresetRef.current);
                        refreshLayersFromEditor(editor);
                      });
                      editor.on("canvas:frame:load", () => {
                        applyCanvasBaseStyleSheet(editor);
                        syncCanvasDeviceAndZoom(editor, devicePresetRef.current);
                      });
                      editor.on("device:select", (deviceModel) => {
                        const selectedId = (deviceModel?.get?.("id") ?? deviceModel?.id) as
                          | ResponsiveDevicePresetId
                          | undefined;
                        if (
                          selectedId &&
                          RESPONSIVE_DEVICE_PRESETS.some((p) => p.id === selectedId) &&
                          selectedId !== devicePresetRef.current
                        ) {
                          handleSelectDevicePreset(selectedId);
                        }
                        syncCanvasDeviceAndZoom(editor, selectedId || devicePresetRef.current);
                      });
                      editor.on("component:update", () => {
                        if (isSyncingCanvasRef.current) return;
                        setHasUnsavedChanges(true);
                      });
                      editor.on("component:add", () => {
                        if (isSyncingCanvasRef.current) return;
                        setHasUnsavedChanges(true);
                        refreshLayersFromEditor(editor);
                      });
                      editor.on("component:remove", () => {
                        if (isSyncingCanvasRef.current) return;
                        setHasUnsavedChanges(true);
                        refreshLayersFromEditor(editor);
                      });
                      refreshLayersFromEditor(editor);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ZONE 3 — RÉGLAGES & SEO (Chantier 8), PUBLICATION & DOMAINE (Chantier 7), VERSIONS & HISTORIQUE (Chantier 6) */}
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9b563e]">
                      3. Réglages, Référencement (SEO), Publication & Historique
                    </span>
                    <CardTitle className="mt-0.5 text-base text-[#172033]">
                      Paramètres de la page « {activePage?.title} » et du site « {siteTitle} »
                    </CardTitle>
                  </div>

                  {/* Onglets de la zone 3 */}
                  <div
                    role="tablist"
                    aria-label="Réglages, Publication et Versions"
                    className="flex flex-wrap gap-1.5 rounded-lg border border-[#e2dad0] bg-[#faf8f5] p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeInspectorTab === "seo"}
                      onClick={() => setActiveInspectorTab("seo")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                        activeInspectorTab === "seo"
                          ? "bg-[#172033] text-white"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <Settings2 className="h-3.5 w-3.5 text-[#f5b98f]" />
                      Réglages & SEO de la page
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeInspectorTab === "qualite"}
                      onClick={() => setActiveInspectorTab("qualite")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                        activeInspectorTab === "qualite"
                          ? "bg-[#172033] text-white"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#f5b98f]" />
                      Qualité du site & Checklist ({qualityReport.overallScore100}/100)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeInspectorTab === "publication"}
                      disabled={!canAdministerSite}
                      title={
                        !canAdministerSite
                          ? "Section réservée à l’Administrateur ou au Propriétaire du site"
                          : undefined
                      }
                      onClick={() => canAdministerSite && setActiveInspectorTab("publication")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] disabled:cursor-not-allowed disabled:opacity-55 ${
                        activeInspectorTab === "publication"
                          ? "bg-[#172033] text-white"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5 text-[#f5b98f]" />
                      Publication, Domaine & Partage
                      {!canAdministerSite && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          Admin
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeInspectorTab === "versions"}
                      disabled={!canAdministerSite}
                      title={
                        !canAdministerSite
                          ? "Section réservée à l’Administrateur ou au Propriétaire du site"
                          : undefined
                      }
                      onClick={() => canAdministerSite && setActiveInspectorTab("versions")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] disabled:cursor-not-allowed disabled:opacity-55 ${
                        activeInspectorTab === "versions"
                          ? "bg-[#172033] text-white"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <History className="h-3.5 w-3.5 text-[#f5b98f]" />
                      Versions & Import/Export ({versionsQuery.data?.length ?? 0})
                      {!canAdministerSite && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          Admin
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeInspectorTab === "access"}
                      onClick={() => setActiveInspectorTab("access")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e] ${
                        activeInspectorTab === "access"
                          ? "bg-[#172033] text-white"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5 text-[#f5b98f]" />
                      Accès, Rôles & Livraison client
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* ONGLET 3A : RÉGLAGES & SEO DE LA PAGE ACTIVE (Chantier 8) */}
                {activeInspectorTab === "seo" && activePage && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                        Informations & Référencement Google (SEO)
                      </h3>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Nom de la page
                          </label>
                          <input
                            type="text"
                            value={activePage.title}
                            onChange={(e) => updateActivePageFields({ title: e.target.value })}
                            className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Slug / Chemin URL
                          </label>
                          <input
                            type="text"
                            value={activePage.slug}
                            onChange={(e) =>
                              updateActivePageFields({
                                slug: normalizeIndependentPageSlug(e.target.value),
                              })
                            }
                            className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700">
                            Titre SEO (affiché dans Google et l’onglet du navigateur)
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {(activePage.seoTitle || "").length} / 60 conseillés
                          </span>
                        </div>
                        <input
                          type="text"
                          value={activePage.seoTitle}
                          onChange={(e) => updateActivePageFields({ seoTitle: e.target.value })}
                          placeholder={`${activePage.title} | ${siteTitle}`}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700">
                            Description SEO (résumé sous le lien dans Google)
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {(activePage.seoDescription || "").length} / 160 conseillés
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={activePage.seoDescription}
                          onChange={(e) =>
                            updateActivePageFields({ seoDescription: e.target.value })
                          }
                          placeholder="Décrivez en une ou deux phrases claires le sujet de cette page…"
                          className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Image de partage social (OpenGraph)
                          </label>
                          <input
                            type="text"
                            value={activePage.socialImageUrl || ""}
                            onChange={(e) =>
                              updateActivePageFields({ socialImageUrl: e.target.value })
                            }
                            placeholder="https://... (optionnel)"
                            className="mt-1 h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Visibilité de la page
                          </label>
                          <select
                            value={activePage.visibility}
                            onChange={(e) =>
                              updateActivePageFields({
                                visibility: e.target.value as "public" | "members" | "private",
                              })
                            }
                            className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="public">Publique (tout le monde)</option>
                            <option value="members">Membres uniquement</option>
                            <option value="private">Privée (brouillon masqué)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={activePage.indexable !== false}
                            onChange={(e) =>
                              updateActivePageFields({ indexable: e.target.checked })
                            }
                          />
                          Autoriser Google à indexer cette page (Indexable)
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={activePage.showInMenu}
                            onChange={(e) =>
                              updateActivePageFields({ showInMenu: e.target.checked })
                            }
                          />
                          Afficher dans le menu du site
                        </label>
                      </div>
                    </div>

                    {/* Aperçu Google & Audit des textes alternatifs d'images */}
                    <div className="space-y-4">
                      {seoPreview && (
                        <div className="rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#172033]">
                              Aperçu dans les résultats Google
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                seoPreview.robotsDirective === "index, follow"
                                  ? "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
                                  : "border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                              }
                            >
                              {seoPreview.robotsDirective === "index, follow"
                                ? "Indexable"
                                : "Non indexée (noindex)"}
                            </Badge>
                          </div>
                          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                            <p className="truncate text-xs text-emerald-700">
                              {seoPreview.canonicalUrl}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-[#1a0dab]">
                              {seoPreview.displayTitle}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                              {seoPreview.displayDescription}
                            </p>
                          </div>
                          {activePageSeoAudit && (
                            <div className="mt-2.5 space-y-1.5 text-[11px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="bg-white text-[10px]">
                                  Balises H1 : {activePageSeoAudit.h1Count}
                                </Badge>
                                <Badge variant="outline" className="bg-white text-[10px]">
                                  Images sans alt : {activePageSeoAudit.imagesMissingAlt}/
                                  {activePageSeoAudit.imagesTotal}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    activePageSeoAudit.isContentEmpty
                                      ? "border-rose-300 bg-rose-50 text-[10px] text-rose-900"
                                      : "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                                  }
                                >
                                  {activePageSeoAudit.isContentEmpty
                                    ? "Contenu vide"
                                    : "Contenu éditorial présent"}
                                </Badge>
                              </div>
                              {activePageSeoAudit.blockingErrors.length > 0 && (
                                <div className="rounded border border-rose-300 bg-rose-50 p-2 text-rose-950">
                                  <strong>Erreurs bloquantes SEO :</strong>
                                  <ul className="mt-0.5 space-y-0.5">
                                    {activePageSeoAudit.blockingErrors.map((err) => (
                                      <li key={err.id}>• {err.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {activePageSeoAudit.warningsToFix.length > 0 && (
                                <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-950">
                                  <strong>Points SEO à corriger :</strong>
                                  <ul className="mt-0.5 space-y-0.5">
                                    {activePageSeoAudit.warningsToFix.map((w) => (
                                      <li key={w.id}>• {w.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {activePageSeoAudit.recommendations.length > 0 && (
                                <div className="rounded border border-sky-200 bg-sky-50 p-2 text-sky-950">
                                  <strong>Conseils d’optimisation :</strong>
                                  <ul className="mt-0.5 space-y-0.5">
                                    {activePageSeoAudit.recommendations.map((rec) => (
                                      <li key={rec.id}>• {rec.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Édition rapide du texte alternatif (alt) des images de la page active */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#172033]">
                            Texte alternatif (alt) des images de la page ({activePageImages.length})
                          </h4>
                          <span className="text-[11px] text-slate-500">Accessibilité & SEO</span>
                        </div>
                        {activePageImages.length === 0 ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Aucune balise image détectée sur cette page pour le moment.
                          </p>
                        ) : (
                          <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                            {activePageImages.map((img) => (
                              <div
                                key={`${img.index}-${img.src.slice(0, 24)}`}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#faf8f5] p-2 text-xs"
                              >
                                <img
                                  src={img.src}
                                  alt={img.alt || "Aperçu"}
                                  className="h-9 w-12 shrink-0 rounded border border-slate-200 bg-white object-cover"
                                />
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={img.alt}
                                    onChange={(e) =>
                                      handleUpdateImageAltOnActivePage(img.index, e.target.value)
                                    }
                                    placeholder="Décrivez cette image pour les moteurs et lecteurs d’écran…"
                                    aria-label={`Texte alternatif de l'image ${img.index + 1}`}
                                    className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ONGLET 3B : QUALITÉ DU SITE, CHECKLIST AVANT PUBLICATION (14 POINTS), ACCESSIBILITÉ & RESPONSIVE */}
                {activeInspectorTab === "qualite" && (
                  <div className="space-y-5">
                    {/* Synthèse Qualité du site & Score explicable */}
                    <div className="grid gap-4 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#9b563e]">
                          Score global explicable
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-[#172033]">
                            {qualityReport.overallScore100}/100
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              qualityReport.canPublish
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-rose-400 bg-rose-50 text-rose-900"
                            }
                          >
                            {qualityReport.canPublish
                              ? "Prêt à être publié"
                              : `${qualityReport.blockingIssuesCount} erreur(s) bloquante(s)`}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{qualityReport.scoreExplanation}</p>
                        {qualityReport.demoStatus.hasUnchangedDemoMarkers && (
                          <div className="mt-2 rounded-lg border border-amber-400 bg-amber-50 p-2 text-xs text-amber-950">
                            <strong>{qualityReport.demoStatus.badgeLabel} :</strong>{" "}
                            {qualityReport.demoStatus.noticeMessage}
                          </div>
                        )}
                      </div>

                      {/* Répartition par pilier */}
                      <div className="space-y-1.5 text-xs">
                        <strong className="text-[#172033]">Détail des 6 piliers du score :</strong>
                        <ul className="space-y-1 text-slate-700">
                          <li className="flex justify-between">
                            <span>• SEO & Métadonnées :</span>
                            <strong>{qualityReport.scoreBreakdown.seoScore100}/100</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>• Accessibilité (3 niveaux) :</span>
                            <strong>{qualityReport.scoreBreakdown.accessibilityScore100}/100</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>• Vérification Responsive :</span>
                            <strong>{qualityReport.scoreBreakdown.responsiveScore100}/100</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>• Navigation & Liens :</span>
                            <strong>{qualityReport.scoreBreakdown.navigationScore100}/100</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>• Médias & Textes alt :</span>
                            <strong>{qualityReport.scoreBreakdown.mediaScore100}/100</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>• Sécurité & Périmètre :</span>
                            <strong>{qualityReport.scoreBreakdown.securityScore100}/100</strong>
                          </li>
                        </ul>
                      </div>

                      {/* Statuts synthétiques des 6 domaines */}
                      <div className="space-y-1.5 text-xs">
                        <strong className="text-[#172033]">États de contrôle du projet :</strong>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">Responsive</span>
                            <strong className="text-[#172033]">
                              {qualityReport.responsiveAudit.criticalCount === 0
                                ? "✓ Conforme"
                                : "⚠ À vérifier"}
                            </strong>
                          </div>
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">SEO</span>
                            <strong className="text-[#172033]">
                              {qualityReport.scoreBreakdown.seoScore100 >= 85
                                ? "✓ Conforme"
                                : qualityReport.scoreBreakdown.seoScore100 >= 60
                                  ? "⚠ À corriger"
                                  : "✕ Bloquant"}
                            </strong>
                          </div>
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">Accessibilité</span>
                            <strong className="text-[#172033]">
                              {qualityReport.accessibilityAudit.blockingCount === 0 &&
                              qualityReport.accessibilityAudit.toFixCount === 0
                                ? "✓ Conforme"
                                : qualityReport.accessibilityAudit.blockingCount === 0
                                  ? "⚠ À corriger"
                                  : "✕ Bloquant"}
                            </strong>
                          </div>
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">Médias</span>
                            <strong className="text-[#172033]">
                              {qualityReport.scoreBreakdown.mediaScore100 === 100
                                ? "✓ Conforme"
                                : "⚠ À optimiser"}
                            </strong>
                          </div>
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">Navigation</span>
                            <strong className="text-[#172033]">
                              {qualityReport.brokenLinksReport.valid
                                ? "✓ Conforme"
                                : "✕ Liens à corriger"}
                            </strong>
                          </div>
                          <div className="rounded border border-slate-200 bg-white p-2">
                            <span className="block text-[10px] text-slate-500">Publication</span>
                            <strong className="text-[#172033]">
                              {qualityReport.publicationStatusLabel}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Checklist avant publication en 14 points */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                          Checklist avant publication ({qualityReport.checklist.length} contrôles)
                        </h3>
                        <span className="text-xs text-slate-500">
                          La publication est bloquée uniquement si un point critique (Bloquant) échoue.
                        </span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {qualityReport.checklist.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 text-xs ${
                              item.passed
                                ? "border-emerald-200 bg-emerald-50/40"
                                : item.blocking
                                  ? "border-rose-300 bg-rose-50"
                                  : "border-amber-300 bg-amber-50/70"
                            }`}
                          >
                            <div>
                              <strong className="text-[#172033]">
                                {item.passed ? "✓ " : item.blocking ? "✕ " : "⚠ "}
                                {item.label}
                              </strong>
                              <p className="mt-0.5 text-[11px] text-slate-600">{item.detail}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] ${
                                item.passed
                                  ? "border-emerald-300 bg-white text-emerald-800"
                                  : item.blocking
                                    ? "border-rose-400 bg-white font-bold text-rose-900"
                                    : "border-amber-400 bg-white text-amber-900"
                              }`}
                            >
                              {item.passed
                                ? "Validé"
                                : item.blocking
                                  ? "Bloquant"
                                  : "Recommandation"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contrôle Accessibilité (3 niveaux : Bloquant / À corriger / Conseil) & Vérification Responsive */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Contrôle Accessibilité (Contraste, Alt, Titres, Clavier, Formulaires)
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="border-rose-300 bg-rose-50 text-[10px] text-rose-900">
                              Bloquant : {qualityReport.accessibilityAudit.blockingCount}
                            </Badge>
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-900">
                              À corriger : {qualityReport.accessibilityAudit.toFixCount}
                            </Badge>
                            <Badge variant="outline" className="border-sky-300 bg-sky-50 text-[10px] text-sky-900">
                              Conseil : {qualityReport.accessibilityAudit.adviceCount}
                            </Badge>
                          </div>
                        </div>
                        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs">
                          {qualityReport.accessibilityAudit.issues.map((iss) => (
                            <div
                              key={iss.id}
                              className={`rounded-lg border p-2.5 ${
                                iss.level === "Bloquant"
                                  ? "border-rose-300 bg-rose-50 text-rose-950"
                                  : iss.level === "À corriger"
                                    ? "border-amber-300 bg-amber-50 text-amber-950"
                                    : "border-sky-200 bg-sky-50 text-sky-950"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <strong>{iss.category} ({iss.pageSlug})</strong>
                                <Badge variant="outline" className="bg-white text-[10px] font-bold">
                                  {iss.level}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-[11px]">{iss.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Vérification Responsive (Desktop, Tablette, Mobile, 320px)
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              qualityReport.responsiveAudit.criticalCount === 0
                                ? "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                                : "border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                            }
                          >
                            {qualityReport.responsiveAudit.criticalCount === 0 &&
                            qualityReport.responsiveAudit.warningCount === 0
                              ? "Tous formats validés"
                              : `${qualityReport.responsiveAudit.issues.length} alerte(s)`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {qualityReport.responsiveAudit.checkedViewports.map((vp) => (
                            <Badge key={vp.id} variant="outline">
                              {vp.label} : {vp.passed ? "✓" : "⚠"}
                            </Badge>
                          ))}
                        </div>
                        {qualityReport.responsiveAudit.issues.length === 0 ? (
                          <p className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-950">
                            ✓ Aucun débordement horizontal, aucune image trop large ni texte coupé détecté sur desktop, tablette, mobile et 320px.
                          </p>
                        ) : (
                          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
                            {qualityReport.responsiveAudit.issues.map((ri) => (
                              <div
                                key={ri.id}
                                className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-950"
                              >
                                <div className="flex items-center justify-between">
                                  <strong>{ri.category} ({ri.pageSlug})</strong>
                                  <Badge variant="outline" className="bg-white text-[10px]">
                                    {ri.severity}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 text-[11px]">{ri.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ONGLET 3C : PUBLICATION, DÉPUBLICATION, JOURNAL, COLLABORATION CONTRÔLÉE & DOMAINE PERSONNALISÉ */}
                {activeInspectorTab === "publication" && (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Étapes 1 & 2 : Aperçu, Publication et Dépublication du site */}
                      <div className="space-y-3 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Étape 1 & 2 — Vérifier l’aperçu, publier ou dépublier
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              siteStatus === "published"
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-amber-400 bg-amber-50 text-amber-950"
                            }
                          >
                            {siteStatus === "published" ? "Site en ligne (Publié)" : "En brouillon"}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600">
                          Tant que votre site est en <strong>Brouillon</strong>, il n’apparaît jamais sur l’URL publique <code>/sites/{siteSlug}</code>. La publication vérifie la checklist en 14 points et demande une confirmation explicite.
                        </p>

                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                          <p className="font-semibold text-[#172033]">Adresses du site :</p>
                          <p className="mt-1 text-slate-600">
                            • Aperçu privé éditeur :{" "}
                            <code className="text-[#9b563e]">
                              /constructeur-sites/apercu/{siteSlug}
                            </code>
                          </p>
                          <p className="mt-0.5 text-slate-600">
                            • Adresse publique :{" "}
                            <code className="text-emerald-700">/sites/{siteSlug}</code>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            href={`/constructeur-sites/apercu/${
                              siteSlug || "association-familiale-ath-vahloul"
                            }`}
                          >
                            <Button type="button" variant="outline" size="sm" className="text-xs">
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              1. Ouvrir l’aperçu privé
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#172033] text-xs text-white hover:bg-[#24324f]"
                            onClick={requestPublishCurrentSite}
                            disabled={isBusySaving || !canAdministerSite}
                            title={!canAdministerSite ? "Publication réservée aux administrateurs du site" : undefined}
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#f5b98f]" />
                            2. Publier le site maintenant
                          </Button>
                          {siteStatus === "published" && selectedSiteId && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-rose-300 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={requestUnpublishCurrentSite}
                              disabled={unpublishSiteMutation.isPending || !canAdministerSite}
                              title={!canAdministerSite ? "Publication réservée aux administrateurs du site" : undefined}
                            >
                              Dépublier (repasser en brouillon)
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Étape 3 : Domaine personnalisé & Vérification DNS TXT réelle */}
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#172033]">
                            <ShieldCheck className="h-4 w-4 text-emerald-700" />
                            Étape 3 — Domaine personnalisé & DNS TXT
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            {domainsQuery.data && domainsQuery.data.length > 0
                              ? `${domainsQuery.data.length} domaine(s)`
                              : "Domaine non configuré"}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600">
                          Rattachez votre propre nom de domaine (ex.{" "}
                          <code>association-ath-vahloul.org</code>). Un domaine n’est jamais marqué actif sans preuve réelle de l’enregistrement DNS TXT.
                        </p>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customDomainInput}
                            onChange={(e) => setCustomDomainInput(e.target.value)}
                            placeholder="Ex. association-ath-vahloul.org"
                            className="h-8 flex-1 rounded border border-slate-300 px-2.5 text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-[#9b563e] text-xs text-white hover:bg-[#824631]"
                            disabled={!selectedSiteId || !customDomainInput.trim() || !canManageDomains}
                            onClick={() => {
                              if (!selectedSiteId) return;
                              addDomainMutation.mutate({
                                siteId: selectedSiteId,
                                hostname: customDomainInput.trim(),
                              });
                            }}
                          >
                            Rattacher ce domaine
                          </Button>
                        </div>

                        {!selectedSiteId && (
                          <p className="text-[11px] text-amber-800">
                            Enregistrez d’abord votre site une première fois pour rattacher un nom de domaine personnalisé.
                          </p>
                        )}

                        {domainsQuery.data && domainsQuery.data.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            {domainsQuery.data.map((dom) => {
                              const statusLabel =
                                dom.verificationStatus === "active" && dom.sslStatus === "active"
                                  ? "SSL actif"
                                  : dom.verificationStatus === "verified"
                                    ? "Vérifié (SSL en attente)"
                                    : "En attente de DNS TXT";
                              return (
                                <div
                                  key={dom.id}
                                  className="rounded-lg border border-slate-200 bg-[#faf8f5] p-3 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <strong className="text-[#172033]">{dom.hostname}</strong>
                                    <Badge
                                      variant="outline"
                                      className={
                                        dom.verificationStatus === "verified" ||
                                        dom.verificationStatus === "active"
                                          ? "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                                          : "border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                                      }
                                    >
                                      {statusLabel}
                                    </Badge>
                                  </div>

                                  <div className="mt-2 rounded border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
                                    <p className="font-semibold text-[#172033]">
                                      Instructions DNS simples (chez votre bureau d’enregistrement) :
                                    </p>
                                    <p className="mt-1">
                                      1. Créez un enregistrement de type <strong>TXT</strong>
                                    </p>
                                    <p>
                                      2. Nom / Hôte :{" "}
                                      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                                        {dom.dnsRecordName}
                                      </code>
                                    </p>
                                    <p>
                                      3. Valeur :{" "}
                                      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                                        {dom.dnsRecordValue}
                                      </code>
                                    </p>
                                  </div>

                                  <div className="mt-2 flex items-center gap-3">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 border-emerald-600 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                                      disabled={verifyDomainMutation.isPending}
                                      onClick={() => {
                                        if (!selectedSiteId) return;
                                        verifyDomainMutation.mutate({
                                          siteId: selectedSiteId,
                                          domainId: dom.id,
                                        });
                                      }}
                                    >
                                      Vérifier DNS maintenant
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!selectedSiteId) return;
                                        setPendingConfirmAction({
                                          title: `Supprimer le domaine ${dom.hostname} ?`,
                                          description: `Le domaine personnalisé ${dom.hostname} sera détaché de ce site.`,
                                          confirmLabel: "Supprimer le domaine",
                                          variant: "danger",
                                          onConfirm: () =>
                                            removeDomainMutation.mutate({
                                              siteId: selectedSiteId,
                                              domainId: dom.id,
                                            }),
                                        });
                                      }}
                                      className="text-xs font-semibold text-rose-600 hover:underline"
                                    >
                                      Retirer ce domaine
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                            Aucun domaine personnalisé rattaché pour le moment (état :{" "}
                            <strong>Domaine non configuré</strong>). Votre site fonctionne déjà sur son adresse standard <code>/sites/{siteSlug}</code>.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collaboration contrôlée (Partage d'aperçu privé en lecture seule) & Journal de publication */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Collaboration contrôlée — Aperçu privé en lecture seule
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            Lecture seule · Sans accès aux autres projets
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          Invitez un collaborateur à relire l’aperçu privé du site avant publication. Aucune modification n’est autorisée et l’accès peut être révoqué à tout moment.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <input
                            type="text"
                            value={collabLabelInput}
                            onChange={(e) => setCollabLabelInput(e.target.value)}
                            placeholder="Nom ou e-mail du collaborateur (ex. Membre bureau)"
                            className="h-8 flex-1 rounded border border-slate-300 px-2.5 text-xs"
                          />
                          <select
                            aria-label="Durée de validité du lien collaborateur"
                            value={collabExpiresHours}
                            onChange={(e) => setCollabExpiresHours(Number(e.target.value))}
                            className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value={24}>Expire dans 24h</option>
                            <option value={72}>Expire dans 3 jours</option>
                            <option value={168}>Expire dans 7 jours</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-[#172033] text-xs text-white"
                            disabled={
                              !selectedSiteId ||
                              !collabLabelInput.trim() ||
                              createCollaboratorShareMutation.isPending
                            }
                            onClick={() => {
                              if (!selectedSiteId) return;
                              createCollaboratorShareMutation.mutate({
                                siteId: selectedSiteId,
                                collaboratorLabel: collabLabelInput.trim(),
                                expiresInHours: collabExpiresHours,
                              });
                            }}
                          >
                            Créer un lien d’aperçu
                          </Button>
                        </div>

                        {collaboratorSharesQuery.data && collaboratorSharesQuery.data.length > 0 ? (
                          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 text-xs">
                            {collaboratorSharesQuery.data.map((share) => (
                              <div
                                key={share.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-[#faf8f5] p-2.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <strong className="text-[#172033]">
                                    {share.collaboratorLabel}
                                  </strong>{" "}
                                  <span className="text-[10px] text-slate-500">
                                    ({share.revokedAt ? "Révoqué" : `Expire le ${new Date(share.expiresAt).toLocaleDateString("fr-FR")}`})
                                  </span>
                                  {!share.revokedAt && (
                                    <code className="mt-0.5 block truncate rounded bg-white px-1.5 py-0.5 text-[10px] text-[#9b563e]">
                                      {share.previewPath}
                                    </code>
                                  )}
                                </div>
                                {!share.revokedAt && selectedSiteId && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 border-rose-300 bg-white text-[11px] text-rose-700 hover:bg-rose-50"
                                    onClick={() =>
                                      revokeCollaboratorShareMutation.mutate({
                                        siteId: selectedSiteId,
                                        shareId: share.id,
                                      })
                                    }
                                  >
                                    Révoquer l’accès
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Aucun partage d’aperçu collaborateur actif pour ce site.
                          </p>
                        )}
                      </div>

                      {/* Journal de publication lisible */}
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Journal de publication & Dépublication ({publicationLogsQuery.data?.length ?? 0})
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            Traçabilité complète
                          </Badge>
                        </div>
                        {publicationLogsQuery.data && publicationLogsQuery.data.length > 0 ? (
                          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
                            {publicationLogsQuery.data.map((log) => (
                              <div
                                key={log.id}
                                className="rounded-lg border border-slate-200 bg-[#faf8f5] p-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-[#172033]">
                                    {log.action === "publish"
                                      ? "Publication en ligne"
                                      : log.action === "unpublish"
                                        ? "Dépublication (retour brouillon)"
                                        : "Restauration / Import"}
                                  </strong>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(log.createdAt).toLocaleString("fr-FR")} · {log.authorLabel}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-slate-600">
                                  {log.summary}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Aucune opération de publication enregistrée pour ce projet pour le moment.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ONGLET 3E : ACCÈS DU SITE, PRÉSENTATION DES RÔLES (OWNER, ADMIN, EDITOR) & PARCOURS DE LIVRAISON CLIENT */}
                {activeInspectorTab === "access" && (
                  <div className="space-y-6">
                    {/* 1. Résumé immédiat du site administré, du rôle actif et des actions principales */}
                    <div className="rounded-xl border border-[#d9dfcf] bg-[#f7f9f4] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-[#40552d] text-white">
                              Votre rôle actif : {currentRolePresentation.badgeLabel}
                            </Badge>
                            <Badge variant="outline" className="border-[#d9dfcf] bg-white text-[#172033]">
                              Site administré : « {siteTitle} »
                            </Badge>
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900">
                              Espace isolé des autres projets
                            </Badge>
                          </div>
                          <h3 className="pt-1 text-sm font-bold text-[#172033]">
                            {currentRolePresentation.title} — {currentRolePresentation.audienceSummary}
                          </h3>
                          <p className="text-xs text-slate-700">
                            {currentRolePresentation.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusySaving || !workflowSummary.canTriggerSave}
                            onClick={() => handleSaveCurrentProject()}
                            className="h-8 border-[#9b563e] bg-white text-xs font-semibold text-[#9b563e]"
                          >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Sauvegarder le brouillon
                          </Button>
                          <Link href={privatePreviewHref}>
                            <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-xs">
                              <Eye className="mr-1.5 h-3.5 w-3.5 text-[#9b563e]" />
                              Aperçu privé
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusySaving || !canAdministerSite}
                            onClick={requestPublishCurrentSite}
                            title={
                              !canAdministerSite
                                ? "Publication réservée à l’Administrateur ou au Propriétaire du site"
                                : undefined
                            }
                            className="h-8 bg-[#172033] text-xs text-white hover:bg-[#24324f] disabled:opacity-60"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#f5b98f]" />
                            {canAdministerSite ? "Publier le site" : "Publier (Réservé Admin)"}
                          </Button>
                          <Link href={`/sites/${siteSlug || "association-familiale-ath-vahloul"}`}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 border-[#40552d] bg-white text-xs font-semibold text-[#40552d] hover:bg-[#eef3e7]"
                            >
                              <Globe className="mr-1.5 h-3.5 w-3.5" />
                              Retour au site public (/sites/{siteSlug || "association-familiale-ath-vahloul"})
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 2. Présentation claire et non technique des 3 rôles (Owner, Admin, Editor) alignée sur le serveur */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                          Présentation des rôles d’accès au site (Propriétaire · Administrateur · Éditeur)
                        </h3>
                        <span className="text-xs text-slate-600">
                          Permissions contrôlées côté serveur et strictement limitées à ce site
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        {(["owner", "admin", "editor"] as const).map((roleKey) => {
                          const roleInfo = INDEPENDENT_SITE_ROLE_PRESENTATIONS[roleKey];
                          const isCurrentUserRole = accessRole === roleKey;
                          return (
                            <div
                              key={roleKey}
                              className={`flex flex-col justify-between rounded-xl border p-4 text-xs transition ${
                                isCurrentUserRole
                                  ? "border-2 border-[#40552d] bg-[#f7f9f4] shadow-xs"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <strong className="text-sm text-[#172033]">{roleInfo.title}</strong>
                                  {isCurrentUserRole && (
                                    <Badge className="bg-[#40552d] text-[10px] text-white">
                                      Votre rôle actuel
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-[#9b563e]">
                                  {roleInfo.audienceSummary}
                                </p>
                                <p className="leading-relaxed text-slate-600">{roleInfo.description}</p>

                                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                                  <p className="font-bold text-emerald-950">✓ Fonctions disponibles :</p>
                                  <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                                    {roleInfo.allowedActions.map((act) => (
                                      <li key={act}>• {act}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                  <p className="font-bold text-slate-800">• Fonctions non incluses :</p>
                                  <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                                    {roleInfo.restrictedActions.map((act) => (
                                      <li key={act}>• {act}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Invitation client & Gestion des membres (Propriétaire) ou Information en lecture seule (Admin/Éditeur) */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Inviter un client ou un membre sur « {siteTitle} »
                          </h3>
                          <Badge variant="outline" className="bg-white text-[10px]">
                            Lien à usage unique · Durée limitée
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600">
                          {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.isolationNotice}
                        </p>

                        {!selectedSiteId ? (
                          <div
                            role="status"
                            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"
                          >
                            Cliquez d’abord sur <strong>« Sauvegarder »</strong> en haut de la page pour enregistrer ce site avant d’inviter un membre ou un client.
                          </div>
                        ) : !canManageAccess ? (
                          <div
                            role="status"
                            className="rounded-lg border border-slate-300 bg-white p-3.5 text-xs text-slate-700"
                          >
                            <p className="font-bold text-[#172033]">
                              Gestion des invitations réservée au Propriétaire du site (Owner)
                            </p>
                            <p className="mt-1 text-slate-600">
                              Vous êtes connecté avec le rôle <strong>{currentRolePresentation.shortLabel}</strong>. Pour inviter une nouvelle personne, modifier un rôle ou révoquer un accès, contactez le propriétaire du site.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3.5">
                              <div>
                                <label
                                  htmlFor="independent-access-email-input"
                                  className="block text-xs font-semibold text-[#172033]"
                                >
                                  1. Adresse e-mail exacte de la personne invitée
                                </label>
                                <input
                                  id="independent-access-email-input"
                                  type="email"
                                  value={accessEmailInput}
                                  onChange={(e) => setAccessEmailInput(e.target.value)}
                                  placeholder="president@association-exemple.org"
                                  aria-label="Email du membre"
                                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Important : la personne invitée devra se connecter sur{" "}
                                  <code>/connexion-administration</code> avec cette adresse e-mail exacte.
                                </p>
                              </div>

                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <div>
                                  <label
                                    htmlFor="independent-access-role-select"
                                    className="block text-xs font-semibold text-[#172033]"
                                  >
                                    2. Rôle attribué
                                  </label>
                                  <select
                                    id="independent-access-role-select"
                                    value={accessRoleInput}
                                    onChange={(e) =>
                                      setAccessRoleInput(e.target.value as "admin" | "editor")
                                    }
                                    aria-label="Rôle du membre"
                                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                                  >
                                    <option value="admin">
                                      Administrateur (gère le contenu + publie en ligne)
                                    </option>
                                    <option value="editor">
                                      Éditeur (modifie le contenu en brouillon sans publier)
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label
                                    htmlFor="independent-access-duration-select"
                                    className="block text-xs font-semibold text-[#172033]"
                                  >
                                    3. Durée de validité du lien
                                  </label>
                                  <select
                                    id="independent-access-duration-select"
                                    value={accessExpiresHours}
                                    onChange={(e) => setAccessExpiresHours(Number(e.target.value))}
                                    aria-label="Durée de validité de l'invitation"
                                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                                  >
                                    <option value={24}>24 heures (1 jour)</option>
                                    <option value={72}>72 heures (3 jours — recommandé)</option>
                                    <option value={168}>7 jours (1 semaine)</option>
                                    <option value={720}>30 jours (livraison client étendue)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <span className="text-[11px] text-slate-600">
                                  Rôle choisi :{" "}
                                  <strong>
                                    {getIndependentSiteRolePresentation(accessRoleInput).title}
                                  </strong>
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[#172033] text-xs text-white hover:bg-[#24324f]"
                                  disabled={
                                    !selectedSiteId ||
                                    !accessEmailInput.trim() ||
                                    inviteAccessMutation.isPending
                                  }
                                  onClick={() =>
                                    selectedSiteId &&
                                    inviteAccessMutation.mutate({
                                      siteId: selectedSiteId,
                                      email: accessEmailInput.trim(),
                                      role: accessRoleInput,
                                      expiresInHours: accessExpiresHours,
                                    })
                                  }
                                >
                                  {inviteAccessMutation.isPending
                                    ? "Génération du lien…"
                                    : "Inviter et générer le lien d’accès"}
                                </Button>
                              </div>
                            </div>

                            {/* Carte lisible du lien d'invitation généré */}
                            {lastCreatedInvitation && (
                              <div
                                role="status"
                                className="space-y-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/90 p-3.5 text-xs text-emerald-950"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <strong className="flex items-center gap-1.5 text-emerald-950">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                                    Lien d’invitation prêt pour {lastCreatedInvitation.email}
                                  </strong>
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-400 bg-white text-[10px] text-emerald-900"
                                  >
                                    Rôle :{" "}
                                    {lastCreatedInvitation.role === "admin"
                                      ? "Administrateur (Admin)"
                                      : "Éditeur (Editor)"}
                                  </Badge>
                                </div>

                                <p className="text-[11px] text-emerald-900">
                                  • <strong>Site concerné :</strong> « {lastCreatedInvitation.siteTitle} » (
                                  <code>/sites/{siteSlug}</code>)<br />
                                  • <strong>E-mail obligatoire pour activer :</strong>{" "}
                                  <strong>{lastCreatedInvitation.email}</strong><br />
                                  • <strong>Valable jusqu’au :</strong>{" "}
                                  {new Date(lastCreatedInvitation.expiresAtIso).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  (usage unique)
                                </p>

                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-bold text-emerald-950">
                                    Lien d’activation à transmettre au client :
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={lastCreatedInvitation.invitationPath}
                                    aria-label="Lien d'invitation généré"
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="h-8 w-full rounded border border-emerald-300 bg-white px-2.5 font-mono text-[11px] text-[#172033]"
                                  />
                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 bg-emerald-800 text-[11px] text-white hover:bg-emerald-900"
                                      onClick={() => {
                                        if (
                                          typeof navigator !== "undefined" &&
                                          navigator.clipboard
                                        ) {
                                          void navigator.clipboard.writeText(
                                            lastCreatedInvitation.invitationPath
                                          );
                                          setCopiedInviteLink(true);
                                          setStatusBanner(
                                            `Lien d’invitation copié dans le presse-papiers pour ${lastCreatedInvitation.email}.`
                                          );
                                        }
                                      }}
                                    >
                                      {copiedInviteLink
                                        ? "✓ Lien copié !"
                                        : "Copier le lien d’invitation"}
                                    </Button>
                                    <span className="text-[11px] text-emerald-800">
                                      {lastCreatedInvitation.invitationDelivery === "delivered"
                                        ? "Un e-mail d’invitation a également été envoyé."
                                        : "Envoi d’e-mail non configuré : copiez et envoyez ce lien directement à votre client."}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Liste des membres et invitations du site */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#172033]">
                                  Membres et invitations sur ce site ({(accessQuery.data ?? []).length})
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                  Révocation immédiate à tout moment
                                </span>
                              </div>

                              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                                {(accessQuery.data ?? []).map((member) => {
                                  const memberRoleInfo = getIndependentSiteRolePresentation(
                                    member.role
                                  );
                                  const isExpiredInvite =
                                    member.status === "invited" &&
                                    Boolean(
                                      member.invitationExpiresAt &&
                                        new Date(member.invitationExpiresAt).getTime() <= Date.now()
                                    );
                                  const statusLabel =
                                    member.status === "active"
                                      ? "Accès actif"
                                      : member.status === "blocked"
                                        ? "Accès révoqué"
                                        : isExpiredInvite
                                          ? "Invitation expirée"
                                          : "Invitation en attente";

                                  return (
                                    <div
                                      key={member.id}
                                      className="flex flex-wrap items-center justify-between gap-2.5 p-3 text-xs"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <strong className="text-[#172033]">{member.email}</strong>
                                          <Badge
                                            variant="outline"
                                            className="border-slate-300 bg-slate-50 text-[10px] text-[#172033]"
                                          >
                                            {memberRoleInfo.badgeLabel}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className={
                                              member.status === "active"
                                                ? "border-emerald-300 bg-emerald-50 text-[10px] text-emerald-900"
                                                : member.status === "blocked" || isExpiredInvite
                                                  ? "border-rose-300 bg-rose-50 text-[10px] text-rose-900"
                                                  : "border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                                            }
                                          >
                                            {statusLabel}
                                          </Badge>
                                        </div>
                                        {member.status === "invited" && member.invitationExpiresAt && (
                                          <p className="text-[11px] text-slate-500">
                                            {isExpiredInvite ? "Expirée le " : "Valable jusqu’au "}
                                            {new Date(member.invitationExpiresAt).toLocaleString(
                                              "fr-FR",
                                              {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              }
                                            )}
                                          </p>
                                        )}
                                      </div>

                                      {member.role !== "owner" && (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <select
                                            aria-label={`Rôle de ${member.email}`}
                                            value={member.role}
                                            disabled={
                                              member.status === "blocked" ||
                                              updateAccessRoleMutation.isPending
                                            }
                                            onChange={(e) =>
                                              selectedSiteId &&
                                              updateAccessRoleMutation.mutate({
                                                siteId: selectedSiteId,
                                                memberId: member.id,
                                                role: e.target.value as "admin" | "editor",
                                              })
                                            }
                                            className="h-8 rounded border border-slate-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b563e]"
                                          >
                                            <option value="editor">Éditeur</option>
                                            <option value="admin">Administrateur</option>
                                          </select>
                                          {member.status !== "blocked" && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-8 border-rose-300 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                              onClick={() => {
                                                if (!selectedSiteId) return;
                                                setPendingConfirmAction({
                                                  title: `Révoquer l’accès de ${member.email} ?`,
                                                  description: `L’accès et toute invitation en attente pour ${member.email} sur le site « ${siteTitle} » seront immédiatement désactivés.`,
                                                  confirmLabel: "Confirmer la révocation",
                                                  variant: "danger",
                                                  onConfirm: () =>
                                                    revokeAccessMutation.mutate({
                                                      siteId: selectedSiteId,
                                                      memberId: member.id,
                                                    }),
                                                });
                                              }}
                                            >
                                              Révoquer
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {!accessQuery.isLoading && !(accessQuery.data?.length) && (
                                  <p className="p-4 text-xs text-slate-500">
                                    Aucun membre supplémentaire invité sur ce site pour le moment.
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 4. Parcours de livraison d'un site au client & Préparation du futur transfert de propriété */}
                      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.heading}
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            Remise client & Autonomie
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600">
                          {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.subtitle}
                        </p>

                        <div className="space-y-2.5">
                          {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.steps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="rounded-lg border border-slate-200 bg-[#faf8f5] p-3 text-xs"
                            >
                              <p className="font-bold text-[#172033]">
                                Étape {step.stepNumber} — {step.title}
                              </p>
                              <p className="mt-1 leading-relaxed text-slate-600">
                                {step.description}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Encadré de préparation du futur transfert de propriété (non destructif) */}
                        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-[#172033]">
                              {
                                INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE
                                  .ownershipTransferNotice.title
                              }
                            </strong>
                            <Badge
                              variant="outline"
                              className="border-amber-400 bg-white text-[10px] font-semibold text-amber-950"
                            >
                              {
                                INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE
                                  .ownershipTransferNotice.statusBadge
                              }
                            </Badge>
                          </div>
                          <p className="mt-1.5 leading-relaxed text-slate-700">
                            {
                              INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE
                                .ownershipTransferNotice.description
                            }
                          </p>
                        </div>

                        {/* Assistance et retour au site public */}
                        <div className="rounded-xl border border-[#d9dfcf] bg-[#f7f9f4] p-3.5 text-xs text-slate-700">
                          <p className="font-bold text-[#40552d]">
                            Assistance & Repères pour le client
                          </p>
                          <p className="mt-1 leading-relaxed">
                            {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.supportNotice}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <Link href={`/sites/${siteSlug || "association-familiale-ath-vahloul"}`}>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 border-[#40552d] bg-white text-[11px] font-semibold text-[#40552d]"
                              >
                                <Globe className="mr-1 h-3 w-3" />
                                Ouvrir le site public (/sites/{siteSlug || "association-familiale-ath-vahloul"})
                              </Button>
                            </Link>
                            <Link href="/connexion-administration">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 bg-white text-[11px]"
                              >
                                Page /connexion-administration
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeInspectorTab === "versions" && (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3 rounded-xl border border-[#e2dad0] bg-[#faf8f5] p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                          Créer un point de sauvegarde nommé
                        </h3>
                        <p className="text-xs text-slate-600">
                          Une version est créée automatiquement lors des sauvegardes importantes. Vous pouvez aussi créer une version nommée manuellement. Aucune suppression irréversible n’est activée par défaut.
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={versionLabelInput}
                            onChange={(e) => setVersionLabelInput(e.target.value)}
                            placeholder="Libellé facultatif (ex. Avant refonte accueil)"
                            className="h-8 flex-1 rounded border border-slate-300 bg-white px-2.5 text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-[#172033] text-xs text-white"
                            disabled={!selectedSiteId || !canAdministerSite || createVersionMutation.isPending}
                            onClick={() => {
                              if (!selectedSiteId) return;
                              createVersionMutation.mutate({
                                siteId: selectedSiteId,
                                label: versionLabelInput || undefined,
                              });
                            }}
                          >
                            Créer une version
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                          Historique des versions ({versionsQuery.data?.length ?? 0})
                        </h3>
                        {versionsQuery.data && versionsQuery.data.length > 0 ? (
                          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {versionsQuery.data.map((ver) => {
                              const isPreviewing = previewedVersionId === ver.id;
                              const verPreview = isPreviewing
                                ? buildIndependentVersionPreview(ver, pages)
                                : null;
                              return (
                                <div
                                  key={ver.id}
                                  className="space-y-1.5 rounded-lg border border-slate-200 bg-[#faf8f5] p-2.5 text-xs"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <strong className="text-[#172033]">
                                        v{ver.versionNumber}
                                      </strong>{" "}
                                      — <span>{ver.label}</span>
                                      <span className="ml-2 text-[10px] text-slate-500">
                                        ({new Date(ver.createdAt).toLocaleString("fr-FR")} · Auteur : Propriétaire #{ver.ownerUserId})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[11px]"
                                        onClick={() =>
                                          setPreviewedVersionId(isPreviewing ? null : ver.id)
                                        }
                                      >
                                        {isPreviewing ? "Masquer l’aperçu" : "Aperçu"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs font-semibold text-[#9b563e]"
                                        onClick={() => {
                                          if (!selectedSiteId) return;
                                          setPendingConfirmAction({
                                            title: `Restaurer la version v${ver.versionNumber} (« ${ver.label} ») ?`,
                                            description:
                                              "La restauration ne remplace jamais silencieusement votre travail : une nouvelle entrée d’historique de sauvegarde sera créée avant d’appliquer cette version.",
                                            confirmLabel: "Confirmer la restauration",
                                            variant: "primary",
                                            onConfirm: () =>
                                              restoreVersionMutation.mutate({
                                                siteId: selectedSiteId,
                                                versionId: ver.id,
                                              }),
                                          });
                                        }}
                                      >
                                        Restaurer
                                      </Button>
                                    </div>
                                  </div>

                                  {verPreview && (
                                    <div className="rounded border border-slate-300 bg-white p-2 text-[11px] text-slate-700">
                                      <p className="font-semibold text-[#172033]">
                                        Aperçu v{verPreview.versionNumber} ({verPreview.pageCount}{" "}
                                        page(s) · {verPreview.authorLabel}) :
                                      </p>
                                      <ul className="mt-1 space-y-0.5">
                                        {verPreview.pageTitles.map((pt) => (
                                          <li key={pt}>• {pt}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Enregistrez votre projet pour générer automatiquement la version initiale v1.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Import & Export JSON contrôlé et sécurisé */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Exporter le projet (JSON propre et versionné)
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            Sans secret ni paiement
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          Génère un export JSON portable contenant uniquement les pages, blocs, styles et métadonnées SEO du site (aucune clé API, aucun secret, aucune commande).
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          onClick={handleExportProjectJson}
                        >
                          Générer l’export JSON du projet
                        </Button>
                        {exportedJsonText && (
                          <textarea
                            readOnly
                            rows={6}
                            value={exportedJsonText}
                            aria-label="Export JSON du projet"
                            className="mt-2 w-full rounded border border-slate-300 bg-[#faf8f5] p-2 font-mono text-[11px]"
                          />
                        )}
                      </div>

                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                            Importer un projet JSON (avec validation & aperçu)
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            Sanitation HTML/CSS
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          Collez un export JSON pour vérifier sa structure, rejeter tout script dangereux et prévisualiser son contenu avant confirmation.
                        </p>
                        <textarea
                          rows={4}
                          value={importJsonRawInput}
                          onChange={(e) => setImportJsonRawInput(e.target.value)}
                          placeholder='Collez ici un JSON au format "mazigho-independent-site-export"...'
                          aria-label="JSON à importer"
                          className="w-full rounded border border-slate-300 p-2 font-mono text-[11px]"
                        />
                        {importValidationPreview && (
                          <div
                            className={`rounded-lg border p-2.5 text-xs ${
                              importValidationPreview.valid
                                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                                : "border-rose-300 bg-rose-50 text-rose-950"
                            }`}
                          >
                            {importValidationPreview.valid && importValidationPreview.preview ? (
                              <div>
                                <strong>
                                  ✓ Aperçu avant import : « {importValidationPreview.preview.title} »
                                </strong>
                                <p className="mt-0.5 text-[11px]">
                                  Type : {importValidationPreview.preview.siteType} · Mode :{" "}
                                  {importValidationPreview.preview.projectMode} ·{" "}
                                  {importValidationPreview.preview.pageCount} page(s) (
                                  {importValidationPreview.preview.pageTitles.join(", ")})
                                </p>
                              </div>
                            ) : (
                              <div>
                                <strong>✕ Import refusé :</strong>
                                <p className="mt-0.5 text-[11px]">
                                  {importValidationPreview.error}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-[#9b563e] text-xs text-white hover:bg-[#824631]"
                            disabled={!importValidationPreview?.valid}
                            onClick={() => requestImportProjectJson(true)}
                          >
                            Importer dans ce projet (avec confirmation)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={!importValidationPreview?.valid}
                            onClick={() => requestImportProjectJson(false)}
                          >
                            Créer comme nouveau projet
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* GUIDE ILLUSTRÉ PRIVÉ & VIDÉO DU CONSTRUCTEUR (PROPRIÉTAIRE MAZIGHO UNIQUEMENT) */}
      <SiteTrainingModal
        open={trainingModalOpen}
        mode={trainingModalMode}
        onModeChange={setTrainingModalMode}
        onClose={() => setTrainingModalOpen(false)}
        config={BUILDER_GUIDE_CONFIG}
        activeSiteName={siteTitle || undefined}
      />
    </div>
  );
}
