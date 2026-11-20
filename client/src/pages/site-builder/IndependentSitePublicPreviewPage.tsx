import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  INDEPENDENT_SITE_TEMPLATES,
  RESPONSIVE_VIEWPORTS,
  type ResponsiveViewportMode,
} from "@shared/isolatedSiteBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Globe, Laptop, Smartphone, Tablet } from "lucide-react";

export default function IndependentSitePublicPreviewPage() {
  const [, previewParams] = useRoute("/constructeur-sites/apercu/:slug");
  const [, publicParams] = useRoute("/sites/:slug");
  const slug = previewParams?.slug || publicParams?.slug || "association-familiale-ath-vahloul";
  const isPreviewRoute = Boolean(previewParams?.slug);

  const [viewport, setViewport] = useState<ResponsiveViewportMode>("desktop");
  const [activePageSlug, setActivePageSlug] = useState<string>("/");

  const siteQuery = trpc.independentSiteBuilder.getPublicSiteBySlug.useQuery(
    { slug },
    { retry: false, refetchOnWindowFocus: false }
  );

  // Fallback to the built-in ATH VAHLOUL demonstration template if someone visits
  // /constructeur-sites/apercu/association-familiale-ath-vahloul before saving in DB.
  const fallbackDemoSite = useMemo(() => {
    if (slug.includes("ath-vahloul")) {
      const tpl = INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === ATH_VAHLOUL_DEMO_TEMPLATE_ID);
      if (tpl) {
        return {
          id: 0,
          slug: "association-familiale-ath-vahloul",
          title: tpl.name,
          siteType: tpl.siteType,
          status: "published" as const,
          theme: tpl.theme,
          navigation: tpl.navigation,
          pages: tpl.pages,
          publishedAt: new Date().toISOString(),
        };
      }
    }
    return null;
  }, [slug]);

  const site = siteQuery.data ?? fallbackDemoSite;

  const activePage = useMemo(() => {
    if (!site || !site.pages.length) return null;
    return site.pages.find((p) => p.slug === activePageSlug) ?? site.pages[0];
  }, [site, activePageSlug]);

  const currentViewport =
    RESPONSIVE_VIEWPORTS.find((v) => v.id === viewport) ?? RESPONSIVE_VIEWPORTS[0];

  if (siteQuery.isLoading && !site) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">Chargement du site indépendant…</p>
      </main>
    );
  }

  if (!site || !activePage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <Badge className="bg-amber-500/20 text-amber-200">Constructeur de Sites Indépendant</Badge>
        <h1 className="mt-4 text-3xl font-semibold">Ce site indépendant n’est pas encore publié</h1>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          Ouvrez le Constructeur de Sites Internet Indépendant pour concevoir vos pages, prévisualiser votre brouillon ou publier votre site.
        </p>
        <Link href="/constructeur-sites">
          <Button className="mt-6 bg-white text-slate-950 hover:bg-slate-200">
            Ouvrir le Constructeur de Sites
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Barre supérieure de prévisualisation et navigation multi-pages */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isPreviewRoute && (
              <Link href="/constructeur-sites">
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Retour à l’éditeur
                </Button>
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-white">{site.title}</span>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                  {site.status === "published" ? "Site publié (Sans boutique)" : "Aperçu brouillon"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Page active : <code className="text-amber-300">{activePage.slug}</code> — {activePage.title}
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
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activePage.id === p.id
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {p.parentPageId ? `↳ ${p.title}` : p.title}
              </button>
            ))}
          </nav>

          {/* Contrôles Responsive : Ordinateur / Tablette / Mobile */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
                viewport === "desktop" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              Ordinateur
            </button>
            <button
              type="button"
              onClick={() => setViewport("tablet")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
                viewport === "tablet" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              Tablette
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
                viewport === "mobile" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>
        </div>
      </header>

      {/* Cadre de rendu responsive */}
      <main className="mx-auto flex justify-center p-4 md:p-8">
        <div
          style={{
            width: currentViewport.widthCss,
            maxWidth: `${currentViewport.maxWidthPx}px`,
            backgroundColor: site.theme.backgroundColor || "#faf8f5",
          }}
          className="min-h-[82vh] overflow-hidden rounded-2xl border border-slate-700 bg-white text-slate-900 shadow-2xl transition-all duration-200"
        >
          <style>{activePage.css}</style>
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
            dangerouslySetInnerHTML={{ __html: activePage.html }}
          />
        </div>
      </main>
    </div>
  );
}
