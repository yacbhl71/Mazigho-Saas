import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Columns,
  Copy,
  Eye,
  EyeOff,
  FileEdit,
  HelpCircle,
  History,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Monitor,
  Package,
  Plus,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
  SplitSquareHorizontal,
  Tablet,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import type {
  DesignProfile,
  HomeFaqItem,
  HomeStatItem,
  HomeTextBanner,
  HomeTextBannerLayout,
  RoundGalleryItem,
} from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BASE_SECTION_KEYS = ["highlight", "reassurance", "discovery", "story", "testimonials", "editorial", "featured"];

const layoutOptions: Array<{ value: HomeTextBannerLayout; label: string; description: string }> = [
  { value: "banner", label: "Bannière", description: "Texte large, image optionnelle en fond." },
  { value: "split", label: "Texte + image", description: "Deux colonnes élégantes, adaptées aux produits ou services." },
  { value: "framedSplit", label: "Texte + image encadrée", description: "Deux colonnes avec un visuel entouré d’une marge de respiration." },
  { value: "spotlight", label: "Mise en avant", description: "Encart lumineux pour une nouveauté, un atelier ou une offre." },
  { value: "roundGallery", label: "Galerie ronde", description: "Texte éditorial suivi de 2 à 6 visuels ronds, sans cartes." },
  { value: "productGrid", label: "Sélection Produits (Mini-Collection)", description: "Affiche 2 à 4 produits réels du catalogue avec prix en direct et bouton d’achat." },
  { value: "countdownBanner", label: "Compte à rebours / Offre Flash", description: "Bannière d’urgence avec compteur Jours / Heures / Minutes / Secondes en temps réel." },
  { value: "beforeAfter", label: "Curseur Avant / Après", description: "Comparateur visuel interactif idéal pour démontrer un résultat, un soin ou une création." },
  { value: "faqAccordion", label: "Questions Fréquentes (FAQ)", description: "Accordéon de questions-réponses pour lever les freins à l’achat sur l’accueil." },
  { value: "statsCounter", label: "Chiffres Clés & Preuve Sociale", description: "Bandeau de 2 à 4 indicateurs marquants (clients satisfaits, création artisanale, expédition)." },
];

const themeOptions: Array<{ value: NonNullable<HomeTextBanner["theme"]>; label: string }> = [
  { value: "primary", label: "Couleur de la boutique" },
  { value: "dark", label: "Sombre" },
  { value: "soft", label: "Doux" },
  { value: "light", label: "Clair" },
];

const visibilityOptions: Array<{ value: NonNullable<HomeTextBanner["visibilityDevice"]>; label: string }> = [
  { value: "all", label: "Tous les écrans (Ordinateur & Mobile)" },
  { value: "desktop", label: "Ordinateur uniquement" },
  { value: "mobile", label: "Mobile uniquement" },
];

const focalPointOptions: Array<{ value: NonNullable<HomeTextBanner["imageFocalPoint"]>; label: string }> = [
  { value: "center", label: "Centré (par défaut)" },
  { value: "top", label: "Haut (visage / détail supérieur)" },
  { value: "bottom", label: "Bas (produit au premier plan)" },
];

export type EditableBlock = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  layout: HomeTextBannerLayout;
  theme: "primary" | "dark" | "soft" | "light";
  galleryItems: RoundGalleryItem[];
  productIds?: number[];
  countdownEndsAt?: string;
  secondaryImageUrl?: string;
  beforeLabel?: string;
  afterLabel?: string;
  faqItems?: HomeFaqItem[];
  statItems?: HomeStatItem[];
  visibilityDevice?: "all" | "mobile" | "desktop";
  imageFocalPoint?: "top" | "center" | "bottom";
  enabled: boolean;
};

type BlockPreset = {
  id: string;
  label: string;
  badge: string;
  description: string;
  create: () => Omit<EditableBlock, "id">;
};

function createGalleryItem(label = "Nouvel univers"): RoundGalleryItem {
  return {
    id: `circle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    label,
    imageUrl: "",
    imageAlt: "",
    href: "/boutique",
  };
}

function createFaqItem(question = "Quels sont vos délais de livraison ?", answer = "Nos commandes sont préparées avec soin sous 24 à 48h ouvrées avec suivi complet."): HomeFaqItem {
  return {
    id: `faq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    question,
    answer,
  };
}

