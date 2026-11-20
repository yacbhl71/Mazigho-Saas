import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  INDEPENDENT_RESPONSIVE_BASE_CSS,
  INDEPENDENT_SITE_TEMPLATES,
  RESPONSIVE_DEVICE_PRESETS,
  buildPageSeoPreview,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  type ResponsiveDevicePresetId,
  type ResponsiveViewportMode,
} from "@shared/isolatedSiteBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Globe, Laptop, Search, Smartphone, Tablet } from "lucide-react";

export default function IndependentSitePublicPreviewPage() {
  const [, previewParams] = useRoute("/constructeur-sites/apercu/:slug");
  const [, publicParams] = useRoute("/sites/:slug");
  const slug = previewParams?.slug || publicParams?.slug || "association-familiale-ath-vahloul";
  const isPreviewRoute = Boolean(previewParams?.slug);

  const [devicePresetId, setDevicePresetId] = useState<ResponsiveDevicePresetId>("desktop");
  const [activePageSlug, setActivePageSlug] = useState<string>("/");
  const [showSeoBanner, setShowSeoBanner] = useState<boolean>(false);

  const siteQuery = trpc.independentSiteBuilder.getPublicSiteBySlug.useQuery(
    { slug },
    { retry: false, refetchOnWindowFocus: false }
  );

  // Fallback to built-in demonstration templates if someone visits
  // /constructeur-sites/apercu/:slug before saving in DB.
  const fallbackDemoSite = useMemo(() => {
    const matchedTemplate =
      INDEPENDENT_SITE_TEMPLATES.find((t) => slug.includes(t.id.replace("template-", ""))) ??
      (slug.includes("ath-vahloul")
        ? INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === ATH_VAHLOUL_DEMO_TEMPLATE_ID)
        : null);

    if (matchedTemplate) {
      return {
        id: 0,
        slug,
        title: matchedTemplate.name,
        siteType: matchedTemplate.siteType,
        status: "published" as const,
        theme: matchedTemplate.theme,
        navigation: matchedTemplate.navigation,
        pages: matchedTemplate.pages,
        publishedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [slug]);

  const site = siteQuery.data ?? fallbackDemoSite;

  const activePage = useMemo(() => {
    if (!site || !site.pages.length) return null;
    return site.pages.find((p) => p.slug === activePageSlug) ?? site.pages[0];
  }, [site, activePageSlug]);

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
        <p className="text-sm text-slate-300">Chargement de l’aperçu du site indépendant…</p>
      </main>
    );
  }

  if (!site || !activePage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#172033] px-6 text-center text-white">
        <Badge className="bg-[#9b563e]/30 text-[#f5b98f]">Constructeur de Sites Indépendant</Badge>
        <h1 className="mt-4 text-3xl font-semibold">Ce site indépendant n’est pas encore publié</h1>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          Ouvrez le Constructeur de Sites Internet Indépendant pour concevoir vos pages, prévisualiser votre brouillon ou publier votre site.
        </p>
        <Link href="/constructeur-sites">
          <Button className="mt-6 bg-[#f5b98f] text-[#172033] hover:bg-[#e7a57a]">
            Ouvrir le Constructeur de Sites
          </Button>
        </Link>
      </main>
    );
  }

  const seoPreview = buildPageSeoPreview(activePage, site.slug);

  return (
    <div className="min-h-screen bg-[#111827] text-slate-100">
      {/* Les contrôles appartiennent uniquement à l’aperçu privé, jamais au site public. */}
      {isPreviewRoute && <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#172033]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isPreviewRoute && (
              <Link href="/constructeur-sites">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#f5b98f]"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Retour à l’éditeur
                </Button>
              </Link>
            )}
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
                  {site.status === "published" ? "Publié (Sans boutique)" : "Aperçu Brouillon"}
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Page active : <code className="text-[#f5b98f]">{activePage.slug}</code> — {activePage.title}
              </p>
            </div>
          </div>

          {/* Sélecteur de pages & sous-menus */}
          <nav aria-label="Pages du site indépendant" className="flex flex-wrap items-center gap-1.5">
            {site.pages.map((p) => (
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
            <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => handleSelectViewportGroup("desktop")}
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

            {isPreviewRoute && (
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
            )}
          </div>
        </div>

        {/* Bandeau d'inspection SEO pour la page active */}
        {isPreviewRoute && showSeoBanner && (
          <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#f5b98f]" />
                <span className="font-semibold text-white">Aperçu Google & Référencement de la page active</span>
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
              <p className="mt-0.5 text-sm font-semibold text-sky-300">{seoPreview.displayTitle}</p>
              <p className="mt-1 text-xs text-slate-300">{seoPreview.displayDescription}</p>
            </div>
          </div>
        )}
      </header>}

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
