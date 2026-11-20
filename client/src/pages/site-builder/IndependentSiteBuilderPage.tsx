import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import GjsEditor from "@grapesjs/react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { trpc } from "@/lib/trpc";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  DEFAULT_IMAGE_TRANSFORMS,
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_SITE_TEMPLATES,
  INDEPENDENT_SITE_TYPE_OPTIONS,
  RESPONSIVE_VIEWPORTS,
  addCardToVisualCardGrid,
  buildImageTransformCss,
  buildNavigationFromPages,
  createDefaultVisualCardItem,
  duplicateCardInVisualCardGrid,
  normalizeIndependentPageSlug,
  renderVisualCardGridHtml,
  type IndependentBuilderLibraryTab,
  type IndependentImageTransforms,
  type IndependentSitePage,
  type IndependentSiteReusableBlock,
  type IndependentSiteStatus,
  type IndependentSiteType,
  type ResponsiveViewportMode,
  type VisualCardGridConfig,
  type VisualCardShape,
  type VisualCardTextPlacement,
} from "@shared/isolatedSiteBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  FlipHorizontal,
  FlipVertical,
  FolderKanban,
  Globe,
  History,
  ImagePlus,
  Laptop,
  Layers,
  LayoutGrid,
  Lock,
  Move,
  Palette,
  Plus,
  Redo2,
  RotateCw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  Unlock,
} from "lucide-react";

interface LayerSummaryItem {
  id: string;
  tagName: string;
  label: string;
  locked: boolean;
  hidden: boolean;
}