function createStatItem(value = "98%", label = "Clients satisfaits"): HomeStatItem {
  return {
    id: `stat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    value,
    label,
  };
}

const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: "collection-launch",
    label: "Lancement de Collection",
    badge: "Texte + image",
    description: "Deux colonnes éditoriales pour présenter une nouvelle série ou un arrivage.",
    create: () => ({
      eyebrow: "Nouvelle Collection",
      title: "Des pièces pensées pour durer toute la saison",
      text: "Découvrez notre dernière sélection façonnée avec des matériaux choisis pour leur tenue et leur douceur au quotidien.",
      buttonLabel: "Explorer la collection",
      buttonUrl: "/nouveautes",
      imageUrl: "/assets/home-lifestyle-top.webp",
      imageAlt: "Présentation de la nouvelle collection",
      layout: "split",
      theme: "soft",
      galleryItems: [],
      enabled: true,
    }),
  },
  {
    id: "flash-countdown",
    label: "Offre Flash / Compte à rebours",
    badge: "Conversion",
    description: "Bannière d’urgence avec décompte en direct pour dynamiser les ventes du week-end.",
    create: () => {
      const ends = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      return {
        eyebrow: "Édition Limitée",
        title: "Offre privilège valable encore quelques heures",
        text: "Profitez d’une sélection à prix doux avant la fin du compteur. Quantités limitées en stock.",
        buttonLabel: "Profiter de l’offre",
        buttonUrl: "/promos",
        imageUrl: "",
        imageAlt: "",
        layout: "countdownBanner",
        theme: "primary",
        galleryItems: [],
        countdownEndsAt: ends,
        enabled: true,
      };
    },
  },
  {
    id: "product-selection",
    label: "Sélection Produits Phares",
    badge: "Catalogue",
    description: "Mini-collection de 2 à 4 produits tirés directement de votre stock avec prix en direct.",
    create: () => ({
      eyebrow: "Sélection du moment",
      title: "Les indispensables choisis pour vous",
      text: "Retrouvez nos articles les plus appréciés avec disponibilité immédiate.",
      buttonLabel: "Voir tout le catalogue",
      buttonUrl: "/boutique",
      imageUrl: "",
      imageAlt: "",
      layout: "productGrid",
      theme: "light",
      galleryItems: [],
      productIds: [],
      enabled: true,
    }),
  },
  {
    id: "before-after-showcase",
    label: "Comparateur Avant / Après",
    badge: "Interactif",
    description: "Curseur interactif pour illustrer la transformation, la retouche ou l’effet d’un produit.",
    create: () => ({
      eyebrow: "Démonstration visuelle",
      title: "Observez la différence en un geste",
      text: "Faites glisser le curseur pour comparer l’état initial et le résultat final obtenu avec notre sélection.",
      buttonLabel: "Découvrir le produit",
      buttonUrl: "/boutique",
      imageUrl: "/assets/home-editorial-divider.webp",
      imageAlt: "Visuel avant et après",
      secondaryImageUrl: "/assets/home-lifestyle-top.webp",
      beforeLabel: "Avant",
      afterLabel: "Après",
      layout: "beforeAfter",
      theme: "soft",
      galleryItems: [],
      enabled: true,
    }),
  },
  {
    id: "faq-reassurance",
    label: "Questions Fréquentes (FAQ)",
    badge: "Confiance",
    description: "Accordéon de réponses claires sur la livraison, les retours et le paiement sécurisé.",
    create: () => ({
      eyebrow: "Vos questions, nos réponses",
      title: "Tout savoir avant de commander",
      text: "Nous répondons en toute transparence aux questions les plus fréquentes de nos clients.",
      buttonLabel: "Nous contacter",
      buttonUrl: "/contact",
      imageUrl: "",
      imageAlt: "",
      layout: "faqAccordion",
      theme: "light",
      galleryItems: [],
      faqItems: [
        createFaqItem("Quels sont les délais d’expédition ?", "Chaque commande est préparée avec soin et expédiée avec un numéro de suivi communiqué par e-mail."),
        createFaqItem("Puis-je effectuer un retour facilement ?", "Oui, vous disposez d’une procédure claire depuis votre espace ou notre formulaire de contact."),
        createFaqItem("Quels moyens de paiement acceptez-vous ?", "Tous les paiements affichés à la validation du panier sont chiffrés et sécurisés."),
      ],
      enabled: true,
    }),
  },
  {
    id: "key-stats",
    label: "Chiffres Clés & Engagements",
    badge: "Preuve Sociale",
    description: "Bandeau d’indicateurs clés pour renforcer immédiatement la crédibilité de la boutique.",
    create: () => ({
      eyebrow: "En quelques repères",
      title: "Un engagement mesurable au quotidien",
      text: "La confiance de nos clients repose sur une sélection exigeante et un accompagnement attentif.",
      buttonLabel: "Découvrir notre histoire",
      buttonUrl: "/boutique",
      imageUrl: "",
      imageAlt: "",
      layout: "statsCounter",
      theme: "dark",
      galleryItems: [],
      statItems: [
        createStatItem("98%", "Clients satisfaits"),
        createStatItem("24/48h", "Préparation soignée"),
        createStatItem("100%", "Paiement sécurisé"),
      ],
      enabled: true,
    }),
  },
];

function toBlock(value: HomeTextBanner): EditableBlock {
  const base: EditableBlock = {
    id: value.id,
    eyebrow: value.eyebrow || "",
    title: value.title || "",
    text: value.text || "",
    buttonLabel: value.buttonLabel || "",
    buttonUrl: value.buttonUrl || "",
    imageUrl: value.imageUrl || "",
    imageAlt: value.imageAlt || "",
    layout: value.layout || "banner",
    theme: value.theme || "primary",
    galleryItems: value.galleryItems || [],
    enabled: value.enabled !== false,
  };
  if (value.mobileImageUrl !== undefined) base.mobileImageUrl = value.mobileImageUrl;
  if (value.productIds !== undefined) base.productIds = value.productIds;
  if (value.countdownEndsAt !== undefined) base.countdownEndsAt = value.countdownEndsAt;
  if (value.secondaryImageUrl !== undefined) base.secondaryImageUrl = value.secondaryImageUrl;
  if (value.beforeLabel !== undefined) base.beforeLabel = value.beforeLabel;
  if (value.afterLabel !== undefined) base.afterLabel = value.afterLabel;
  if (value.faqItems !== undefined) base.faqItems = value.faqItems;
  if (value.statItems !== undefined) base.statItems = value.statItems;
  if (value.visibilityDevice !== undefined) base.visibilityDevice = value.visibilityDevice;
  if (value.imageFocalPoint !== undefined) base.imageFocalPoint = value.imageFocalPoint;
  return base;
}

function serializeBlockForSave(block: EditableBlock): EditableBlock {
  const clean: EditableBlock = {
    id: block.id,
    eyebrow: block.eyebrow,
    title: block.title,
    text: block.text,
    buttonLabel: block.buttonLabel,
    buttonUrl: block.buttonUrl,
    imageUrl: block.imageUrl,
    imageAlt: block.imageAlt,
    layout: block.layout,
    theme: block.theme,
    galleryItems: block.galleryItems,
    enabled: block.enabled,
  };
  if (block.mobileImageUrl) clean.mobileImageUrl = block.mobileImageUrl;
  if (block.productIds && block.productIds.length > 0) clean.productIds = block.productIds;
  if (block.countdownEndsAt) clean.countdownEndsAt = block.countdownEndsAt;
  if (block.secondaryImageUrl) clean.secondaryImageUrl = block.secondaryImageUrl;
  if (block.beforeLabel) clean.beforeLabel = block.beforeLabel;
  if (block.afterLabel) clean.afterLabel = block.afterLabel;
  if (block.faqItems && block.faqItems.length > 0) clean.faqItems = block.faqItems;
  if (block.statItems && block.statItems.length > 0) clean.statItems = block.statItems;
  if (block.visibilityDevice && block.visibilityDevice !== "all") clean.visibilityDevice = block.visibilityDevice;
  if (block.imageFocalPoint && block.imageFocalPoint !== "center") clean.imageFocalPoint = block.imageFocalPoint;
  return clean;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function labelForKey(key: string, blocks: HomeTextBanner[]) {
  if (key.startsWith("text:")) return blocks.find(block => `text:${block.id}` === key)?.title || "Bloc libre";
  return (
    {
      highlight: "Bloc inspiration",
      reassurance: "Bande de réassurance",
      discovery: "Univers / catégories",
      story: "Histoire",
      testimonials: "Message",
      editorial: "Bannière éditoriale",
      featured: "Produits vedettes",
    } as Record<string, string>
  )[key] || key;
}

function evaluateVisualQuality(blocks: EditableBlock[]) {
  if (blocks.length === 0) {
    return { score: 100, warnings: [] as string[] };
  }
  const warnings: string[] = [];
  let deductions = 0;

  blocks.forEach((block, index) => {
    const label = `Bloc #${index + 1} (« ${block.title || "Sans titre"} »)`;
    if (block.title.trim().length < 2) {
      warnings.push(`${label} : ajoutez un titre d’au moins 2 caractères.`);
      deductions += 20;
    }
    if (block.buttonLabel.trim() && !block.buttonUrl.trim()) {
      warnings.push(`${label} : le bouton « ${block.buttonLabel} » n’a pas de lien de destination.`);
      deductions += 15;
    }
    if (block.imageUrl.trim() && !block.imageAlt.trim()) {
      warnings.push(`${label} : ajoutez une description courte (texte alternatif) pour l’accessibilité de l’image.`);
      deductions += 12;
    }
    if (block.layout === "roundGallery" && block.galleryItems.length < 2) {
      warnings.push(`${label} : la galerie ronde requiert au moins 2 visuels.`);
      deductions += 20;
    }
    if (block.layout === "beforeAfter" && (!block.imageUrl.trim() || !(block.secondaryImageUrl || "").trim())) {
      warnings.push(`${label} : le comparateur Avant / Après requiert les 2 visuels.`);
      deductions += 20;
    }
    if (block.layout === "faqAccordion" && (!block.faqItems || block.faqItems.length < 1)) {
      warnings.push(`${label} : ajoutez au moins une question-réponse dans la FAQ.`);
      deductions += 20;
    }
    if (block.layout === "statsCounter" && (!block.statItems || block.statItems.length < 2)) {
      warnings.push(`${label} : ajoutez au moins 2 chiffres clés.`);
      deductions += 15;
    }
    if (block.layout === "productGrid" && (!block.productIds || block.productIds.length === 0)) {
      warnings.push(`${label} : sélectionnez 2 à 4 produits du catalogue (sinon les produits vedettes seront affichés par défaut).`);
      deductions += 5;
    }
  });

  return {
    score: Math.max(0, 100 - deductions),
    warnings,
  };
}

