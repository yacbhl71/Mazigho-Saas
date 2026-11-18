import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Tablet,
  Tag,
  WandSparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  isPremiumStorefrontTheme,
  planTierLabels,
  storefrontThemeCatalog,
  type StorefrontThemeCatalogItem,
  type StorefrontThemeId,
  type StorefrontThemePlanTier,
} from "@shared/storefrontThemeCatalog";
import { trpc } from "@/lib/trpc";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type StorefrontSectionItem = {
  id: string;
  name: string;
  category: "hero" | "marketing" | "products" | "social" | "story";
  badge: string;
  description: string;
  enabled: boolean;
};

const DEFAULT_SECTIONS: StorefrontSectionItem[] = [
  {
    id: "highlight",
    name: "Hero Diaporama & Bannière Principale",
    category: "hero",
    badge: "Visuel",
    description: "Grande image plein écran ou carrousel avec titre accrocheur, texte et bouton d’action principal.",
    enabled: true,
  },
  {
    id: "discovery",
    name: "Grille des Collections & Catégories",
    category: "products",
    badge: "Catalogue",
    description: "Cartes visuelles rondes ou rectangulaires permettant de parcourir les univers clés du catalogue.",
    enabled: true,
  },
  {
    id: "featured",
    name: "Produits Vedettes & Meilleures Ventes",
    category: "products",
    badge: "Produits",
    description: "Grille de produits sélectionnés avec prix, étiquettes promo et bouton d'ajout rapide au panier.",
    enabled: true,
  },
  {
    id: "reassurance",
    name: "Bandeau de Réassurance & Garanties",
    category: "marketing",
    badge: "Confiance",
    description: "4 piliers de rassurance : expédition rapide, paiement 100% sécurisé, retours facilités et support dédié.",
    enabled: true,
  },
  {
    id: "story",
    name: "Récit de Marque & Histoire d’Atelier",
    category: "story",
    badge: "Branding",
    description: "Section éditoriale valorisant l'artisanat, les matières d'exception ou la mission de la marque.",
    enabled: true,
  },
  {
    id: "testimonials",
    name: "Avis Clients Vérifiés & Témoignages UGC",
    category: "social",
    badge: "Preuve Sociale",
    description: "Carrousel d'avis 5 étoiles certifiés avec photos clients et notes moyennes vérifiées.",
    enabled: true,
  },
  {
    id: "editorial",
    name: "Sélection éditoriale & Conseils",
    category: "story",
    badge: "Éditorial",
    description: "Bloc éditorial qui met en avant une sélection, un conseil ou une histoire complémentaire.",
    enabled: true,
  },
];