export default function IndependentSiteBuilderPage() {
  const utils = trpc.useUtils();
  const editorRef = useRef<Editor | null>(null);

  // Filtres de l’espace utilisateur indépendant (Projets Publiés, Brouillons, Archivés)
  const [statusFilter, setStatusFilter] = useState<IndependentSiteStatus | "all">("all");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [activeLibraryTab, setActiveLibraryTab] = useState<IndependentBuilderLibraryTab>("pages");
  const [viewport, setViewport] = useState<ResponsiveViewportMode>("desktop");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Formulaire de création d’un nouveau site indépendant
  const [newSiteTitle, setNewSiteTitle] = useState("Association familiale ATH VAHLOUL");
  const [newSiteType, setNewSiteType] = useState<IndependentSiteType>("familial");
  const [newSiteTemplateId, setNewSiteTemplateId] = useState<string>(ATH_VAHLOUL_DEMO_TEMPLATE_ID);

  // État local d’édition du projet actif
  const [siteTitle, setSiteTitle] = useState("Association familiale ATH VAHLOUL");
  const [siteSlug, setSiteSlug] = useState("association-familiale-ath-vahloul");
  const [siteType, setSiteType] = useState<IndependentSiteType>("familial");
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

  // Studio de transformations d’images (Point 9 : rotation, inclinaison, retournement, zoom, position libre)
  const [imageTransforms, setImageTransforms] = useState<IndependentImageTransforms>({
    ...DEFAULT_IMAGE_TRANSFORMS,
  });
  const [newMediaLabel, setNewMediaLabel] = useState("");
  const [newMediaAlt, setNewMediaAlt] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Studio de cartes visuelles (Point 11 : carrée, rectangulaire, ronde, texte dessus/dessous/intérieur, bouton "+", duplication)
  const [cardGridConfig, setCardGridConfig] = useState<VisualCardGridConfig>(() => ({
    sectionEyebrow: "Rubriques personnalisables",
    sectionTitle: "Cartes visuelles du site",
    columns: 3,
    shape: "rectangular",
    textPlacement: "bottom",
    showButton: true,
    cards: [
      createDefaultVisualCardItem(1, {
        title: "Histoire & Patrimoine",
        subtitle: "Mémoire",
        description: "Récits, archives photographiques et transmission familiale.",
      }),
      createDefaultVisualCardItem(2, {
        title: "Rencontres & Événements",
        subtitle: "Agenda",
        description: "Assemblées annuelles, ateliers culturels et fêtes intergénérationnelles.",
      }),
      createDefaultVisualCardItem(3, {
        title: "Entraide & Solidarité",
        subtitle: "Collectif",
        description: "Prêt de matériel associatif et soutien mutuel entre membres.",
      }),
    ],
  }));

  // Calques de la page active
  const [layers, setLayers] = useState<LayerSummaryItem[]>([]);

  // Domaines personnalisés & Versions
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [versionLabelInput, setVersionLabelInput] = useState("");
  const [reusableBlockNameInput, setReusableBlockNameInput] = useState("");

  // Queries & Mutations tRPC
  const projectsQuery = trpc.independentSiteBuilder.listProjects.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter },
    { retry: false, refetchOnWindowFocus: false }
  );

  const activeProjectQuery = trpc.independentSiteBuilder.getProject.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );

  const versionsQuery = trpc.independentSiteBuilder.listVersions.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );

  const mediaQuery = trpc.independentSiteBuilder.listMedia.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );

  const domainsQuery = trpc.independentSiteBuilder.listDomains.useQuery(
    { siteId: selectedSiteId ?? 0 },
    { enabled: Boolean(selectedSiteId), retry: false, refetchOnWindowFocus: false }
  );

  const createProjectMutation = trpc.independentSiteBuilder.createProject.useMutation({
    onSuccess: async (created) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      setSelectedSiteId(created.id);
      loadProjectIntoWorkspace(created);
      setStatusBanner(`Projet « ${created.title} » créé dans votre espace indépendant.`);
    },
  });

  const ensureAthVahloulMutation = trpc.independentSiteBuilder.ensureAthVahloulDemo.useMutation({
    onSuccess: async (demo) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      setSelectedSiteId(demo.id);
      loadProjectIntoWorkspace(demo);
      setStatusBanner(
        "Démonstration « Association familiale ATH VAHLOUL » chargée avec ses 6 pages associatives et familiales (100 % sans boutique)."
      );
    },
  });

  const saveProjectMutation = trpc.independentSiteBuilder.saveProject.useMutation({
    onSuccess: async (saved) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: saved.id });
      setSiteStatus(saved.status);
      setStatusBanner(`Brouillon « ${saved.title} » enregistré avec succès.`);
    },
  });

  const duplicateProjectMutation = trpc.independentSiteBuilder.duplicateProject.useMutation({
    onSuccess: async (copy) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      setSelectedSiteId(copy.id);
      loadProjectIntoWorkspace(copy);
      setStatusBanner(`Projet dupliqué sous le nom « ${copy.title} ».`);
    },
  });

  const publishSiteMutation = trpc.independentSiteBuilder.publishSite.useMutation({
    onSuccess: async (published) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      await utils.independentSiteBuilder.listVersions.invalidate({ siteId: published.id });
      setSiteStatus(published.status);
      setStatusBanner(
        `Site « ${published.title} » publié indépendamment ! Accessible sur /constructeur-sites/apercu/${published.slug}`
      );
    },
  });

  const updateStatusMutation = trpc.independentSiteBuilder.updateStatus.useMutation({
    onSuccess: async (updated) => {
      await utils.independentSiteBuilder.listProjects.invalidate();
      setSiteStatus(updated.status);
      setStatusBanner(`Statut du site mis à jour : ${updated.status}.`);
    },
  });

  const createVersionMutation = trpc.independentSiteBuilder.createVersion.useMutation({
    onSuccess: async (ver) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listVersions.invalidate({ siteId: selectedSiteId });
      }
      setVersionLabelInput("");
      setStatusBanner(`Version v${ver.versionNumber} (« ${ver.label} ») enregistrée.`);
    },
  });

  const restoreVersionMutation = trpc.independentSiteBuilder.restoreVersion.useMutation({
    onSuccess: async (restored) => {
      loadProjectIntoWorkspace(restored);
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listVersions.invalidate({ siteId: selectedSiteId });
      }
      setStatusBanner(`Version restaurée pour « ${restored.title} ».`);
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
      setStatusBanner("Média ajouté à la bibliothèque personnelle du projet.");
    },
  });

  const addDomainMutation = trpc.independentSiteBuilder.addDomain.useMutation({
    onSuccess: async (dom) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setCustomDomainInput("");
      setStatusBanner(`Domaine personnalisé ${dom.hostname} ajouté. Configurez l’enregistrement DNS TXT indiqué.`);
    },
  });

  const verifyDomainMutation = trpc.independentSiteBuilder.verifyDomain.useMutation({
    onSuccess: async (dom) => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setStatusBanner(`Domaine ${dom.hostname} vérifié et SSL activé.`);
    },
  });

  const removeDomainMutation = trpc.independentSiteBuilder.removeDomain.useMutation({
    onSuccess: async () => {
      if (selectedSiteId) {
        await utils.independentSiteBuilder.listDomains.invalidate({ siteId: selectedSiteId });
      }
      setStatusBanner("Domaine personnalisé retiré du projet.");
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
  }) {
    setSiteTitle(project.title);
    setSiteSlug(project.slug);
    setSiteType(project.siteType);
    setSiteStatus(project.status);
    const nextPages = project.pages.length
      ? project.pages
      : JSON.parse(JSON.stringify(INDEPENDENT_SITE_TEMPLATES[0].pages));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setReusableBlocks(project.reusableBlocks || []);
    if (editorRef.current && nextPages[0]) {
      editorRef.current.setComponents(nextPages[0].html);
      editorRef.current.setStyle(nextPages[0].css);
      refreshLayersFromEditor(editorRef.current);
    }
  }

  useEffect(() => {
    if (activeProjectQuery.data) {
      loadProjectIntoWorkspace(activeProjectQuery.data);
    }
  }, [activeProjectQuery.data?.id]);

  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activePageId) ?? pages[0];
  }, [pages, activePageId]);

  const navigationTree = useMemo(() => buildNavigationFromPages(pages), [pages]);

  function syncCurrentEditorToPageState(): IndependentSitePage[] {
    const editor = editorRef.current;
    if (!editor || !activePage) return pages;
    const html = editor.getHtml();
    const css = editor.getCss() || "";
    const next = pages.map((p) => (p.id === activePage.id ? { ...p, html, css } : p));
    setPages(next);
    return next;
  }

  function handleSelectPage(pageId: string) {
    const updatedPages = syncCurrentEditorToPageState();
    const target = updatedPages.find((p) => p.id === pageId);
    setActivePageId(pageId);
    if (editorRef.current && target) {
      editorRef.current.setComponents(target.html);
      editorRef.current.setStyle(target.css);
      refreshLayersFromEditor(editorRef.current);
    }
  }

  function insertHtmlIntoCanvas(html: string, label: string) {
    const editor = editorRef.current;
    if (editor) {
      editor.addComponents(html);
      syncCurrentEditorToPageState();
      refreshLayersFromEditor(editor);
      setStatusBanner(`« ${label} » inséré dans la page « ${activePage?.title || "Accueil"} ».`);
    } else if (activePage) {
      const next = pages.map((p) =>
        p.id === activePage.id ? { ...p, html: `${p.html}\n${html}` } : p
      );
      setPages(next);
      setStatusBanner(`« ${label} » ajouté à la page « ${activePage.title} ».`);
    }
  }

  function applySocleToCurrentPage(socleId: string) {
    const socle = INDEPENDENT_PAGE_SOCLES.find((s) => s.id === socleId);
    if (!socle || !activePage) return;
    if (editorRef.current) {
      editorRef.current.setComponents(socle.html);
      refreshLayersFromEditor(editorRef.current);
    }
    const next = pages.map((p) => (p.id === activePage.id ? { ...p, html: socle.html } : p));
    setPages(next);
    setStatusBanner(`Socle « ${socle.label} » appliqué à la page « ${activePage.title} ».`);
  }

  function applyTemplateToSite(templateId: string) {
    const tpl = INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const clonedPages: IndependentSitePage[] = JSON.parse(JSON.stringify(tpl.pages));
    setSiteTitle(tpl.name);
    setSiteType(tpl.siteType);
    setPages(clonedPages);
    setActivePageId(clonedPages[0].id);
    if (editorRef.current && clonedPages[0]) {
      editorRef.current.setComponents(clonedPages[0].html);
      editorRef.current.setStyle(clonedPages[0].css);
      refreshLayersFromEditor(editorRef.current);
    }
    setStatusBanner(
      `Modèle complet « ${tpl.name} » (${clonedPages.length} pages avec menus et sous-menus) chargé dans l’éditeur.`
    );
  }

  function handleAddPage() {
    if (!newPageTitle.trim()) return;
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
      html: socle.html,
      css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
    };
    const next = [...syncCurrentEditorToPageState(), createdPage];
    setPages(next);
    setActivePageId(id);
    if (editorRef.current) {
      editorRef.current.setComponents(createdPage.html);
      editorRef.current.setStyle(createdPage.css);
      refreshLayersFromEditor(editorRef.current);
    }
    setNewPageTitle("");
    setNewPageSlug("");
    setNewPageParentId("");
    setStatusBanner(`Page « ${createdPage.title} » (${createdPage.slug}) créée.`);
  }

  function handleDeletePage(pageId: string) {
    if (pages.length <= 1) {
      setStatusBanner("Un site doit conserver au moins une page.");
      return;
    }
    const filtered = pages.filter((p) => p.id !== pageId);
    setPages(filtered);
    if (activePageId === pageId) {
      setActivePageId(filtered[0].id);
      if (editorRef.current) {
        editorRef.current.setComponents(filtered[0].html);
        editorRef.current.setStyle(filtered[0].css);
      }
    }
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
        setStatusBanner(
          `Transformations d’image appliquées (rotation ${imageTransforms.rotationDeg}°, inclinaison ${imageTransforms.skewXDeg}°/${imageTransforms.skewYDeg}°, zoom ${imageTransforms.scalePercent}%, position ${imageTransforms.offsetX}px/${imageTransforms.offsetY}px).`
        );
        return;
      }
    }
    const html = `<figure data-site-block="transformable-image" style="margin:0;padding:32px;text-align:center"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23172033'/%3E%3Ccircle cx='320' cy='190' r='85' fill='%23f5b98f'/%3E%3C/svg%3E" alt="Image transformée" data-site-transformable-image="true" style="${css}" /></figure>`;
    insertHtmlIntoCanvas(html, "Image transformée");
  }

  function saveSelectionAsReusableBlock() {
    const editor = editorRef.current;
    const selected = editor?.getSelected();
    const html = selected ? selected.toHTML() : activePage?.html || "";
    if (!html.trim()) return;
    const label =
      reusableBlockNameInput.trim() || `Bloc réutilisable #${reusableBlocks.length + 1}`;
    const item: IndependentSiteReusableBlock = {
      id: `reusable-${Date.now().toString(36)}`,
      name: label,
      category: "Mes blocs multi-pages",
      html,
      createdAt: new Date().toISOString(),
    };
    setReusableBlocks((prev) => [item, ...prev]);
    setReusableBlockNameInput("");
    setStatusBanner(`Bloc « ${label} » enregistré pour être réutilisé dans toutes vos pages.`);
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

  function handleLayerAction(index: number, action: "up" | "down" | "lock" | "hide" | "duplicate" | "delete") {
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
  }

  function handleSaveCurrentProject(versionLabel?: string) {
    const syncedPages = syncCurrentEditorToPageState();
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

  const currentViewport =
    RESPONSIVE_VIEWPORTS.find((v) => v.id === viewport) ?? RESPONSIVE_VIEWPORTS[0];

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      {/* En-tête du produit indépendant */}
      <header className="sticky top-0 z-40 border-b border-[#e2dad0] bg-white/95 px-4 py-3 shadow-xs backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-white">
              <Globe className="h-5 w-5 text-[#f5b98f]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-[#172033]">
                  Constructeur de Sites Internet Indépendant
                </h1>
                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                  Produit 100 % indépendant · Sans boutique
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  Statut : {siteStatus === "published" ? "Publié" : siteStatus === "archived" ? "Archivé" : "Brouillon"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Sites vitrines, associatifs, familiaux, professionnels, personnels, événementiels et institutionnels
              </p>
            </div>
          </div>

          {/* Barre d’outils Responsive + Undo/Redo + Sauvegarde + Prévisualisation + Publication */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  viewport === "desktop" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                Ordinateur
              </button>
              <button
                type="button"
                onClick={() => setViewport("tablet")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  viewport === "tablet" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600"
                }`}
              >
                <Tablet className="h-3.5 w-3.5" />
                Tablette
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  viewport === "mobile" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editorRef.current?.UndoManager.undo()}
              title="Annuler (Undo)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editorRef.current?.UndoManager.redo()}
              title="Rétablir (Redo)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => ensureAthVahloulMutation.mutate()}
              disabled={ensureAthVahloulMutation.isPending}
              className="border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
            >
              <Sparkles className="mr-1.5 h-4 w-4 text-amber-700" />
              Démo : Association familiale ATH VAHLOUL
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSaveCurrentProject()}
              disabled={saveProjectMutation.isPending || createProjectMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Sauvegarder le brouillon
            </Button>

            <Link href={`/constructeur-sites/apercu/${siteSlug || "association-familiale-ath-vahloul"}`}>
              <Button type="button" variant="outline" size="sm">
                <Eye className="mr-1.5 h-4 w-4" />
                Aperçu public
              </Button>
            </Link>

            <Button
              type="button"
              size="sm"
              className="bg-[#172033] text-white hover:bg-[#263653]"
              onClick={() => {
                if (!selectedSiteId) {
                  handleSaveCurrentProject("Avant publication");
                  return;
                }
                publishSiteMutation.mutate({ siteId: selectedSiteId });
              }}
              disabled={publishSiteMutation.isPending}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4 text-[#f5b98f]" />
              Publier le site
            </Button>
          </div>
        </div>

        {statusBanner && (
          <div className="mx-auto mt-2 flex max-w-[1600px] items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950">
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="ml-4 text-emerald-700 underline"
            >
              Fermer
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
        {/* Espace Utilisateur Indépendant : Gestion des projets Publiés / Brouillons / Archivés */}
        <Card className="border-[#e2dad0] bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-[#172033]">
                  <FolderKanban className="h-5 w-5 text-[#9b563e]" />
                  Mon Espace Projets de Sites Internet
                </CardTitle>
                <CardDescription>
                  Gérez vos sites brouillons, publiés et archivés, dupliquez un projet ou configurez un domaine personnalisé.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "draft", "published", "archived"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
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
            {/* Création rapide d'un nouveau site indépendant */}
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-[#faf8f5] p-3 md:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nom du site internet</label>
                <input
                  type="text"
                  value={newSiteTitle}
                  onChange={(e) => setNewSiteTitle(e.target.value)}
                  placeholder="Ex. Association familiale ATH VAHLOUL"
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Catégorie de site</label>
                <select
                  value={newSiteType}
                  onChange={(e) => setNewSiteType(e.target.value as IndependentSiteType)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                >
                  {INDEPENDENT_SITE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Modèle de départ</label>
                <select
                  value={newSiteTemplateId}
                  onChange={(e) => setNewSiteTemplateId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
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
                    createProjectMutation.mutate({
                      title: newSiteTitle,
                      siteType: newSiteType,
                      templateId: newSiteTemplateId,
                    })
                  }
                  disabled={createProjectMutation.isPending}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Créer ce site
                </Button>
              </div>
            </div>

            {/* Liste des projets de l’utilisateur */}
            {projectsQuery.data && projectsQuery.data.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {projectsQuery.data.map((proj) => (
                  <div
                    key={proj.id}
                    className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                      selectedSiteId === proj.id
                        ? "border-[#172033] bg-slate-50 ring-2 ring-[#172033]/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#172033]">{proj.title}</span>
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
                        Type : {proj.siteType} · {proj.pages.length} pages · Slug : <code>/{proj.slug}</code>
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedSiteId === proj.id ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedSiteId(proj.id);
                          loadProjectIntoWorkspace(proj);
                        }}
                      >
                        Ouvrir
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => duplicateProjectMutation.mutate({ siteId: proj.id })}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Dupliquer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            siteId: proj.id,
                            status: proj.status === "archived" ? "draft" : "archived",
                          })
                        }
                      >
                        <Archive className="mr-1 h-3 w-3" />
                        {proj.status === "archived" ? "Désarchiver" : "Archiver"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone principale du Constructeur : Bibliothèques séparées à gauche (Pages, Blocs, Médias, Calques, Modules, Socles, Modèles) + Canevas GrapesJS au centre/droite */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Panneau latéral gauche : les 7 bibliothèques clairement séparées */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#9b563e]">
                  Bibliothèques du Constructeur
                </CardTitle>
                {/* Sélecteur des 7 onglets obligatoires : Pages | Blocs | Médias | Calques | Modules | Socles | Modèles */}
                <div
                  role="tablist"
                  aria-label="Bibliothèques séparées du constructeur"
                  className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:grid-cols-4"
                >
                  {INDEPENDENT_BUILDER_LIBRARY_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeLibraryTab === tab.id}
                      onClick={() => setActiveLibraryTab(tab.id)}
                      className={`rounded-lg px-2.5 py-2 text-xs font-bold transition ${
                        activeLibraryTab === tab.id
                          ? "bg-[#172033] text-white shadow-xs"
                          : "bg-[#faf8f5] text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="max-h-[75vh] space-y-4 overflow-y-auto pr-2">
                {/* 1. ONGLET PAGES & SOUS-MENUS */}
                {activeLibraryTab === "pages" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-[#faf8f5] p-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                        Pages du site ({pages.length})
                      </h3>
                      <div className="mt-2 space-y-1.5">
                        {pages.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                              activePage?.id === p.id
                                ? "border-[#172033] bg-white font-bold text-[#172033]"
                                : "border-slate-200 bg-white/70 text-slate-700"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectPage(p.id)}
                              className="flex-1 text-left"
                            >
                              <span>{p.parentPageId ? `↳ ${p.title}` : p.title}</span>
                              <span className="ml-2 text-[11px] text-slate-400">({p.slug})</span>
                            </button>
                            {pages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeletePage(p.id)}
                                className="ml-2 text-rose-600 hover:text-rose-800"
                                title="Supprimer cette page"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Création d'une nouvelle page ou sous-menu */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 p-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <FilePlus2 className="h-4 w-4 text-[#9b563e]" />
                        Ajouter une page ou un sous-menu
                      </h4>
                      <input
                        type="text"
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        placeholder="Titre de la page (ex. Nos Actions)"
                        className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        type="text"
                        value={newPageSlug}
                        onChange={(e) => setNewPageSlug(e.target.value)}
                        placeholder="Chemin URL (ex. /nos-actions)"
                        className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs"
                      />
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Position dans le menu (Page principale ou Sous-menu)
                        </label>
                        <select
                          value={newPageParentId}
                          onChange={(e) => setNewPageParentId(e.target.value)}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                        >
                          <option value="">Page principale (Menu de niveau 1)</option>
                          {pages
                            .filter((p) => !p.parentPageId)
                            .map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                Sous-menu de : {parent.title}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Socle de départ de la page
                        </label>
                        <select
                          value={newPageSocleId}
                          onChange={(e) => setNewPageSocleId(e.target.value)}
                          className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
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
                        className="w-full bg-[#172033] text-white"
                        onClick={handleAddPage}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Ajouter la page au site
                      </Button>
                    </div>

                    {/* Aperçu de l'arborescence Menus & Sous-menus */}
                    <div className="rounded-xl border border-slate-200 bg-[#faf8f5] p-3">
                      <h4 className="text-xs font-bold text-[#172033]">
                        Aperçu des Menus & Sous-menus
                      </h4>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700">
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
                    </div>
                  </div>
                )}

                {/* 2. ONGLET BLOCS & CARTES VISUELLES « + » */}
                {activeLibraryTab === "blocs" && (
                  <div className="space-y-4">
                    {/* Générateur interactif de Cartes Visuelles avec bouton « + » */}
                    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                          <LayoutGrid className="h-4 w-4 text-[#9b563e]" />
                          Atelier Cartes Visuelles (« + »)
                        </h3>
                        <Badge variant="outline" className="border-amber-300 bg-white text-[11px]">
                          {cardGridConfig.cards.length} cartes
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Forme des cartes
                          </label>
                          <select
                            value={cardGridConfig.shape}
                            onChange={(e) => {
                              const shape = e.target.value as VisualCardShape;
                              setCardGridConfig((prev) => ({
                                ...prev,
                                shape,
                                cards: prev.cards.map((c) => ({ ...c, shape })),
                              }));
                            }}
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="rectangular">Rectangulaires</option>
                            <option value="square">Carrées</option>
                            <option value="round">Rondes (portraits)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Position du texte
                          </label>
                          <select
                            value={cardGridConfig.textPlacement}
                            onChange={(e) => {
                              const textPlacement = e.target.value as VisualCardTextPlacement;
                              setCardGridConfig((prev) => ({
                                ...prev,
                                textPlacement,
                                cards: prev.cards.map((c) => ({ ...c, textPlacement })),
                              }));
                            }}
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="bottom">Texte en dessous</option>
                            <option value="top">Texte au-dessus</option>
                            <option value="inside">Texte à l’intérieur</option>
                          </select>
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
                        Afficher le bouton d’action sur chaque carte
                      </label>

                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 border-[#9b563e] bg-white text-xs font-bold text-[#9b563e]"
                          onClick={() =>
                            setCardGridConfig((prev) => addCardToVisualCardGrid(prev))
                          }
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          + Ajouter une carte
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            const lastCard = cardGridConfig.cards[cardGridConfig.cards.length - 1];
                            if (lastCard) {
                              setCardGridConfig((prev) =>
                                duplicateCardInVisualCardGrid(prev, lastCard.id)
                              );
                            }
                          }}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Dupliquer
                        </Button>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#172033] text-xs text-white"
                        onClick={() =>
                          insertHtmlIntoCanvas(
                            renderVisualCardGridHtml(cardGridConfig),
                            `Grille de ${cardGridConfig.cards.length} cartes visuelles`
                          )
                        }
                      >
                        Insérer cette grille de cartes dans la page
                      </Button>
                    </div>

                    {/* Liste des 20+ Blocs éditoriaux par catégorie */}
                    <div className="space-y-2">
                      {INDEPENDENT_BUILDER_BLOCKS.map((blk) => (
                        <div
                          key={blk.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 hover:border-slate-300"
                        >
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9b563e]">
                              {blk.category}
                            </span>
                            <strong className="text-xs text-[#172033]">{blk.label}</strong>
                            <p className="text-[11px] text-slate-500">{blk.description}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 shrink-0 text-xs"
                            onClick={() => insertHtmlIntoCanvas(blk.content, blk.label)}
                          >
                            + Insérer
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Blocs réutilisables enregistrés par l’utilisateur entre plusieurs pages */}
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-[#faf8f5] p-3">
                      <h4 className="text-xs font-bold text-[#172033]">
                        Réutiliser un bloc dans plusieurs pages ({reusableBlocks.length})
                      </h4>
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
                          className="h-8 text-xs"
                          onClick={saveSelectionAsReusableBlock}
                        >
                          Mémoriser
                        </Button>
                      </div>
                      {reusableBlocks.map((rb) => (
                        <div
                          key={rb.id}
                          className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-medium">{rb.name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px]"
                            onClick={() => insertHtmlIntoCanvas(rb.html, rb.name)}
                          >
                            Insérer ici
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. ONGLET MÉDIAS & TRANSFORMATIONS D’IMAGES */}
                {activeLibraryTab === "medias" && (
                  <div className="space-y-4">
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-[#faf8f5] p-3">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <RotateCw className="h-4 w-4 text-[#9b563e]" />
                        Transformations d’images (Rotation, Inclinaison, Retournement, Zoom, Position)
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="block">
                          <span className="font-semibold">Rotation ({imageTransforms.rotationDeg}°)</span>
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
                          <span className="font-semibold">Zoom / Taille ({imageTransforms.scalePercent}%)</span>
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
                          <span className="font-semibold">Inclinaison X ({imageTransforms.skewXDeg}°)</span>
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
                          <span className="font-semibold">Inclinaison Y ({imageTransforms.skewYDeg}°)</span>
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
                          <span className="font-semibold">Position libre X ({imageTransforms.offsetX}px)</span>
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
                          <span className="font-semibold">Position libre Y ({imageTransforms.offsetY}px)</span>
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

                      <div className="flex flex-wrap gap-2">
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
                          Retournement H
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
                          Retournement V
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

                    {/* Bibliothèque personnelle de médias du projet */}
                    <div className="space-y-2.5 rounded-xl border border-slate-200 p-3">
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
                        placeholder="Texte alternatif (accessibilité)"
                        className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        type="url"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="URL de l’image (https://...)"
                        className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-[#9b563e] text-xs text-white"
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
                        Enregistrer dans la médiathèque du projet
                      </Button>

                      {mediaQuery.data && mediaQuery.data.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {mediaQuery.data.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                            >
                              <span className="truncate font-medium">{m.label}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px]"
                                onClick={() =>
                                  insertHtmlIntoCanvas(
                                    `<figure style="margin:0;padding:20px;text-align:center"><img src="${m.url}" alt="${m.altText}" data-site-transformable-image="true" style="${buildImageTransformCss(m.transforms)}" /></figure>`,
                                    m.label
                                  )
                                }
                              >
                                Insérer
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. ONGLET CALQUES */}
                {activeLibraryTab === "calques" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                        <Layers className="h-4 w-4 text-[#9b563e]" />
                        Calques de la page ({layers.length})
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
                      <p className="text-xs text-slate-500">
                        Cliquez sur « Actualiser » ou insérez un bloc pour inspecter l’arborescence des sections.
                      </p>
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
                              className="rounded p-1 hover:bg-slate-100"
                              title="Monter"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "down")}
                              className="rounded p-1 hover:bg-slate-100"
                              title="Descendre"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "lock")}
                              className="rounded p-1 hover:bg-slate-100"
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
                              className="rounded p-1 hover:bg-slate-100"
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
                              className="rounded p-1 hover:bg-slate-100"
                              title="Dupliquer la section"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerAction(index, "delete")}
                              className="rounded p-1 text-rose-600 hover:bg-rose-50"
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

                {/* 5. ONGLET MODULES FONCTIONNELS */}
                {activeLibraryTab === "modules" && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600">
                      Modules fonctionnels prêts à l’emploi (événements, formulaire, galerie, témoignages, membres, actualités avec consentement, annuaire matériel).
                    </p>
                    {INDEPENDENT_BUILDER_MODULES.map((mod) => (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b563e]">
                          {mod.category}
                        </span>
                        <h4 className="mt-0.5 text-xs font-bold text-[#172033]">{mod.label}</h4>
                        <p className="mt-1 text-[11px] text-slate-500">{mod.description}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2.5 h-7 w-full text-xs"
                          onClick={() => insertHtmlIntoCanvas(mod.html, mod.label)}
                        >
                          + Ajouter ce module à la page
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. ONGLET SOCLES DE PAGES */}
                {activeLibraryTab === "socles" && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600">
                      Structures de page complètes prêtes à personnaliser (Accueil, Association, Famille, Entreprise, Services, Contact, Événements, Équipe, Actualités).
                    </p>
                    {INDEPENDENT_PAGE_SOCLES.map((socle) => (
                      <div
                        key={socle.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#172033]">{socle.label}</strong>
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                            {socle.defaultSlug}
                          </code>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{socle.description}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2.5 h-7 w-full text-xs"
                          onClick={() => applySocleToCurrentPage(socle.id)}
                        >
                          Appliquer ce socle à la page active
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. ONGLET MODÈLES DE SITES COMPLETS */}
                {activeLibraryTab === "modeles" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Sites multi-pages complets avec identité visuelle, couleurs, typographies, sections et navigation.
                    </p>
                    {INDEPENDENT_SITE_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[#172033] text-white">{tpl.siteType}</Badge>
                          <span className="text-xs font-semibold text-[#9b563e]">
                            {tpl.pages.length} pages incluses
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-[#172033]">{tpl.name}</h4>
                        <p className="mt-1 text-xs text-slate-600">{tpl.description}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 w-full bg-[#172033] text-xs text-white hover:bg-[#263653]"
                          onClick={() => applyTemplateToSite(tpl.id)}
                        >
                          <Palette className="mr-1.5 h-3.5 w-3.5 text-[#f5b98f]" />
                          Charger ce modèle complet
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des versions & Domaines personnalisés */}
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-[#172033]">
                  <History className="h-4 w-4 text-[#9b563e]" />
                  Versions, Historique & Domaine Personnalisé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Création d'un point de sauvegarde / version */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Historique des versions du site
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={versionLabelInput}
                      onChange={(e) => setVersionLabelInput(e.target.value)}
                      placeholder="Nom de la version (ex. Validation bureau)"
                      className="h-8 flex-1 rounded border border-slate-300 px-2 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!selectedSiteId || createVersionMutation.isPending}
                      onClick={() => {
                        if (!selectedSiteId) return;
                        createVersionMutation.mutate({
                          siteId: selectedSiteId,
                          label: versionLabelInput || undefined,
                        });
                      }}
                    >
                      Créer version
                    </Button>
                  </div>
                  {versionsQuery.data && versionsQuery.data.length > 0 && (
                    <div className="max-h-32 space-y-1 overflow-y-auto pt-1">
                      {versionsQuery.data.map((ver) => (
                        <div
                          key={ver.id}
                          className="flex items-center justify-between rounded border border-slate-200 bg-[#faf8f5] px-2.5 py-1 text-xs"
                        >
                          <span>
                            <strong>v{ver.versionNumber}</strong> — {ver.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedSiteId) return;
                              restoreVersionMutation.mutate({
                                siteId: selectedSiteId,
                                versionId: ver.id,
                              });
                            }}
                            className="font-semibold text-[#9b563e] hover:underline"
                          >
                            Restaurer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gestion des domaines personnalisés indépendants */}
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    Domaine personnalisé (indépendant des boutiques)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="Ex. association-ath-vahloul.org"
                      className="h-8 flex-1 rounded border border-slate-300 px-2 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!selectedSiteId || !customDomainInput.trim()}
                      onClick={() => {
                        if (!selectedSiteId) return;
                        addDomainMutation.mutate({
                          siteId: selectedSiteId,
                          hostname: customDomainInput.trim(),
                        });
                      }}
                    >
                      Rattacher
                    </Button>
                  </div>
                  {domainsQuery.data && domainsQuery.data.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {domainsQuery.data.map((dom) => (
                        <div
                          key={dom.id}
                          className="rounded-lg border border-slate-200 bg-[#faf8f5] p-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <strong>{dom.hostname}</strong>
                            <Badge variant="outline" className="text-[10px]">
                              {dom.verificationStatus === "active" ? "Actif & SSL OK" : "DNS TXT requis"}
                            </Badge>
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-slate-600">
                            TXT {dom.dnsRecordName} = {dom.dnsRecordValue}
                          </p>
                          <div className="mt-1.5 flex gap-2">
                            {dom.verificationStatus !== "active" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedSiteId) return;
                                  verifyDomainMutation.mutate({
                                    siteId: selectedSiteId,
                                    domainId: dom.id,
                                  });
                                }}
                                className="font-semibold text-emerald-700 hover:underline"
                              >
                                Vérifier DNS
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedSiteId) return;
                                removeDomainMutation.mutate({
                                  siteId: selectedSiteId,
                                  domainId: dom.id,
                                });
                              }}
                              className="text-rose-600 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone centrale/droite : Éditeur Visuel GrapesJS complet */}
          <div className="lg:col-span-8">
            <Card className="border-[#e2dad0] bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base text-[#172033]">
                      Éditeur Visuel — {siteTitle} ({activePage?.title})
                    </CardTitle>
                    <CardDescription>
                      Cliquez sur n’importe quel texte, titre, bouton ou image pour le modifier directement. Mode : {currentViewport.label} ({currentViewport.widthCss}).
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-300 text-xs">
                      Page : {activePage?.slug}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div
                  className="mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner transition-all"
                  style={{
                    width: currentViewport.widthCss,
                    maxWidth: "100%",
                  }}
                >
                  <GjsEditor
                    grapesjs={grapesjs}
                    options={{
                      height: "760px",
                      storageManager: false,
                      noticeOnUnload: false,
                    }}
                    onEditor={(editor) => {
                      editorRef.current = editor;
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
                      if (activePage) {
                        editor.setComponents(activePage.html);
                        editor.setStyle(activePage.css);
                      }
                      refreshLayersFromEditor(editor);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