export default function OwnerCustomHomepageBlocksEditor({
  profile,
  onSaved,
}: {
  profile: DesignProfile;
  onSaved: (profile: DesignProfile) => void;
}) {
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => profile.textBanners.map(toBlock));
  const [homeOrder, setHomeOrder] = useState<string[]>(() => profile.homeOrder || BASE_SECTION_KEYS);
  const [splitScreen, setSplitScreen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [beforeAfterPreviewPos, setBeforeAfterPreviewPos] = useState<Record<string, number>>({});
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Optional queries for store products, draft state, and 5-version history
  const ownerProductsQuery = trpc.products?.getAll?.useQuery("fr", {
    refetchOnWindowFocus: false,
    retry: false,
  });
  const draftQuery = trpc.owner.getCustomHomepageBlocksDraft?.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
  });
  const historyQuery = trpc.owner.getDesignProfileHistory?.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
  });

  const storeProducts = useMemo(() => {
    const raw = (ownerProductsQuery?.data ?? []) as Array<{
      id: number;
      name: string;
      price: number;
      originalPrice?: number | null;
      status?: string;
      images?: Array<{ imageUrl?: string } | string>;
    }>;
    return raw.filter(item => item && item.status !== "archived");
  }, [ownerProductsQuery?.data]);

  const upload = trpc.owner.uploadImage.useMutation({
    onError: error => toast.error(error.message || "L’image n’a pas pu être téléversée."),
  });

  const save = trpc.owner.saveCustomHomepageBlocks.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      void draftQuery?.refetch?.();
      void historyQuery?.refetch?.();
      toast.success("Blocs libres enregistrés et publiés sur la boutique.");
    },
    onError: error => toast.error(error.message || "Les blocs libres n’ont pas pu être enregistrés."),
  });

  const saveDraft = trpc.owner.saveCustomHomepageBlocksDraft?.useMutation({
    onSuccess: () => {
      void draftQuery?.refetch?.();
      toast.success("Brouillon enregistré (non visible par les visiteurs tant que vous ne publiez pas).");
    },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être enregistré."),
  });

  const restoreVersion = trpc.owner.restoreDesignProfileVersion?.useMutation({
    onSuccess: restored => {
      onSaved(restored as DesignProfile);
      void historyQuery?.refetch?.();
      toast.success("Version précédente restaurée avec succès.");
    },
    onError: error => toast.error(error.message || "Impossible de restaurer cette version."),
  });

  useEffect(() => {
    setBlocks(profile.textBanners.map(toBlock));
    setHomeOrder(profile.homeOrder || BASE_SECTION_KEYS);
  }, [profile]);

  const orderedKeys = useMemo(() => {
    const allowed = new Set([...BASE_SECTION_KEYS, ...blocks.map(block => `text:${block.id}`)]);
    const result = homeOrder.filter(key => allowed.has(key));
    for (const key of BASE_SECTION_KEYS) if (!result.includes(key)) result.push(key);
    for (const block of blocks) {
      const key = `text:${block.id}`;
      if (!result.includes(key)) result.push(key);
    }
    return result;
  }, [blocks, homeOrder]);

  const qualityReport = useMemo(() => evaluateVisualQuality(blocks), [blocks]);

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks(current => current.map(block => (block.id === id ? { ...block, ...patch } : block)));
  };

  const updateGalleryItem = (blockId: string, itemId: string, patch: Partial<RoundGalleryItem>) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? {
              ...block,
              galleryItems: block.galleryItems.map(item => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : block
      )
    );
  };

  const addGalleryItem = (blockId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId && block.galleryItems.length < 6
          ? { ...block, galleryItems: [...block.galleryItems, createGalleryItem()] }
          : block
      )
    );
  };

  const removeGalleryItem = (blockId: string, itemId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? { ...block, galleryItems: block.galleryItems.filter(item => item.id !== itemId) }
          : block
      )
    );
  };

  const addFaqItem = (blockId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId && (block.faqItems?.length ?? 0) < 8
          ? { ...block, faqItems: [...(block.faqItems || []), createFaqItem("Nouvelle question fréquente", "Votre réponse détaillée ici.")] }
          : block
      )
    );
  };

  const updateFaqItem = (blockId: string, itemId: string, patch: Partial<HomeFaqItem>) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? {
              ...block,
              faqItems: (block.faqItems || []).map(item => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : block
      )
    );
  };

  const removeFaqItem = (blockId: string, itemId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? { ...block, faqItems: (block.faqItems || []).filter(item => item.id !== itemId) }
          : block
      )
    );
  };

  const addStatItem = (blockId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId && (block.statItems?.length ?? 0) < 6
          ? { ...block, statItems: [...(block.statItems || []), createStatItem("+500", "Commandes livrées")] }
          : block
      )
    );
  };

  const updateStatItem = (blockId: string, itemId: string, patch: Partial<HomeStatItem>) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? {
              ...block,
              statItems: (block.statItems || []).map(item => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : block
      )
    );
  };

  const removeStatItem = (blockId: string, itemId: string) => {
    setBlocks(current =>
      current.map(block =>
        block.id === blockId
          ? { ...block, statItems: (block.statItems || []).filter(item => item.id !== itemId) }
          : block
      )
    );
  };

  const toggleProductSelection = (blockId: string, productId: number) => {
    setBlocks(current =>
      current.map(block => {
        if (block.id !== blockId) return block;
        const currentIds = block.productIds || [];
        if (currentIds.includes(productId)) {
          return { ...block, productIds: currentIds.filter(id => id !== productId) };
        }
        if (currentIds.length >= 4) {
          toast.error("Sélectionnez jusqu’à 4 produits maximum pour ce bloc.");
          return block;
        }
        return { ...block, productIds: [...currentIds, productId] };
      })
    );
  };

  const addBlock = () => {
    if (blocks.length >= 8) {
      toast.error("Huit blocs libres maximum par boutique.");
      return;
    }
    const id = `block-${Date.now().toString(36)}`;
    const block: EditableBlock = {
      id,
      eyebrow: "Nouveau rendez-vous",
      title: "Donnez vie à cette section",
      text: "Ajoutez ici un texte, un visuel et un lien vers la page de votre choix.",
      buttonLabel: "Découvrir",
      buttonUrl: "/boutique",
      imageUrl: "",
      imageAlt: "",
      layout: "split",
      theme: "soft",
      galleryItems: [],
      enabled: true,
    };
    setBlocks(current => [...current, block]);
    setHomeOrder(current => [...current, `text:${id}`]);
    setActiveBlockId(id);
  };

  const addPresetBlock = (preset: BlockPreset) => {
    if (blocks.length >= 8) {
      toast.error("Huit blocs libres maximum par boutique.");
      return;
    }
    const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const block: EditableBlock = {
      id,
      ...preset.create(),
    };
    setBlocks(current => [...current, block]);
    setHomeOrder(current => [...current, `text:${id}`]);
    setActiveBlockId(id);
    setShowPresetPicker(false);
    toast.success(`Modèle « ${preset.label} » ajouté.`);
  };

  const duplicateBlock = (source: EditableBlock) => {
    if (blocks.length >= 8) {
      toast.error("Huit blocs libres maximum par boutique.");
      return;
    }
    const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const cloned: EditableBlock = {
      ...source,
      id,
      title: `${source.title} (Copie)`.slice(0, 180),
      galleryItems: source.galleryItems.map(item => ({
        ...item,
        id: `circle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      })),
      faqItems: source.faqItems?.map(item => ({
        ...item,
        id: `faq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      })),
      statItems: source.statItems?.map(item => ({
        ...item,
        id: `stat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      })),
    };
    setBlocks(current => [...current, cloned]);
    setHomeOrder(current => [...current, `text:${id}`]);
    setActiveBlockId(id);
    toast.success("Bloc dupliqué.");
  };

  const removeBlock = (id: string) => {
    setBlocks(current => current.filter(block => block.id !== id));
    setHomeOrder(current => current.filter(key => key !== `text:${id}`));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    const key = `text:${id}`;
    setHomeOrder(current => {
      const source = orderedKeys;
      const index = source.indexOf(key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= source.length) return current;
      const next = [...source];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const uploadImage = async (id: string, file: File, field: "imageUrl" | "secondaryImageUrl" | "mobileImageUrl" = "imageUrl") => {
    try {
      const result = await upload.mutateAsync({ dataUrl: await fileToDataUrl(file), fileName: file.name });
      updateBlock(id, { [field]: result.url });
      toast.success("Visuel prêt à enregistrer.");
    } catch {
      // The mutation already provides a concise error message.
    }
  };

  const uploadGalleryImage = async (blockId: string, itemId: string, file: File) => {
    try {
      const result = await upload.mutateAsync({ dataUrl: await fileToDataUrl(file), fileName: file.name });
      updateGalleryItem(blockId, itemId, { imageUrl: result.url });
      toast.success("Visuel rond prêt à enregistrer.");
    } catch {
      // The mutation already provides a concise error message.
    }
  };

  const handleLayoutChange = (block: EditableBlock, layout: HomeTextBannerLayout) => {
    const patch: Partial<EditableBlock> = { layout };
    if (layout === "roundGallery" && block.galleryItems.length === 0) {
      patch.galleryItems = [createGalleryItem("Premier univers"), createGalleryItem("Second univers")];
    }
    if (layout === "countdownBanner" && !block.countdownEndsAt) {
      patch.countdownEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    }
    if (layout === "beforeAfter") {
      if (!block.beforeLabel) patch.beforeLabel = "Avant";
      if (!block.afterLabel) patch.afterLabel = "Après";
    }
    if (layout === "faqAccordion" && (!block.faqItems || block.faqItems.length === 0)) {
      patch.faqItems = [createFaqItem()];
    }
    if (layout === "statsCounter" && (!block.statItems || block.statItems.length < 2)) {
      patch.statItems = [createStatItem("98%", "Clients satisfaits"), createStatItem("24/48h", "Expédition rapide")];
    }
    updateBlock(block.id, patch);
  };

  const focusBlockFromPreview = (blockId: string) => {
    setActiveBlockId(blockId);
    const el = blockRefs.current[blockId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const loadDraftIntoEditor = () => {
    const draft = draftQuery?.data;
    if (!draft) return;
    setBlocks(draft.blocks.map(toBlock));
    setHomeOrder(draft.homeOrder || BASE_SECTION_KEYS);
    toast.info("Brouillon chargé dans l’éditeur.");
  };

  return (
    <Card className="border-fuchsia-200">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-fuchsia-700" /> Blocs libres de la page d’accueil
              </CardTitle>
              <Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900">
                Visual Builder 2.0
              </Badge>
              <Badge
                variant="outline"
                className={
                  qualityReport.score >= 90
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : qualityReport.score >= 70
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }
              >
                Qualité visuelle : {qualityReport.score}%
              </Badge>
            </div>
            <CardDescription className="mt-1 max-w-3xl">
              Créez vos propres sections pour un atelier, une collection, un service, une promotion ou une histoire. Chaque bloc est propre à votre boutique, peut être déplacé, dupliqué, prévisualisé en direct ou masqué à tout moment.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={splitScreen ? "default" : "outline"}
              onClick={() => setSplitScreen(prev => !prev)}
              className={
                splitScreen
                  ? "min-h-11 bg-slate-900 text-white hover:bg-slate-800"
                  : "min-h-11 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }
            >
              <Columns className="mr-2 h-4 w-4" />
              {splitScreen ? "Fermer le Côte à Côte" : "Mode Côte à Côte"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHistoryPanel(prev => !prev)}
              className="min-h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <History className="mr-2 h-4 w-4" /> Historique ({historyQuery?.data?.length ?? 0}/5)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPresetPicker(prev => !prev)}
              disabled={blocks.length >= 8}
              className="min-h-11 border-violet-300 bg-violet-50/70 text-violet-900 hover:bg-violet-100"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Modèles pré-remplis
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addBlock}
              disabled={blocks.length >= 8}
              className="min-h-11 border-fuchsia-300 bg-white text-fuchsia-800 hover:bg-fuchsia-50"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter un bloc
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Draft banner if an unpublished draft exists */}
        {draftQuery?.data && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                <strong>Brouillon non publié disponible</strong> (sauvegardé le{" "}
                {new Date(draftQuery.data.updatedAt).toLocaleString("fr-CH")} · {draftQuery.data.blocks.length} bloc(s)).
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={loadDraftIntoEditor} className="border-amber-300 bg-white text-amber-900">
                Charger le brouillon
              </Button>
            </div>
          </div>
        )}

        {/* Preset Library Drawer */}
        {showPresetPicker && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-violet-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-violet-700" /> Bibliothèque de modèles prêts à l’emploi
                </p>
                <p className="text-xs text-violet-800">
                  Insérez en 1 clic une section pré-structurée et adaptez librement ses textes ou images.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowPresetPicker(false)}>
                Fermer
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCK_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addPresetBlock(preset)}
                  className="flex flex-col justify-between rounded-xl border border-violet-200 bg-white p-3.5 text-left shadow-sm transition hover:border-violet-400 hover:shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900">{preset.label}</span>
                      <Badge variant="outline" className="text-[10px] border-violet-200 bg-violet-50 text-violet-900">
                        {preset.badge}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{preset.description}</p>
                  </div>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-violet-700">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Utiliser ce modèle
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5-Version History Panel */}
        {showHistoryPanel && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-700" /> Historique des 5 dernières versions publiées
                </p>
                <p className="text-xs text-slate-600">
                  Chaque publication sauvegarde automatiquement l’état précédent. Vous pouvez revenir en arrière en un clic.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowHistoryPanel(false)}>
                Fermer
              </Button>
            </div>
            {!historyQuery?.data || historyQuery.data.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Aucune version archivée pour le moment. L’historique se remplit automatiquement dès votre prochaine sauvegarde.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {historyQuery.data.map(version => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{version.label}</p>
                      <p className="text-slate-500 mt-0.5">
                        {new Date(version.createdAt).toLocaleString("fr-CH")} · {version.blockCount} bloc(s)
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={restoreVersion?.isPending}
                      onClick={() => restoreVersion?.mutate({ versionId: version.id })}
                      className="shrink-0"
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quality & Accessibility warnings */}
        {qualityReport.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Conseils d’optimisation visuelle & accessibilité ({qualityReport.score}%)
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-900">
              {qualityReport.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-950">
          <strong>Aucune contrainte de modèle :</strong> le bloc peut rester sans image, sans bouton, et être simplement masqué pendant que vous le préparez. Les textes et liens restent contrôlés côté serveur et n’affectent aucune autre boutique.
        </div>

        {/* Main Workspace: Single column or Split-Screen (Côte à Côte) */}
        <div className={splitScreen ? "grid gap-6 xl:grid-cols-[1.08fr_0.92fr] items-start" : "space-y-5"}>
          {/* Left Column: Block Forms */}
          <div className="space-y-4">
            {blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                <ImagePlus className="mb-2 h-5 w-5 text-fuchsia-600" /> Aucun bloc libre pour le moment. Ajoutez-en un ou choisissez un modèle pré-rempli pour présenter une offre, une activité ou une nouvelle collection sans modifier les sections déjà en place.
              </div>
            ) : (
              blocks.map(block => {
                const orderIndex = orderedKeys.indexOf(`text:${block.id}`);
                const isSelected = activeBlockId === block.id;
                return (
                  <div
                    key={block.id}
                    ref={el => {
                      blockRefs.current[block.id] = el;
                    }}
                    onClick={() => setActiveBlockId(block.id)}
                    className={`rounded-2xl border p-4 md:p-5 transition ${
                      isSelected
                        ? "border-fuchsia-400 bg-fuchsia-50/20 ring-2 ring-fuchsia-200"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">
                            Bloc libre · position {orderIndex + 1}
                          </p>
                          {block.visibilityDevice && block.visibilityDevice !== "all" && (
                            <Badge variant="outline" className="text-[10px] border-sky-200 bg-sky-50 text-sky-900">
                              {block.visibilityDevice === "mobile" ? "Mobile uniquement" : "Ordinateur uniquement"}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-base font-semibold text-slate-950">
                          {block.title || "Sans titre"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            moveBlock(block.id, -1);
                          }}
                          disabled={orderIndex <= 0}
                          className="min-h-10"
                        >
                          <ArrowUp className="mr-1 h-4 w-4" /> Monter
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            moveBlock(block.id, 1);
                          }}
                          disabled={orderIndex < 0 || orderIndex >= orderedKeys.length - 1}
                          className="min-h-10"
                        >
                          <ArrowDown className="mr-1 h-4 w-4" /> Descendre
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            duplicateBlock(block);
                          }}
                          disabled={blocks.length >= 8}
                          className="min-h-10 border-violet-200 text-violet-800 hover:bg-violet-50"
                        >
                          <Copy className="mr-1 h-4 w-4" /> Dupliquer
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={block.enabled ? "default" : "outline"}
                          onClick={e => {
                            e.stopPropagation();
                            updateBlock(block.id, { enabled: !block.enabled });
                          }}
                          className={block.enabled ? "min-h-10 bg-emerald-700 hover:bg-emerald-800" : "min-h-10"}
                        >
                          {block.enabled ? (
                            <>
                              <Eye className="mr-1 h-4 w-4" /> Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-1 h-4 w-4" /> Masqué
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                          className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Supprimer
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Surtitre</Label>
                        <Input
                          value={block.eyebrow}
                          maxLength={120}
                          onChange={event => updateBlock(block.id, { eyebrow: event.target.value })}
                          placeholder="Ex. Atelier du week-end"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input
                          value={block.title}
                          maxLength={180}
                          onChange={event => updateBlock(block.id, { title: event.target.value })}
                          placeholder="Titre de votre section"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Texte</Label>
                      <Textarea
                        rows={4}
                        value={block.text}
                        maxLength={600}
                        onChange={event => updateBlock(block.id, { text: event.target.value })}
                        placeholder="Expliquez librement ce que vous souhaitez présenter."
                      />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <select
                          value={block.layout}
                          onChange={event => handleLayoutChange(block, event.target.value as HomeTextBannerLayout)}
                          className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {layoutOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} — {option.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ambiance</Label>
                        <select
                          value={block.theme}
                          onChange={event => updateBlock(block.id, { theme: event.target.value as EditableBlock["theme"] })}
                          className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {themeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Phase 5: Mobile-first visibility & focal point */}
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Affichage par appareil (Mobile-First)</Label>
                        <select
                          value={block.visibilityDevice || "all"}
                          onChange={event =>
                            updateBlock(block.id, {
                              visibilityDevice: event.target.value as NonNullable<HomeTextBanner["visibilityDevice"]>,
                            })
                          }
                          className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {visibilityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Point focal de l’image (Recadrage Mobile)</Label>
                        <select
                          value={block.imageFocalPoint || "center"}
                          onChange={event =>
                            updateBlock(block.id, {
                              imageFocalPoint: event.target.value as NonNullable<HomeTextBanner["imageFocalPoint"]>,
                            })
                          }
                          className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {focalPointOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Texte du bouton (facultatif)</Label>
                        <Input
                          value={block.buttonLabel}
                          maxLength={60}
                          onChange={event => updateBlock(block.id, { buttonLabel: event.target.value })}
                          placeholder="Découvrir"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lien du bouton</Label>
                        <Input
                          value={block.buttonUrl}
                          maxLength={300}
                          onChange={event => updateBlock(block.id, { buttonUrl: event.target.value })}
                          placeholder="/boutique ou https://…"
                        />
                      </div>
                    </div>

                    {/* FORMAT-SPECIFIC EDITORS */}

                    {/* 1. Round Gallery */}
                    {block.layout === "roundGallery" && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-emerald-950">Visuels ronds de la galerie</p>
                            <p className="mt-1 text-xs leading-5 text-emerald-900">
                              Ajoutez de 2 à 6 univers. Sur la vitrine, seul le visuel circulaire et son libellé apparaissent : aucune carte ni prix n’est affiché.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={block.galleryItems.length >= 6}
                            onClick={() => addGalleryItem(block.id)}
                            className="min-h-10 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                          >
                            <Plus className="mr-1 h-4 w-4" /> Ajouter un visuel
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {block.galleryItems.map(item => (
                            <div key={item.id} className="rounded-xl border border-emerald-100 bg-white p-3">
                              <div className="flex items-start gap-3">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-emerald-50">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="grid h-full place-items-center">
                                      <ImagePlus className="h-5 w-5 text-emerald-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <Input
                                    aria-label="Libellé du visuel rond"
                                    value={item.label}
                                    maxLength={80}
                                    onChange={event => updateGalleryItem(block.id, item.id, { label: event.target.value })}
                                    placeholder="Ex. Rooibos nature"
                                  />
                                  <Input
                                    aria-label="URL du visuel rond"
                                    value={item.imageUrl}
                                    maxLength={1000}
                                    onChange={event => updateGalleryItem(block.id, item.id, { imageUrl: event.target.value })}
                                    placeholder="https://…"
                                  />
                                  <Input
                                    aria-label="Description du visuel rond"
                                    value={item.imageAlt}
                                    maxLength={180}
                                    onChange={event => updateGalleryItem(block.id, item.id, { imageAlt: event.target.value })}
                                    placeholder="Description de l’image"
                                  />
                                  <Input
                                    aria-label="Lien du visuel rond"
                                    value={item.href}
                                    maxLength={300}
                                    onChange={event => updateGalleryItem(block.id, item.id, { href: event.target.value })}
                                    placeholder="/boutique (facultatif)"
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                      <Upload className="h-3.5 w-3.5" /> Téléverser
                                      <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={event => {
                                          const file = event.target.files?.[0];
                                          if (file) void uploadGalleryImage(block.id, item.id, file);
                                        }}
                                      />
                                    </label>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeGalleryItem(block.id, item.id)}
                                      className="h-9 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                    >
                                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Product Grid (Mini-Collection) */}
                    {block.layout === "productGrid" && (
                      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-violet-950 flex items-center gap-1.5">
                              <Package className="h-4 w-4 text-violet-700" /> Sélection de produits du catalogue (2 à 4 produits)
                            </p>
                            <p className="text-xs text-violet-900 mt-0.5">
                              Les prix, photos et promotions sont synchronisés en direct avec votre stock.
                            </p>
                          </div>
                          <Badge variant="outline" className="border-violet-300 bg-white text-violet-900">
                            {(block.productIds || []).length}/4 sélectionnés
                          </Badge>
                        </div>
                        {storeProducts.length === 0 ? (
                          <p className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-violet-100">
                            Vos produits vedettes actifs seront automatiquement mis en avant dans cette grille sur la vitrine.
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
                            {storeProducts.map(prod => {
                              const selected = (block.productIds || []).includes(prod.id);
                              return (
                                <button
                                  key={prod.id}
                                  type="button"
                                  onClick={() => toggleProductSelection(block.id, prod.id)}
                                  className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-xs transition ${
                                    selected
                                      ? "border-violet-600 bg-violet-100/80 font-semibold text-violet-950"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                                  }`}
                                >
                                  <span className="truncate">{prod.name}</span>
                                  <span className="shrink-0 font-mono text-[11px] text-slate-600">
                                    {(prod.price / 100).toFixed(2)} CHF
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Countdown Banner */}
                    {block.layout === "countdownBanner" && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                        <Label className="flex items-center gap-1.5 text-amber-950 font-semibold">
                          <Clock className="h-4 w-4 text-amber-700" /> Date et heure de fin de l’offre
                        </Label>
                        <p className="text-xs text-amber-900">
                          Le compte à rebours (Jours, Heures, Minutes, Secondes) s’actualise chaque seconde sur la vitrine.
                        </p>
                        <Input
                          type="datetime-local"
                          value={(block.countdownEndsAt || "").slice(0, 16)}
                          onChange={event => updateBlock(block.id, { countdownEndsAt: event.target.value })}
                          className="max-w-xs bg-white"
                        />
                      </div>
                    )}

                    {/* 4. Before / After Slider */}
                    {block.layout === "beforeAfter" && (
                      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-4">
                        <div>
                          <p className="font-semibold text-indigo-950 flex items-center gap-1.5">
                            <SplitSquareHorizontal className="h-4 w-4 text-indigo-700" /> Visuels du comparateur Avant / Après
                          </p>
                          <p className="text-xs text-indigo-900 mt-0.5">
                            Renseignez le visuel principal ci-dessous comme image « Avant » et ajoutez ici le second visuel « Après ».
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Libellé Avant</Label>
                            <Input
                              value={block.beforeLabel ?? "Avant"}
                              maxLength={60}
                              onChange={event => updateBlock(block.id, { beforeLabel: event.target.value })}
                              placeholder="Avant"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Libellé Après</Label>
                            <Input
                              value={block.afterLabel ?? "Après"}
                              maxLength={60}
                              onChange={event => updateBlock(block.id, { afterLabel: event.target.value })}
                              placeholder="Après"
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 rounded-lg border border-indigo-100 bg-white p-3">
                          <Label>Second visuel (« Après »)</Label>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                              {block.secondaryImageUrl ? (
                                <img src={block.secondaryImageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImagePlus className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={block.secondaryImageUrl || ""}
                                maxLength={1000}
                                onChange={event => updateBlock(block.id, { secondaryImageUrl: event.target.value })}
                                placeholder="https://… ou téléverser le visuel Après"
                              />
                              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-800">
                                <Upload className="h-3.5 w-3.5" /> Téléverser le visuel Après
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={event => {
                                    const file = event.target.files?.[0];
                                    if (file) void uploadImage(block.id, file, "secondaryImageUrl");
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. FAQ Accordion */}
                    {block.layout === "faqAccordion" && (
                      <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-teal-950 flex items-center gap-1.5">
                              <HelpCircle className="h-4 w-4 text-teal-700" /> Questions & Réponses (FAQ)
                            </p>
                            <p className="text-xs text-teal-900">
                              Ajoutez jusqu’à 8 questions fréquentes dépliables sur la page d’accueil.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={(block.faqItems?.length ?? 0) >= 8}
                            onClick={() => addFaqItem(block.id)}
                            className="border-teal-300 bg-white text-teal-900"
                          >
                            <Plus className="mr-1 h-4 w-4" /> Ajouter une question
                          </Button>
                        </div>
                        <div className="space-y-2.5">
                          {(block.faqItems || []).map((faq, idx) => (
                            <div key={faq.id} className="rounded-lg border border-teal-100 bg-white p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-teal-800">Question #{idx + 1}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFaqItem(block.id, faq.id)}
                                  className="h-7 text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={faq.question}
                                maxLength={200}
                                onChange={event => updateFaqItem(block.id, faq.id, { question: event.target.value })}
                                placeholder="Ex. Quels sont les délais de livraison ?"
                              />
                              <Textarea
                                rows={2}
                                value={faq.answer}
                                maxLength={800}
                                onChange={event => updateFaqItem(block.id, faq.id, { answer: event.target.value })}
                                placeholder="Votre réponse claire et rassurante…"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Stats Counter */}
                    {block.layout === "statsCounter" && (
                      <div className="mt-4 rounded-xl border border-slate-300 bg-slate-100/80 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-950 flex items-center gap-1.5">
                              <TrendingUp className="h-4 w-4 text-slate-700" /> Chiffres Clés & Indicateurs (2 à 6)
                            </p>
                            <p className="text-xs text-slate-600">
                              Mettez en avant vos repères de confiance (ex: 98% clients ravis, 24h expédition).
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={(block.statItems?.length ?? 0) >= 6}
                            onClick={() => addStatItem(block.id)}
                            className="bg-white"
                          >
                            <Plus className="mr-1 h-4 w-4" /> Ajouter un chiffre
                          </Button>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {(block.statItems || []).map(stat => (
                            <div key={stat.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                              <Input
                                value={stat.value}
                                maxLength={40}
                                onChange={event => updateStatItem(block.id, stat.id, { value: event.target.value })}
                                placeholder="98%"
                                className="w-24 font-bold"
                              />
                              <Input
                                value={stat.label}
                                maxLength={120}
                                onChange={event => updateStatItem(block.id, stat.id, { label: event.target.value })}
                                placeholder="Clients satisfaits"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeStatItem(block.id, stat.id)}
                                className="h-8 text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Main Visual Uploader */}
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                      <Label>
                        {block.layout === "beforeAfter" ? "Premier visuel (« Avant »)" : "Visuel (facultatif)"}
                      </Label>
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="grid h-20 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 sm:w-28">
                          {block.imageUrl ? (
                            <img src={block.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <Input
                            value={block.imageUrl}
                            maxLength={1000}
                            onChange={event => updateBlock(block.id, { imageUrl: event.target.value })}
                            placeholder="https://… ou téléverser"
                          />
                          <Input
                            value={block.imageAlt}
                            maxLength={180}
                            onChange={event => updateBlock(block.id, { imageAlt: event.target.value })}
                            placeholder="Description courte de l’image"
                          />
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-fuchsia-800">
                              <Upload className="h-4 w-4" /> Téléverser
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={event => {
                                  const file = event.target.files?.[0];
                                  if (file) void uploadImage(block.id, file, "imageUrl");
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Split-Screen Preview (Phase 2) */}
          {splitScreen && (
            <div className="xl:sticky xl:top-6 rounded-2xl border border-slate-300 bg-slate-900/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 px-1">Aperçu en direct :</span>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> 1440px
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      previewDevice === "tablet" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Tablet className="h-3.5 w-3.5" /> 768px
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> 375px
                  </button>
                </div>
                <span className="text-[11px] text-slate-500">Cliquez sur un bloc pour l’éditer</span>
              </div>

              <div className="flex justify-center overflow-x-auto">
                <div
                  className={`rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden transition-all ${
                    previewDevice === "desktop"
                      ? "w-full"
                      : previewDevice === "tablet"
                      ? "w-[520px] max-w-full"
                      : "w-[360px] max-w-full"
                  }`}
                >
                  <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{profile.brandName || "Votre Boutique"}</span>
                    <span>Aperçu {previewDevice}</span>
                  </div>

                  <div className="max-h-[680px] overflow-y-auto p-3 space-y-3">
                    {blocks.filter(b => b.enabled).length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Aucun bloc visible à prévisualiser.
                      </div>
                    ) : (
                      blocks
                        .filter(b => {
                          if (!b.enabled) return false;
                          if (previewDevice === "mobile" && b.visibilityDevice === "desktop") return false;
                          if (previewDevice !== "mobile" && b.visibilityDevice === "mobile") return false;
                          return true;
                        })
                        .map(block => {
                          const isDark = block.theme === "dark";
                          const isPrimary = block.theme === "primary";
                          const bgStyle = isDark
                            ? { backgroundColor: "#0f172a", color: "#ffffff" }
                            : isPrimary
                            ? { backgroundColor: profile.customPrimary || "#6d28d9", color: "#ffffff" }
                            : block.theme === "soft"
                            ? { backgroundColor: profile.customSoft || "#f8fafc", color: "#0f172a" }
                            : { backgroundColor: "#ffffff", color: "#0f172a" };
                          const focalClass =
                            block.imageFocalPoint === "top"
                              ? "object-top"
                              : block.imageFocalPoint === "bottom"
                              ? "object-bottom"
                              : "object-center";
                          const sliderPos = beforeAfterPreviewPos[block.id] ?? 50;

                          return (
                            <div
                              key={block.id}
                              onClick={() => focusBlockFromPreview(block.id)}
                              className={`cursor-pointer rounded-xl border p-4 transition ${
                                activeBlockId === block.id ? "ring-2 ring-fuchsia-500 border-fuchsia-400" : "border-slate-200"
                              }`}
                              style={bgStyle}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                {block.eyebrow ? (
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {block.eyebrow}
                                  </span>
                                ) : (
                                  <span />
                                )}
                                <Badge variant="outline" className="text-[9px] bg-white/90 text-slate-800 border-slate-300">
                                  {layoutOptions.find(l => l.value === block.layout)?.label || block.layout}
                                </Badge>
                              </div>
                              <h4 className="text-base font-bold leading-snug">{block.title || "Sans titre"}</h4>
                              {block.text && <p className="mt-1.5 text-xs opacity-85 leading-relaxed">{block.text}</p>}

                              {/* Preview per layout */}
                              {block.layout === "countdownBanner" && (
                                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                                  {[
                                    { v: "02", l: "Jours" },
                                    { v: "14", l: "Heures" },
                                    { v: "38", l: "Min" },
                                    { v: "45", l: "Sec" },
                                  ].map(unit => (
                                    <div key={unit.l} className="rounded-lg bg-black/20 p-2 backdrop-blur-sm">
                                      <p className="text-sm font-bold">{unit.v}</p>
                                      <p className="text-[9px] uppercase opacity-75">{unit.l}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {block.layout === "statsCounter" && (block.statItems || []).length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  {(block.statItems || []).map(stat => (
                                    <div key={stat.id} className="rounded-lg bg-black/10 p-2 text-center">
                                      <p className="text-base font-extrabold">{stat.value}</p>
                                      <p className="text-[10px] opacity-80">{stat.label}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {block.layout === "faqAccordion" && (block.faqItems || []).length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  {(block.faqItems || []).map(faq => (
                                    <div key={faq.id} className="rounded-lg bg-black/5 p-2.5 text-xs">
                                      <p className="font-semibold">{faq.question}</p>
                                      <p className="mt-1 text-[11px] opacity-80">{faq.answer}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {block.layout === "beforeAfter" && block.imageUrl && (
                                <div className="mt-3 space-y-1.5" onClick={e => e.stopPropagation()}>
                                  <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-200">
                                    {block.secondaryImageUrl && (
                                      <img
                                        src={block.secondaryImageUrl}
                                        alt={block.afterLabel || "Après"}
                                        className={`absolute inset-0 h-full w-full object-cover ${focalClass}`}
                                      />
                                    )}
                                    <div
                                      className="absolute inset-y-0 left-0 overflow-hidden"
                                      style={{ width: `${sliderPos}%` }}
                                    >
                                      <img
                                        src={block.imageUrl}
                                        alt={block.beforeLabel || "Avant"}
                                        className={`h-full w-full object-cover ${focalClass}`}
                                      />
                                    </div>
                                    <div
                                      className="absolute inset-y-0 w-0.5 bg-white shadow"
                                      style={{ left: `${sliderPos}%` }}
                                    />
                                  </div>
                                  <input
                                    type="range"
                                    min={5}
                                    max={95}
                                    value={sliderPos}
                                    onChange={e =>
                                      setBeforeAfterPreviewPos(prev => ({
                                        ...prev,
                                        [block.id]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full accent-fuchsia-600"
                                  />
                                </div>
                              )}

                              {block.layout !== "beforeAfter" && block.imageUrl && (
                                <img
                                  src={block.imageUrl}
                                  alt={block.imageAlt || ""}
                                  className={`mt-3 h-32 w-full rounded-lg object-cover ${focalClass}`}
                                />
                              )}

                              {block.buttonLabel && (
                                <span className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
                                  {block.buttonLabel}
                                </span>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {blocks.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ordre d’affichage</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {orderedKeys.map((key, index) => (
                <span
                  key={`${key}-${index}`}
                  className={
                    key.startsWith("text:")
                      ? "rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-medium text-fuchsia-900"
                      : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                  }
                >
                  #{index + 1} {labelForKey(key, blocks)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs leading-5 text-slate-500 max-w-xl">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Ces blocs ne modifient ni le thème, ni le menu, ni les produits. Vous pouvez enregistrer un brouillon privé ou publier directement.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {saveDraft && (
              <Button
                type="button"
                variant="outline"
                disabled={saveDraft.isPending || save.isPending || upload.isPending}
                onClick={() =>
                  saveDraft.mutate({
                    blocks: blocks.map(serializeBlockForSave),
                    homeOrder: orderedKeys,
                  })
                }
                className="min-h-11 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              >
                {saveDraft.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Brouillon…
                  </>
                ) : (
                  <>
                    <FileEdit className="mr-2 h-4 w-4" /> Enregistrer en brouillon
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              disabled={save.isPending || upload.isPending}
              onClick={() =>
                save.mutate({
                  blocks: blocks.map(serializeBlockForSave),
                  homeOrder: orderedKeys,
                })
              }
              className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Enregistrer les blocs libres
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
