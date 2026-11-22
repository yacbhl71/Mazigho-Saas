import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  DEFAULT_SITE_SETTINGS,
  INDEPENDENT_BUILDER_HELP_GUIDES,
  INDEPENDENT_RESPONSIVE_BASE_CSS,
  INDEPENDENT_SITE_TEMPLATES,
  RESPONSIVE_DEVICE_PRESETS,
  buildPageSeoPreview,
  buildPreviewReturnUrl,
  ensureNonEmptyIndependentPages,
  parseBuilderQueryParams,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  type ResponsiveDevicePresetId,
  type ResponsiveViewportMode,
} from "@shared/isolatedSiteBuilder";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Globe,
  Laptop,
  Pencil,
  Search,
  Smartphone,
  Tablet,
} from "lucide-react";

const PUBLIC_IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23263653'/%3E%3Ccircle cx='320' cy='210' r='92' fill='%23f5b98f' fill-opacity='.65'/%3E%3Cpath d='M0 390 Q160 280 320 390 T640 390 V480 H0Z' fill='%23172033'/%3E%3C/svg%3E";

export default function IndependentSitePublicPreviewPage() {
  const [, previewParams] = useRoute("/constructeur-sites/apercu/:slug");
  const [, publicParams] = useRoute("/sites/:slug");
  const slug = previewParams?.slug || publicParams?.slug || "association-familiale-ath-vahloul";
  const isPreviewRoute = Boolean(previewParams?.slug);
  const { user } = useAuth();

  const queryParams = useMemo(
    () =>
      typeof window !== "undefined"
        ? parseBuilderQueryParams(window.location.search)
        : { siteId: null, slug: null, pageSlug: null },
    []
  );

  const previewToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("previewToken")?.trim() || null;
  }, []);

  const [devicePresetId, setDevicePresetId] = useState<ResponsiveDevicePresetId>("desktop");
  const [activePageSlug, setActivePageSlug] = useState<string>(queryParams.pageSlug || "/");
  const [showSeoBanner, setShowSeoBanner] = useState<boolean>(false);
  const publicContentRef = useRef<HTMLDivElement>(null);
  const trackedPageViewRef = useRef<string | null>(null);
  const submitFormMutation = trpc.independentSiteBuilder.submitForm.useMutation();
  const recordPageViewMutation = trpc.independentSiteBuilder.recordPageView.useMutation();

  useEffect(() => {
    if (queryParams.pageSlug) {
      setActivePageSlug(queryParams.pageSlug);
    }
  }, [queryParams.pageSlug]);

  const siteQuery = trpc.independentSiteBuilder.getPublicSiteBySlug.useQuery(
    { slug, previewMode: isPreviewRoute, previewToken: isPreviewRoute ? previewToken : undefined },
    { retry: false, refetchOnWindowFocus: false }
  );
  const siteAccessQuery = trpc.independentSiteBuilder.getAccessRole.useQuery(
    { siteId: siteQuery.data?.id ?? 0 },
    { enabled: Boolean(user && siteQuery.data?.id), retry: false, refetchOnWindowFocus: false },
  );

  // En mode prévisualisation privée (/constructeur-sites/apercu/:slug),
  // si le projet n'a pas encore été sauvegardé en base, on propose un aperçu de brouillon.
  // La seule exception publique est le template ATH VAHLOUL, qui est une démonstration
  // statique et explicitement identifiée comme telle — aucun brouillon utilisateur n'est exposé.
  const fallbackDemoSite = useMemo(() => {
    const isAthVahloulDemo = slug === "association-familiale-ath-vahloul";
    if (!isPreviewRoute && !isAthVahloulDemo) return null;

    const matchedTemplate =
      INDEPENDENT_SITE_TEMPLATES.find(
        (t) =>
          slug.includes(t.id.replace("modele-", "")) ||
          slug.includes(t.id.replace("template-", ""))
      ) ??
      (slug.includes("ath-vahloul")
        ? INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === ATH_VAHLOUL_DEMO_TEMPLATE_ID)
        : INDEPENDENT_SITE_TEMPLATES[0]);

    if (matchedTemplate) {
      return {
        id: queryParams.siteId ?? 0,
        slug,
        title: matchedTemplate.name,
        siteType: matchedTemplate.siteType,
        status: "draft" as const,
        theme: matchedTemplate.theme,
        settings: DEFAULT_SITE_SETTINGS,
        navigation: matchedTemplate.navigation,
        pages: matchedTemplate.pages,
        publishedAt: null,
      };
    }
    return null;
  }, [isPreviewRoute, queryParams.siteId, slug]);

  const site = siteQuery.data ?? fallbackDemoSite;

  const safePages = useMemo(() => {
    if (!site) return [];
    return ensureNonEmptyIndependentPages(site.pages, site.title);
  }, [site]);

  const activePage = useMemo(() => {
    if (!safePages.length) return null;
    return safePages.find((p) => p.slug === activePageSlug) ?? safePages[0];
  }, [safePages, activePageSlug]);

  useEffect(() => {
    if (isPreviewRoute || !site || !activePage || typeof window === "undefined") return;
    try {
      const pageViewKey = `${site.slug}:${activePage.slug || "/"}`;
      if (trackedPageViewRef.current === pageViewKey) return;
      const storageKey = "mazigho:independent:visitor-key";
      let visitorKey = window.sessionStorage.getItem(storageKey) || "";
      if (!/^[a-f0-9]{32}$/i.test(visitorKey)) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        visitorKey = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
        window.sessionStorage.setItem(storageKey, visitorKey);
      }
      trackedPageViewRef.current = pageViewKey;
      recordPageViewMutation.mutate({ slug: site.slug, visitorKey, path: activePage.slug || "/" });
    } catch {
      // Le suivi est facultatif : un navigateur qui bloque sessionStorage reste pleinement utilisable.
    }
  }, [activePage?.slug, isPreviewRoute, recordPageViewMutation, site?.slug]);

  useEffect(() => {
    const container = publicContentRef.current;
    if (!container || !site || !activePage) return;
    const imageElements = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
    imageElements.forEach((image) => {
      if (!image.getAttribute("src")?.trim()) image.src = PUBLIC_IMAGE_FALLBACK;
      image.addEventListener("error", () => {
        if (image.src !== PUBLIC_IMAGE_FALLBACK) image.src = PUBLIC_IMAGE_FALLBACK;
      }, { once: true });
    });
    return () => imageElements.forEach((image) => image.replaceWith(image.cloneNode(true)));
  }, [activePage, isPreviewRoute, site]);

  useEffect(() => {
    const container = publicContentRef.current;
    if (!container || isPreviewRoute || !site || !activePage) return;

    const findField = (form: HTMLFormElement, names: string[]) => {
      for (const name of names) {
        const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${name}"], #${name}`,
        );
        if (field?.value.trim()) return field.value.trim();
      }
      return "";
    };

    const handleSubmit = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      event.preventDefault();

      const name = findField(form, ["name", "nom", "fullName", "fullname"]);
      const email = findField(form, ["email", "e-mail", "courriel"]);
      const phone = findField(form, ["phone", "telephone", "tel"]);
      const message = findField(form, ["message", "comment", "comments", "demande"]);
      const honeypot = findField(form, ["website", "company", "organisation"]);

      if (!name || !email || !message) {
        toast.error("Veuillez renseigner votre nom, votre e-mail et votre message.");
        return;
      }

      const payload: Record<string, string> = {};
      for (const [key, value] of Array.from(new FormData(form).entries())) {
        if (typeof value === "string" && value.trim() && !["password", "website", "company"].includes(key)) {
          payload[key] = value.trim();
        }
      }

      submitFormMutation.mutate(
        {
          slug: site.slug,
          formType: form.dataset.formType || form.getAttribute("aria-label") || "contact",
          name,
          email,
          phone: phone || undefined,
          message,
          payload,
          honeypot: honeypot || undefined,
        },
        {
          onSuccess: () => {
            form.reset();
            toast.success("Votre message a bien été envoyé.", {
              description: "Nous reviendrons vers vous dès que possible.",
            });
          },
          onError: (error) => toast.error(error.message || "Impossible d’envoyer le formulaire."),
        },
      );
    };

    container.addEventListener("submit", handleSubmit);
    return () => container.removeEventListener("submit", handleSubmit);
  }, [activePage, isPreviewRoute, site, submitFormMutation]);

  const currentPreset =
    RESPONSIVE_DEVICE_PRESETS.find((preset) => preset.id === devicePresetId) ??
    RESPONSIVE_DEVICE_PRESETS[0];

  const handleSelectViewportGroup = (mode: ResponsiveViewportMode) => {
    if (mode === "desktop") setDevicePresetId("desktop");
    else if (mode === "tablet") setDevicePresetId("tablet-portrait");
    else setDevicePresetId("narrow-phone");
  };

  if (siteQuery.isLoading && !site) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#172033] text-white">
        <p className="text-sm text-slate-300">
          {isPreviewRoute
            ? "Chargement de la prévisualisation privée…"
            : "Chargement du site…"}
        </p>
      </main>
    );
  }

  if (!site || !activePage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#172033] px-6 text-center text-white">
        <Badge className="bg-[#9b563e]/30 text-[#f5b98f]">Constructeur de Sites Indépendant</Badge>
        <h1 className="mt-4 text-3xl font-semibold">Ce site indépendant n’est pas encore publié</h1>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          {isPreviewRoute
            ? "Ce brouillon est introuvable. Retournez dans l’éditeur pour enregistrer votre projet avant de le prévisualiser."
            : "Ce site n’a pas encore été mis en ligne par son propriétaire."}
        </p>
        {isPreviewRoute && (
          <Link href={buildPreviewReturnUrl({ siteId: queryParams.siteId, slug })}>
            <Button className="mt-6 bg-[#f5b98f] text-[#172033] hover:bg-[#e7a57a]">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retourner à l’éditeur
            </Button>
          </Link>
        )}
      </main>
    );
  }

  if (!isPreviewRoute && site.settings.maintenanceMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#172033] px-6 py-16 text-center text-white">
        <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5b98f] text-[#172033]">
            <Globe className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b98f]">{site.title}</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Site momentanément indisponible</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-300">
            {site.settings.maintenanceMessage}
          </p>
        </div>
      </main>
    );
  }

  const seoPreview = buildPageSeoPreview(activePage, site.slug);
  const editorReturnHref = buildPreviewReturnUrl({
    siteId: queryParams.siteId ?? (site.id > 0 ? site.id : null),
    slug: site.slug,
    pageSlug: activePage.slug,
  });

  const isPublicAthVahloulDemo = !isPreviewRoute && slug === "association-familiale-ath-vahloul" && !siteQuery.data;
  const siteLoginHref = `/connexion-administration?returnTo=${encodeURIComponent(`/administration-site?siteSlug=${site.slug}`)}`;
  const siteAdminLoginHref = `/connexion-administration?returnTo=${encodeURIComponent(`/administration-site?siteSlug=${site.slug}`)}`;
  const hasSiteAdministrationAccess = Boolean(user && (siteAccessQuery.data?.role || isPublicAthVahloulDemo));

  return (
    <div className={isPreviewRoute ? "min-h-screen bg-[#111827] text-slate-100" : "min-h-screen bg-white text-slate-900"}>
      {/* Les contrôles appartiennent uniquement à l’aperçu privé (/constructeur-sites/apercu/:slug), jamais au site public (/sites/:slug). */}
      {isPreviewRoute && (
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#172033]/95 px-4 py-3 backdrop-blur">
          {/* Bandeau explicite : une prévisualisation n’est jamais présentée comme une publication réelle */}
          <div
            role="status"
            className="mx-auto mb-3 flex max-w-7xl flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-100"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-400 font-bold text-[#172033] hover:bg-amber-400">
                {previewToken ? "APERÇU COLLABORATEUR (LECTURE SEULE)" : "MODE PRÉVISUALISATION PRIVÉE"}
              </Badge>
              <span>
                {previewToken
                  ? "Lien d’aperçu privé partagé en lecture seule. Aucune modification ni accès aux autres projets n’est autorisé."
                  : INDEPENDENT_BUILDER_HELP_GUIDES.workflowActions.previsualiser.description}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-200">
              {site.status === "published"
                ? `Une version est déjà publiée sur /sites/${site.slug}`
                : "Statut actuel : Brouillon non publié (invisible pour le public)"}
            </span>
          </div>

          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            {/* Repère visuel des 3 étapes : 1. Modifier | 2. Prévisualiser (actif) | 3. Publier */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!previewToken ? (
                <Link href={editorReturnHref}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#f5b98f] bg-slate-900 font-semibold text-[#f5b98f] hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#f5b98f]"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Retour à l’éditeur (Modifier)
                  </Button>
                </Link>
              ) : (
                <Badge
                  variant="outline"
                  className="border-sky-400/50 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200"
                >
                  Accès invité en lecture seule
                </Badge>
              )}

              <div
                aria-label="Parcours Modifier, Prévisualiser, Publier"
                className="hidden items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] sm:flex"
              >
                <Link href={editorReturnHref}>
                  <span className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Pencil className="h-3 w-3" />
                    1. Modifier
                  </span>
                </Link>
                <span className="text-slate-600">→</span>
                <span className="inline-flex items-center gap-1 rounded bg-[#f5b98f] px-2 py-0.5 font-bold text-[#172033]">
                  <Eye className="h-3 w-3" />
                  2. Prévisualiser (Aperçu privé)
                </span>
                <span className="text-slate-600">→</span>
                <Link href={editorReturnHref}>
                  <span className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    3. Publier dans l’éditeur
                  </span>
                </Link>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Globe className="h-4 w-4 text-[#f5b98f]" />
                  <span className="font-semibold text-white">{site.title}</span>
                  <Badge
                    variant="outline"
                    className={
                      site.status === "published"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    }
                  >
                    {site.status === "published"
                      ? "Aperçu privé (Site également publié)"
                      : "Aperçu privé · Brouillon non publié"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Page prévisualisée : <code className="text-[#f5b98f]">{activePage.slug}</code> —{" "}
                  {activePage.title} ({currentPreset.label})
                </p>
              </div>
            </div>

            {/* Sélecteur de pages & sous-menus */}
            <nav aria-label="Pages du site indépendant" className="flex flex-wrap items-center gap-1.5">
              {safePages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePageSlug(p.slug)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f] ${
                    activePage.id === p.id
                      ? "bg-[#f5b98f] text-[#172033]"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {p.parentPageId ? `↳ ${p.title}` : p.title}
                </button>
              ))}
            </nav>

            {/* Contrôles Responsive : Ordinateur / Tablette / Mobile + 5 formats précis */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Formats de prévisualisation responsive"
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1"
              >
                <button
                  type="button"
                  onClick={() => handleSelectViewportGroup("desktop")}
                  aria-pressed={currentPreset.viewportMode === "desktop"}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f] ${
                    currentPreset.viewportMode === "desktop"
                      ? "bg-white text-[#172033]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                  Ordinateur
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectViewportGroup("tablet")}
                  aria-pressed={currentPreset.viewportMode === "tablet"}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f] ${
                    currentPreset.viewportMode === "tablet"
                      ? "bg-white text-[#172033]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Tablet className="h-3.5 w-3.5" />
                  Tablette
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectViewportGroup("mobile")}
                  aria-pressed={currentPreset.viewportMode === "mobile"}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f] ${
                    currentPreset.viewportMode === "mobile"
                      ? "bg-white text-[#172033]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>

              <select
                aria-label="Choisir la taille d'écran exacte"
                value={devicePresetId}
                onChange={(e) => setDevicePresetId(e.target.value as ResponsiveDevicePresetId)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f]"
              >
                {RESPONSIVE_DEVICE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({preset.shortLabel})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowSeoBanner((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b98f] ${
                  showSeoBanner
                    ? "border-[#f5b98f] bg-[#9b563e]/30 text-[#f5b98f]"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                Aperçu SEO
              </button>
            </div>
          </div>

          {/* Bandeau d'inspection SEO pour la page active */}
          {showSeoBanner && (
            <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#f5b98f]" />
                  <span className="font-semibold text-white">
                    Aperçu Google & Référencement de la page active
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      seoPreview.robotsDirective === "index, follow"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    }
                  >
                    {seoPreview.robotsDirective === "index, follow"
                      ? "Indexable par Google"
                      : "Non indexée (noindex)"}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400">
                  URL canonique : {seoPreview.canonicalUrl}
                </span>
              </div>
              <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-emerald-400">{seoPreview.canonicalUrl}</p>
                <p className="mt-0.5 text-sm font-semibold text-sky-300">
                  {seoPreview.displayTitle}
                </p>
                <p className="mt-1 text-xs text-slate-300">{seoPreview.displayDescription}</p>
              </div>
              {seoPreview.recommendations.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] text-amber-200">
                  {seoPreview.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-300" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>
      )}

      {isPublicAthVahloulDemo && (
        <div
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900"
        >
          Démonstration ATH VAHLOUL — contenus imaginés à personnaliser avant toute mise en ligne réelle.
        </div>
      )}

      {!isPreviewRoute && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center justify-end">
            <div className="flex items-center gap-2">
              {!user && <Link href={siteLoginHref}><Button size="sm" variant="ghost" className="text-slate-600 hover:bg-white hover:text-slate-900">Se connecter</Button></Link>}
              {hasSiteAdministrationAccess && <Link href={user ? `/administration-site?siteSlug=${site.slug}` : siteAdminLoginHref}><Button size="sm" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Administration du site</Button></Link>}
            </div>
          </div>
        </div>
      )}

      {/* Cadre de rendu responsive */}
      <main className={isPreviewRoute ? "mx-auto flex justify-center p-3 md:p-6" : "min-h-screen"}>
        <div
          style={{
            width: isPreviewRoute ? currentPreset.widthCss : "100%",
            maxWidth: isPreviewRoute ? `${currentPreset.maxWidthPx}px` : "none",
            backgroundColor: site.theme.backgroundColor || "#faf8f5",
          }}
          className={isPreviewRoute ? "min-h-[82vh] overflow-x-hidden rounded-2xl border border-slate-700 bg-white text-slate-900 shadow-2xl transition-all duration-200 motion-reduce:transition-none" : "min-h-screen overflow-x-hidden bg-white text-slate-900"}
        >
          <style>
            {INDEPENDENT_RESPONSIVE_BASE_CSS}
            {"\n"}
            {sanitizeIndependentCss(activePage.css)}
          </style>
          <div
            ref={publicContentRef}
            onClick={(e) => {
              const anchor = (e.target as HTMLElement).closest("a");
              if (!anchor) return;
              const href = anchor.getAttribute("href") || "";
              if (href.startsWith("/")) {
                const targetSlug = href.split("#")[0] || "/";
                const targetPage = site.pages.find((p) => p.slug === targetSlug);
                if (targetPage) {
                  e.preventDefault();
                  setActivePageSlug(targetPage.slug);
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeIndependentHtml(activePage.html) }}
          />
        </div>
      </main>
    </div>
  );
}