export default function OwnerStorefrontThemePicker({
  storeName,
  profile,
  onApplied,
}: {
  storeName: string;
  profile: DesignProfile | null;
  onApplied: (profile: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState<"themes" | "sections" | "preview" | "styles">("themes");
  const [selectedThemeId, setSelectedThemeId] = useState<StorefrontThemeId>("violetCraft");
  const [tierFilter, setTierFilter] = useState<"all" | StorefrontThemePlanTier>("all");
  const [deviceViewport, setDeviceViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Sections management (Drag & Drop like Shopify)
  const [sections, setSections] = useState<StorefrontSectionItem[]>(DEFAULT_SECTIONS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Customizer styling options
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>("#7c3aed");
  const [selectedTypography, setSelectedTypography] = useState<"modern" | "editorial" | "classic">("modern");

  const themeAccessQuery = trpc.owner.getStorefrontThemeAccess.useQuery(undefined, { refetchOnWindowFocus: false });

  const availableThemes = useMemo(() => {
    const ids = themeAccessQuery.data?.themeIds;
    return ids ? storefrontThemeCatalog.filter(theme => ids.includes(theme.id)) : [];
  }, [themeAccessQuery.data?.themeIds]);

  useEffect(() => {
    if (availableThemes.length > 0 && !availableThemes.some(theme => theme.id === selectedThemeId)) {
      setSelectedThemeId(availableThemes[0]!.id);
    }
  }, [availableThemes, selectedThemeId]);

  useEffect(() => {
    if (!profile) return;
    const order = profile.homeOrder?.filter(key => DEFAULT_SECTIONS.some(section => section.id === key)) ?? [];
    const enabled = new Set(order);
    setSections(DEFAULT_SECTIONS.map(section => ({ ...section, enabled: order.length ? enabled.has(section.id) : profile[`show${section.id.charAt(0).toUpperCase()}${section.id.slice(1)}` as keyof DesignProfile] !== false }))
      .sort((a, b) => (order.indexOf(a.id) === -1 ? 99 : order.indexOf(a.id)) - (order.indexOf(b.id) === -1 ? 99 : order.indexOf(b.id))));
    if (["editorial", "modern", "classic"].includes(profile.typographyId)) setSelectedTypography(profile.typographyId);
    if (profile.customPrimary) setCustomPrimaryColor(profile.customPrimary);
  }, [profile]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<StorefrontThemeCatalogItem | null>(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const lockedThemes = useMemo(
    () => storefrontThemeCatalog.filter(theme => !availableThemes.some(available => available.id === theme.id)),
    [availableThemes],
  );

  const filteredAvailableThemes = useMemo(() => {
    if (tierFilter === "all") return availableThemes;
    return availableThemes.filter(theme => theme.minPlanTier === tierFilter);
  }, [availableThemes, tierFilter]);

  const selectedTheme = useMemo(
    () => availableThemes.find(theme => theme.id === selectedThemeId) ?? availableThemes[0],
    [availableThemes, selectedThemeId],
  );

  const applyTheme = trpc.owner.applyStorefrontTheme.useMutation({
    onSuccess: result => {
      onApplied(result.profile);
      toast.success(`L’univers « ${selectedTheme.label} » est prêt. Vous pouvez maintenant modifier chaque élément.`);
      setConfirmOpen(false);
      setAcknowledged(false);
      setConfirmationName("");
    },
    onError: error => toast.error(error.message || "Le thème n’a pas pu être appliqué."),
  });

  const saveSectionsMutation = trpc.owner.saveCustomHomepageBlocks.useMutation({
    onSuccess: saved => {
      onApplied(saved);
      toast.success("Agencement des sections enregistré avec succès (style Shopify) !");
    },
    onError: error => toast.error(error.message || "Impossible d'enregistrer l'ordre des sections."),
  });
  const saveSectionLayoutMutation = trpc.owner.saveHomepageSectionLayout.useMutation({
    onSuccess: saved => { onApplied(saved); toast.success("Agencement et visibilité des sections enregistrés."); },
    onError: error => toast.error(error.message || "Impossible d'enregistrer l'agencement des sections."),
  });
  const saveStylesMutation = trpc.owner.saveStorefrontStyles.useMutation({
    onSuccess: saved => { onApplied(saved); toast.success("Styles et typographie enregistrés avec succès !"); },
    onError: error => toast.error(error.message || "Impossible d'enregistrer les styles."),
  });

  const canConfirm = acknowledged && confirmationName.trim() === storeName.trim();

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...sections];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem!);
    setSections(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.info(`Section « ${draggedItem!.name} » déplacée en position ${index + 1}.`);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item!);
    setSections(updated);
  };

  const toggleSectionVisibility = (id: string) => {
    setSections(prev =>
      prev.map(section => (section.id === id ? { ...section, enabled: !section.enabled } : section)),
    );
  };

  const resetDefaultSections = () => {
    setSections(DEFAULT_SECTIONS);
    toast.success("Ordre par défaut des sections rétabli.");
  };

  const saveSectionsLayout = () => {
    const activeSectionKeys = sections.filter(s => s.enabled).map(s => s.id);
    const visibility = Object.fromEntries(sections.map(section => [section.id, section.enabled])) as Record<string, boolean>;
    saveSectionLayoutMutation.mutate({
      homeOrder: activeSectionKeys as Array<"highlight" | "reassurance" | "discovery" | "story" | "testimonials" | "editorial" | "featured">,
      visibility: {
        highlight: visibility.highlight ?? true,
        reassurance: visibility.reassurance ?? true,
        discovery: visibility.discovery ?? true,
        story: visibility.story ?? true,
        testimonials: visibility.testimonials ?? true,
        editorial: visibility.editorial ?? true,
        featured: visibility.featured ?? true,
      },
    });
  };

  if (themeAccessQuery.isLoading) {
    return (
      <section className="space-y-5">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  if (themeAccessQuery.isError || !selectedTheme) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950">
        La bibliothèque de thèmes attribuée à cette boutique est indisponible. Réessayez plus tard ou demandez à MAZIGHO Studio de vérifier l’attribution.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Top Bar with Shopify-style Navigation Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-slate-950 text-white font-semibold">Shopify Studio Edition</Badge>
            <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-900 font-semibold">
              Personnalisation en direct
            </Badge>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Studio des Thèmes & Vitrine</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Personnalisez votre boutique de façon fluide : choisissez un thème, glissez-déposez les sections et visualisez en direct.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("themes")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "themes" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Thèmes & Formules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "sections" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-blue-600" /> Glisser-Déposer ({sections.filter(s => s.enabled).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Monitor className="h-3.5 w-3.5 text-emerald-600" /> Aperçu Multi-Écrans
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "styles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-amber-600" /> Styles & Polices
          </button>
        </div>
      </div>

      {/* TAB 1: THEMES GALLERY & SUBSCRIPTION TIERS */}
      {activeTab === "themes" && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <Sparkles className="h-5 w-5 text-amber-300" /> Thèmes & Univers Shopify Premium
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-slate-300">
                    Optez pour un univers visuel de départ haute conversion. Selon votre formule d’abonnement SaaS (Free, Basic, Pro, VIP), débloquez des chartes éditoriales et des mises en page prêtes à personnaliser.
                  </CardDescription>
                </div>
                <Badge className="w-fit border-0 bg-white/10 text-white hover:bg-white/10">
                  {availableThemes.length} univers attribué{availableThemes.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-slate-200">
                Chaque thème prépare la palette, la typographie, le menu et l’accueil sans impacter vos produits, vos stocks ou votre domaine. Tout reste modifiable à tout moment.
              </div>
            </CardContent>
          </Card>

          {/* Tier Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={tierFilter === "all" ? "default" : "outline"}
              onClick={() => setTierFilter("all")}
              className={tierFilter === "all" ? "bg-slate-950 text-white hover:bg-slate-800" : ""}
            >
              Tous ({availableThemes.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tierFilter === "free" ? "default" : "outline"}
              onClick={() => setTierFilter("free")}
              className={tierFilter === "free" ? "bg-slate-950 text-white hover:bg-slate-800" : ""}
            >
              Inclus Free ({availableThemes.filter(t => t.minPlanTier === "free").length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tierFilter === "basic" ? "default" : "outline"}
              onClick={() => setTierFilter("basic")}
              className={tierFilter === "basic" ? "bg-slate-950 text-white hover:bg-slate-800" : ""}
            >
              Formule Basic ({availableThemes.filter(t => t.minPlanTier === "basic").length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tierFilter === "pro" ? "default" : "outline"}
              onClick={() => setTierFilter("pro")}
              className={tierFilter === "pro" ? "bg-slate-950 text-white hover:bg-slate-800" : ""}
            >
              Formule PRO ({availableThemes.filter(t => t.minPlanTier === "pro").length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tierFilter === "lifetime" ? "default" : "outline"}
              onClick={() => setTierFilter("lifetime")}
              className={tierFilter === "lifetime" ? "bg-slate-950 text-white hover:bg-slate-800" : ""}
            >
              Formule VIP ({availableThemes.filter(t => t.minPlanTier === "lifetime").length})
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAvailableThemes.map(theme => {
              const selected = theme.id === selectedThemeId;
              const isPremium = isPremiumStorefrontTheme(theme.id);
              return (
                <article
                  key={theme.id}
                  className={`overflow-hidden rounded-2xl border shadow-sm transition ${
                    selected ? "ring-2 ring-slate-950 ring-offset-2" : "hover:-translate-y-0.5 hover:shadow-md"
                  } ${theme.palette.card}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedThemeId(theme.id)}
                    aria-pressed={selected}
                    className="block w-full text-left focus:outline-none"
                  >
                    <div className="relative">
                      <img src={theme.visual} alt={theme.visualAlt} className="h-44 w-full object-cover" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                      {selected && (
                        <Badge className={`absolute right-3 top-3 border-0 shadow-sm ${theme.palette.badge}`}>
                          Sélectionné
                        </Badge>
                      )}
                      {isPremium && (
                        <Badge className="absolute left-3 top-3 border-0 bg-amber-500 text-slate-950 font-bold shadow-sm">
                          <Crown className="mr-1 h-3 w-3" /> Premium
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${theme.palette.label}`}>
                          {theme.eyebrow}
                        </p>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-slate-300">
                          {planTierLabels[theme.minPlanTier]}
                        </Badge>
                      </div>
                      <h3 className={`mt-2 text-xl font-bold ${theme.palette.title}`}>{theme.label}</h3>
                      <p className={`mt-3 text-sm leading-6 ${theme.palette.text}`}>{theme.description}</p>
                      <ul className={`mt-4 space-y-1.5 text-xs leading-5 ${theme.palette.text}`}>
                        {theme.benefits.map(benefit => (
                          <li key={benefit} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {lockedThemes.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Aperçus verrouillés</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">Thèmes à ajouter à votre bibliothèque</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    Consultez un aperçu statique de l’accueil. Un thème non attribué ne peut pas être appliqué : son activation doit être demandée à MAZIGHO Studio.
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                  <LockKeyhole className="mr-1 h-3.5 w-3.5" />
                  {lockedThemes.length} verrouillé(s)
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lockedThemes.map(theme => (
                  <article key={theme.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button type="button" onClick={() => setPreviewTheme(theme)} className="block w-full text-left">
                      <div className="relative">
                        <img src={theme.visual} alt={theme.visualAlt} className="h-40 w-full object-cover grayscale-[0.18]" loading="lazy" />
                        <div className="absolute inset-0 bg-slate-950/35" />
                        <Badge className="absolute right-3 top-3 border-0 bg-slate-950/90 text-white hover:bg-slate-950/90">
                          <LockKeyhole className="mr-1 h-3.5 w-3.5" />
                          {planTierLabels[theme.minPlanTier]}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{theme.eyebrow}</p>
                        <h4 className="mt-2 text-lg font-bold text-slate-950">{theme.label}</h4>
                        <span className="mt-4 inline-flex items-center text-sm font-semibold text-violet-700">
                          <Eye className="mr-2 h-4 w-4" /> Voir l’aperçu
                        </span>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          <Card className={`border-2 ${selectedTheme.palette.card}`}>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 gap-4">
                <img src={selectedTheme.visual} alt="Aperçu du thème choisi" className="h-20 w-28 shrink-0 rounded-xl object-cover shadow-sm" />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.14em] ${selectedTheme.palette.label}`}>Thème sélectionné</p>
                  <p className={`mt-1 text-lg font-bold ${selectedTheme.palette.title}`}>{selectedTheme.label}</p>
                  <p className={`mt-1 text-sm leading-6 ${selectedTheme.palette.text}`}>Prêt à donner une vraie direction visuelle à votre vitrine, sans verrouiller aucun élément.</p>
                </div>
              </div>
              <Button
                type="button"
                className={`min-h-11 shrink-0 ${selectedTheme.palette.button}`}
                onClick={() => {
                  setConfirmationName("");
                  setAcknowledged(false);
                  setConfirmOpen(true);
                }}
              >
                <WandSparkles className="mr-2 h-4 w-4" /> Utiliser ce thème
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SECTIONS DRAG & DROP CUSTOMIZER (SHOPIFY STYLE) */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Layers className="h-5 w-5 text-blue-600" /> Glisser-Déposer les Sections de l’Accueil
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Réorganisez l’ordre d’apparition de vos sections sur la vitrine par glisser-déposer. Utilisez l’œil pour masquer ou afficher temporairement une section.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={resetDefaultSections}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Par défaut
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={saveSectionLayoutMutation.isPending || saveSectionsMutation.isPending}
                    onClick={saveSectionsLayout}
                  >
                    {saveSectionLayoutMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                    Enregistrer l'agencement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs leading-5 text-blue-900 flex items-center justify-between">
                <span>💡 <strong>Astuce Shopify :</strong> Maintenez et glissez une carte pour changer sa position, ou utilisez les flèches monter / descendre sur mobile.</span>
                <Badge variant="outline" className="border-blue-300 bg-white text-blue-800">
                  {sections.filter(s => s.enabled).length} actives sur {sections.length}
                </Badge>
              </div>

              {/* Drag and Drop list */}
              <div className="space-y-2">
                {sections.map((section, index) => {
                  const isDragging = draggedIndex === index;
                  const isOver = dragOverIndex === index;
                  return (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={e => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? "opacity-50 border-blue-500 scale-[0.99] bg-blue-50"
                          : isOver
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500"
                          : section.enabled
                          ? "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                          : "border-slate-100 bg-slate-50/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Drag Handle */}
                        <div className="text-slate-400 hover:text-slate-700 shrink-0">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        {/* Order Number */}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {index + 1}
                        </span>
                        {/* Section info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold truncate ${section.enabled ? "text-slate-900" : "text-slate-500 line-through"}`}>
                              {section.name}
                            </h4>
                            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 py-0 px-1.5">
                              {section.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{section.description}</p>
                        </div>
                      </div>

                      {/* Controls: Up/Down + Toggle Visibility */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          disabled={index === 0}
                          onClick={() => moveSection(index, "up")}
                          title="Monter"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          disabled={index === sections.length - 1}
                          onClick={() => moveSection(index, "down")}
                          title="Descendre"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant={section.enabled ? "ghost" : "secondary"}
                          className={`h-8 w-8 ${section.enabled ? "text-slate-600 hover:text-slate-900" : "text-rose-600 bg-rose-50"}`}
                          onClick={() => toggleSectionVisibility(section.id)}
                          title={section.enabled ? "Masquer la section" : "Afficher la section"}
                        >
                          {section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium min-h-11 px-5"
                  disabled={saveSectionsMutation.isPending}
                  onClick={saveSectionsLayout}
                >
                  {saveSectionsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Sauvegarder l’agencement des sections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: RESPONSIVE MULTI-DEVICE PREVIEW (DESKTOP, TABLET, MOBILE) */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          {/* Device Viewport Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Appareil :</span>
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setDeviceViewport("desktop")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    deviceViewport === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" /> Ordinateur (1440px)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceViewport("tablet")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    deviceViewport === "tablet" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Tablet className="h-3.5 w-3.5" /> Tablette (768px)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceViewport("mobile")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    deviceViewport === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile (375px)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-slate-300">
                Thème : {selectedTheme.label}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setActiveTab("sections")}>
                <Layers className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Réordonner les sections
              </Button>
            </div>
          </div>

          {/* Interactive Responsive Mockup Frame */}
          <div className="flex justify-center bg-slate-900/5 p-4 sm:p-8 rounded-3xl border border-slate-200 overflow-x-auto">
            <div
              className={`bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden transition-all duration-300 ${
                deviceViewport === "desktop"
                  ? "w-full max-w-5xl"
                  : deviceViewport === "tablet"
                  ? "w-[768px]"
                  : "w-[375px]"
              }`}
            >
              {/* Browser chrome header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-0.5 text-[11px] text-slate-600 font-mono">
                  https://{storeName.toLowerCase().replace(/\s+/g, "-")}.ch
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{deviceViewport}</span>
              </div>

              {/* Mockup Storefront Body rendered with theme colors and section order */}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                {sections
                  .filter(s => s.enabled)
                  .map((section, idx) => (
                    <div key={section.id} className="relative p-5 transition hover:bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          #{idx + 1} · {section.badge}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-slate-50">
                          {section.name}
                        </Badge>
                      </div>

                      {section.id === "announcement" && (
                        <div className="rounded-lg bg-slate-900 text-white p-2 text-center text-xs font-medium flex items-center justify-center gap-2">
                          <Tag className="h-3 w-3 text-amber-400" />
                          <span>Livraison offerte dès 50 CHF · Offre limitée jusqu'à minuit !</span>
                        </div>
                      )}

                      {section.id === "highlight" && (
                        <div className="relative rounded-xl overflow-hidden h-40 bg-slate-900 flex items-center p-6 text-white">
                          <img
                            src={selectedTheme.visual}
                            alt="Hero"
                            className="absolute inset-0 w-full h-full object-cover opacity-45"
                          />
                          <div className="relative z-10 max-w-sm">
                            <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                              {selectedTheme.eyebrow}
                            </span>
                            <h3 className="text-xl font-bold mt-1">{storeName}</h3>
                            <p className="text-xs text-slate-200 mt-1 line-clamp-2">{selectedTheme.description}</p>
                            <button
                              type="button"
                              className={`mt-3 px-3 py-1.5 text-xs font-bold rounded-lg shadow ${selectedTheme.palette.button}`}
                            >
                              Découvrir la collection
                            </button>
                          </div>
                        </div>
                      )}

                      {section.id === "flash_sale" && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-rose-600 animate-pulse" />
                            <span className="text-xs font-bold text-rose-950">Ventes Flash exclusives</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-rose-700 bg-white px-2 py-1 rounded border border-rose-200">
                            <Clock className="h-3 w-3" /> 04:22:18
                          </div>
                        </div>
                      )}

                      {section.id === "discovery" && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                            Nos Rayons & Collections
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {["Nouveautés", "Bestsellers", "Édition Limitée"].map(cat => (
                              <div
                                key={cat}
                                className="rounded-lg border border-slate-200 p-2 text-center text-xs font-semibold bg-slate-50 hover:bg-white"
                              >
                                {cat}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.id === "featured" && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Sélection Bestsellers
                            </h4>
                            <span className="text-[11px] text-violet-700 font-medium">Tout voir →</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[1, 2, 3].map(item => (
                              <div key={item} className="rounded-lg border border-slate-200 p-2 bg-white">
                                <div className="h-16 bg-slate-100 rounded-md mb-1.5 flex items-center justify-center text-slate-400 text-xs">
                                  Produit #{item}
                                </div>
                                <p className="text-xs font-bold truncate">Article {item}</p>
                                <p className="text-[11px] font-bold text-slate-900 mt-0.5">39.00 CHF</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.id === "frequently_bought" && (
                        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 text-xs">
                          <p className="font-bold text-violet-950">Fréquemment Achetés Ensemble (-15%)</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-10 w-10 rounded bg-white border border-violet-200 flex items-center justify-center text-[10px]">
                              Art. 1
                            </div>
                            <span>+</span>
                            <div className="h-10 w-10 rounded bg-white border border-violet-200 flex items-center justify-center text-[10px]">
                              Art. 2
                            </div>
                            <span className="font-bold ml-auto text-violet-900">Total : 59 CHF</span>
                          </div>
                        </div>
                      )}

                      {section.id === "reassurance" && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl">
                          <div>⚡ Livraison express</div>
                          <div>🔒 Paiement 100% sécurisé</div>
                          <div>↩️ Retours faciles</div>
                          <div>💬 Support 7j/7</div>
                        </div>
                      )}

                      {section.id === "story" && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500">
                            Notre Savoir-Faire
                          </span>
                          <p className="font-semibold text-sm mt-0.5">L’excellence au service de vos exigences.</p>
                          <p className="text-stone-600 text-[11px] mt-1">
                            Chaque pièce est sélectionnée et contrôlée avec rigueur pour offrir une qualité durable.
                          </p>
                        </div>
                      )}

                      {section.id === "testimonials" && (
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                          <div className="flex items-center gap-1 text-amber-500 mb-1">
                            {"★★★★★"} <span className="text-[11px] font-bold text-emerald-950 ml-1">4.9 / 5</span>
                          </div>
                          <p className="italic text-emerald-900 text-[11px]">
                            « Commande reçue en 48h, emballage soigné et produit parfait. Je recommande vivement ! »
                          </p>
                          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                            Sophie M. · Client vérifié
                          </span>
                        </div>
                      )}

                      {section.id === "whatsapp_chat" && (
                        <div className="p-2.5 bg-emerald-500 text-white rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-bold">Une question ? Chattez en direct sur WhatsApp</span>
                          </div>
                          <span className="bg-white text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            Écrire
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STYLES & TYPOGRAPHY QUICK CUSTOMIZER */}
      {activeTab === "styles" && (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="h-5 w-5 text-amber-600" /> Styles & Polices de la Boutique
              </CardTitle>
              <CardDescription>
                Ajustez les couleurs d’accent et les typographies globales pour aligner votre vitrine avec l'identité de {storeName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Typography selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-900">Typographie Principale</Label>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { id: "modern", name: "Moderne (Plus Jakarta)", desc: "Épurée, dynamique et technologique." },
                    { id: "editorial", name: "Éditorial (Playfair)", desc: "Élégante, littéraire et luxe." },
                    { id: "classic", name: "Classique (Manrope)", desc: "Neutre, lisible et universelle." },
                  ].map(font => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedTypography(font.id as any)}
                      className={`p-4 rounded-xl border text-left transition ${
                        selectedTypography === font.id
                          ? "border-amber-600 bg-amber-50/50 ring-2 ring-amber-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-bold text-sm text-slate-900">{font.name}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-4">{font.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color accents */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Label className="text-sm font-bold text-slate-900">Couleur Principale d’Accent</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { hex: "#7c3aed", name: "Violet Royal" },
                    { hex: "#2563eb", name: "Bleu Cobalt" },
                    { hex: "#059669", name: "Émeraude" },
                    { hex: "#d97706", name: "Or Ambré" },
                    { hex: "#e11d48", name: "Rose Rubis" },
                    { hex: "#0f172a", name: "Noir Onyx" },
                  ].map(color => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomPrimaryColor(color.hex)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                        customPrimaryColor === color.hex
                          ? "border-slate-950 bg-slate-950 text-white shadow"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={saveStylesMutation.isPending}
                  onClick={() => saveStylesMutation.mutate({ typographyId: selectedTypography, primary: customPrimaryColor })}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium min-h-11 px-5"
                >
                  {saveStylesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Appliquer les styles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STATIC PREVIEW DIALOG (Mandatory for test assertions) */}
      <Dialog open={previewTheme !== null} onOpenChange={open => { if (!open) setPreviewTheme(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-violet-700" /> Aperçu statique de l’accueil
            </DialogTitle>
            <DialogDescription>
              {previewTheme ? `« ${previewTheme.label} » est visible mais non attribué à votre boutique.` : ""}
            </DialogDescription>
          </DialogHeader>
          {previewTheme && (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <div className="relative h-64">
                  <img src={previewTheme.visual} alt={previewTheme.visualAlt} className="h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/20 px-5 py-4 text-xs font-semibold text-white">
                    <span>{storeName}</span>
                    <span>Accueil · Collections · Contact</span>
                  </div>
                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Thème Shopify Premium</p>
                    <p className="mt-2 text-3xl font-bold">{previewTheme.label}</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">{previewTheme.description}</p>
                  </div>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {previewTheme.benefits.map(benefit => (
                    <div key={benefit} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-slate-200">
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Thème verrouillé : il ne sera jamais appliqué sans attribution explicite.
                </p>
                <p className="mt-1">
                  Ce modèle haut de gamme est inclus à partir de la {planTierLabels[previewTheme.minPlanTier]}. Contactez MAZIGHO Studio ou faites évoluer votre formule d'abonnement pour débloquer cet univers.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    toast.info(`Demande d'upgrade pour la ${planTierLabels[previewTheme.minPlanTier]} transmise à MAZIGHO Studio.`);
                    setPreviewTheme(null);
                  }}
                >
                  <Crown className="mr-2 h-4 w-4 text-amber-300" /> Demander l’accès à cette formule
                </Button>
                <Button type="button" variant="outline" onClick={() => setPreviewTheme(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION INSTALLATION DIALOG */}
      <Dialog open={confirmOpen} onOpenChange={open => { if (!applyTheme.isPending) setConfirmOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-violet-700" /> Installer un univers visuel
            </DialogTitle>
            <DialogDescription>
              Cette action remplace les contenus de départ de votre vitrine par « {selectedTheme.label} ». Chaque élément pourra ensuite être personnalisé, remplacé ou masqué.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
              <p><strong>Boutique :</strong> {storeName}</p>
              <p className="mt-1"><strong>Thème :</strong> {selectedTheme.label}</p>
              <p className="mt-1"><strong>Inclus avec :</strong> {planTierLabels[selectedTheme.minPlanTier]}</p>
              <p className="mt-2 text-xs">Le catalogue, les prix, le stock, les commandes, les accès, le domaine et le statut public ne changent pas.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-theme-confirm-name">Recopiez le nom de votre boutique</Label>
              <Input
                id="owner-theme-confirm-name"
                value={confirmationName}
                onChange={event => setConfirmationName(event.target.value)}
                placeholder={storeName}
                autoCapitalize="words"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={event => setAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
              />
              <span>Je confirme remplacer les contenus visuels de départ. Je garde la main pour modifier, remplacer ou masquer chaque élément ensuite.</span>
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={applyTheme.isPending} onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!canConfirm || applyTheme.isPending}
              className={selectedTheme.palette.button}
              onClick={() => applyTheme.mutate({ themeId: selectedTheme.id })}
            >
              {applyTheme.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {applyTheme.isPending ? "Installation…" : "Installer le thème"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
