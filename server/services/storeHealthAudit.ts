import * as db from "../db";
import { getStoreSwissCreditorConfig } from "./swissQrBillInvoice";

export type HealthPillarId = "catalogue" | "theme" | "delivery" | "payments" | "conversion";

export type HealthPillar = {
  id: HealthPillarId;
  label: string;
  score: number;
  maxScore: number;
  status: "optimal" | "good" | "needs_attention" | "critical";
  summary: string;
};

export type ActionableRecommendation = {
  id: string;
  pillarId: HealthPillarId;
  title: string;
  impact: string;
  priority: "critical" | "high" | "medium";
  explanation: string;
  actionModule: string;
  actionLabel: string;
};

export type StoreHealthAuditReport = {
  storeId: number;
  storeName: string;
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "D";
  gradeLabel: string;
  statusColor: "emerald" | "blue" | "amber" | "rose";
  summary: string;
  pillars: HealthPillar[];
  recommendations: ActionableRecommendation[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    productsWithoutImages: number;
    productsWithShortDesc: number;
    activeBannersCount: number;
    hasActiveTheme: boolean;
    hasDeliveryConfigured: boolean;
    hasAlgeriaDelivery: boolean;
    hasStripeConnected: boolean;
    hasSwissQrBill: boolean;
    hasReassurance: boolean;
    hasConversionTools: boolean;
  };
  scannedAt: string;
};

export async function computeStoreHealthAudit(storeId: number, storeName?: string): Promise<StoreHealthAuditReport> {
  const [
    products,
    profile,
    banners,
    shippingSettings,
    algeriaSettings,
    swissCreditor,
    stripeSetup,
  ] = await Promise.all([
    db.getAllProductsAdmin(storeId).catch(() => []),
    db.getDesignProfile(storeId).catch(() => null),
    db.getAllBanners(storeId).catch(() => []),
    db.getOwnerShippingReturnsSettings(storeId).catch(() => null),
    db.getAlgeriaWilayaDeliverySettings(storeId).catch(() => null),
    getStoreSwissCreditorConfig(storeId).catch(() => null),
    db.getStoreStripeConnectSetup(storeId, "test").catch(() => null),
  ]);

  const recommendations: ActionableRecommendation[] = [];

  // ==========================================
  // 1. PILIER CATALOGUE & VISUELS (Max 25 pts)
  // ==========================================
  let catalogueScore = 0;
  const activeProducts = products.filter(p => p.status === "active");
  const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
  const productsWithShortDesc = products.filter(p => !p.description || p.description.trim().length < 30);

  if (activeProducts.length >= 3) {
    catalogueScore += 12;
  } else if (activeProducts.length >= 1) {
    catalogueScore += 8;
    recommendations.push({
      id: "catalog_more_products",
      pillarId: "catalogue",
      title: "Étoffer votre catalogue (au moins 3 produits)",
      impact: "+4 pts",
      priority: "medium",
      explanation: "Les boutiques ayant au moins 3 à 5 fiches actives augmentent le temps de visite et le taux de conversion de 40%.",
      actionModule: "catalogue",
      actionLabel: "Ajouter des produits au catalogue",
    });
  } else {
    recommendations.push({
      id: "catalog_no_active_products",
      pillarId: "catalogue",
      title: "Activer au moins un produit pour la vente",
      impact: "+12 pts",
      priority: "critical",
      explanation: "Votre boutique n’a aucun produit actif en ligne. Les visiteurs ne peuvent actuellement rien acheter.",
      actionModule: "catalogue",
      actionLabel: "Créer ou publier votre premier produit",
    });
  }

  if (products.length > 0 && productsWithoutImages.length === 0) {
    catalogueScore += 8;
  } else if (products.length > 0) {
    const partial = Math.max(0, Math.round(8 * (1 - productsWithoutImages.length / products.length)));
    catalogueScore += partial;
    recommendations.push({
      id: "catalog_missing_images",
      pillarId: "catalogue",
      title: `${productsWithoutImages.length} produit(s) sans photo de couverture`,
      impact: `+${8 - partial} pts`,
      priority: "high",
      explanation: "Glissez-déposez des photos haute définition sur vos fiches. La première image devient automatiquement la couverture.",
      actionModule: "catalogue",
      actionLabel: "Glisser-déposer des photos de produits",
    });
  }

  if (products.length > 0 && productsWithShortDesc.length === 0) {
    catalogueScore += 5;
  } else if (products.length > 0) {
    const partial = Math.max(0, Math.round(5 * (1 - productsWithShortDesc.length / products.length)));
    catalogueScore += partial;
    recommendations.push({
      id: "catalog_short_descriptions",
      pillarId: "catalogue",
      title: "Enrichir les descriptions de produits",
      impact: `+${5 - partial} pts`,
      priority: "medium",
      explanation: "Des fiches détaillées (matières, dimensions, conseils d'utilisation) rassurent les clients et dopent votre référencement Google.",
      actionModule: "catalogue",
      actionLabel: "Optimiser les fiches avec l'Assistant IA",
    });
  }

  // ==========================================
  // 2. PILIER THÈME & EXPÉRIENCE VITRINE (Max 20 pts)
  // ==========================================
  let themeScore = 0;
  const hasActiveTheme = Boolean(profile?.brandName || profile?.highlightTitle);
  const activeBanners = banners.filter((b: any) => Boolean(b.active));

  if (hasActiveTheme) {
    themeScore += 8;
  } else {
    themeScore += 4;
    recommendations.push({
      id: "theme_customize",
      pillarId: "theme",
      title: "Choisir et personnaliser votre thème Shopify Premium",
      impact: "+4 pts",
      priority: "high",
      explanation: "Sélectionnez un univers visuel haute conversion adapté à votre marque et ajustez vos couleurs d'accent.",
      actionModule: "vitrine",
      actionLabel: "Ouvrir le Studio des Thèmes",
    });
  }

  if (activeBanners.length >= 1) {
    themeScore += 6;
  } else {
    recommendations.push({
      id: "theme_carousel_banner",
      pillarId: "theme",
      title: "Ajouter une bannière ou diapositive de tête en glisser-déposer",
      impact: "+6 pts",
      priority: "high",
      explanation: "Une grande image ou vidéo en tête de boutique capte l'attention du visiteur dès les 3 premières secondes.",
      actionModule: "vitrine",
      actionLabel: "Glisser-déposer une bannière d'accueil",
    });
  }

  // Navigation & Sections
  const homeSections = profile?.homeOrder || [];
  if (homeSections.length >= 3) {
    themeScore += 6;
  } else {
    themeScore += 3;
    recommendations.push({
      id: "theme_sections_reorder",
      pillarId: "theme",
      title: "Agencer vos sections d'accueil par glisser-déposer",
      impact: "+3 pts",
      priority: "medium",
      explanation: "Positionnez vos produits vedettes, ventes flash et avis clients en tête pour un parcours fluide style Shopify.",
      actionModule: "vitrine",
      actionLabel: "Glisser-déposer les sections d'accueil",
    });
  }

  // ==========================================
  // 3. PILIER EXPÉDITIONS & LIVRAISONS (Max 20 pts)
  // ==========================================
  let deliveryScore = 0;
  const hasStandardDelivery = Boolean(
    shippingSettings?.servedCountries?.length &&
    (shippingSettings?.mode === "included" || Number(shippingSettings?.flatShippingRateCents || 0) > 0)
  );
  const hasAlgeriaDelivery = Boolean(algeriaSettings);

  if (hasStandardDelivery || hasAlgeriaDelivery) {
    deliveryScore += 12;
    if (hasAlgeriaDelivery) {
      deliveryScore += 8;
    } else if (hasStandardDelivery && shippingSettings?.deliveryLeadTime) {
      deliveryScore += 8;
    } else {
      deliveryScore += 4;
      recommendations.push({
        id: "delivery_details",
        pillarId: "delivery",
        title: "Préciser les délais de livraison et options domicile / stop-desk",
        impact: "+4 pts",
        priority: "medium",
        explanation: "Indiquer un délai précis (ex. 24-48h ou 3-5 jours) divise les abandons de panier par deux.",
        actionModule: "operations",
        actionLabel: "Ajuster les profils de livraison",
      });
    }
  } else {
    recommendations.push({
      id: "delivery_missing",
      pillarId: "delivery",
      title: "Configurer vos profils d'expédition (Suisse / France ou Algérie 58 Wilayas)",
      impact: "+20 pts",
      priority: "critical",
      explanation: "Sans option de livraison active, vos clients ne peuvent pas calculer leurs frais d'envoi et finaliser leur commande.",
      actionModule: "operations",
      actionLabel: "Configurer la livraison et les tarifs",
    });
  }

  // ==========================================
  // 4. PILIER PAIEMENTS & ENCAISSEMENT (Max 20 pts)
  // ==========================================
  let paymentsScore = 0;
  const hasStripeConnected = Boolean(stripeSetup?.paymentReadiness.enabled);
  const hasSwissQr = Boolean(swissCreditor?.enabled && swissCreditor?.iban);
  const hasCod = Boolean(algeriaSettings);

  if (hasStripeConnected || hasSwissQr || hasCod) {
    paymentsScore += 15;
    if ((hasStripeConnected && hasSwissQr) || (hasCod && hasStripeConnected)) {
      paymentsScore += 5; // Multi-moyen de paiement = top conversion
    } else {
      paymentsScore += 3;
      recommendations.push({
        id: "payments_diversify",
        pillarId: "payments",
        title: "Activer un second moyen de paiement pour maximiser vos ventes",
        impact: "+2 pts",
        priority: "medium",
        explanation: "Proposer à la fois la carte bancaire et le virement QR suisse ou le COD paiement à la livraison sécurise 100% de votre clientèle.",
        actionModule: "operations",
        actionLabel: "Activer un moyen de paiement complémentaire",
      });
    }
  } else {
    recommendations.push({
      id: "payments_missing",
      pillarId: "payments",
      title: "Connecter Stripe, la QR-Facture suisse ou le Paiement à la livraison",
      impact: "+15 pts",
      priority: "critical",
      explanation: "Votre boutique doit avoir au moins un canal d'encaissement configuré pour accepter les commandes de vos clients.",
      actionModule: "operations",
      actionLabel: "Configurer les paiements",
    });
  }

  // ==========================================
  // 5. PILIER MARKETING & CONVERSION (Max 15 pts)
  // ==========================================
  let conversionScore = 0;
  const hasReassurance = Boolean(profile?.reassuranceItems?.length || shippingSettings?.returnsSummary);
  const hasConversionTools = Boolean(profile?.showAnnouncement || profile?.brandMessage);

  if (hasReassurance) {
    conversionScore += 8;
  } else {
    conversionScore += 4;
    recommendations.push({
      id: "conversion_reassurance",
      pillarId: "conversion",
      title: "Activer les messages de réassurance et garanties client",
      impact: "+4 pts",
      priority: "medium",
      explanation: "Affichez vos 4 piliers de confiance : expédition soignée, paiement sécurisé, retours facilités et service client réactif.",
      actionModule: "vitrine",
      actionLabel: "Activer les piliers de réassurance",
    });
  }

  if (hasConversionTools) {
    conversionScore += 7;
  } else {
    conversionScore += 3;
    recommendations.push({
      id: "conversion_urgency_announcement",
      pillarId: "conversion",
      title: "Activer la barre d’annonce supérieure ou une offre flash",
      impact: "+4 pts",
      priority: "medium",
      explanation: "Un message accrocheur en tête (ex. « Livraison offerte dès 50 CHF » ou « Code promo BIENVENUE ») booste immédiatement le premier achat.",
      actionModule: "vitrine",
      actionLabel: "Activer la barre d’annonce",
    });
  }

  // ==========================================
  // CALCUL FINAL & GRADE
  // ==========================================
  const overallScore = Math.min(100, Math.max(0, catalogueScore + themeScore + deliveryScore + paymentsScore + conversionScore));

  let grade: StoreHealthAuditReport["grade"] = "D";
  let gradeLabel = "Boutique en préparation";
  let statusColor: StoreHealthAuditReport["statusColor"] = "rose";

  if (overallScore >= 90) {
    grade = "A+";
    gradeLabel = "Excellente · Prête à convertir au maximum";
    statusColor = "emerald";
  } else if (overallScore >= 80) {
    grade = "A";
    gradeLabel = "Très bonne préparation commerciale";
    statusColor = "emerald";
  } else if (overallScore >= 65) {
    grade = "B";
    gradeLabel = "Solide · Fort potentiel d'optimisation";
    statusColor = "blue";
  } else if (overallScore >= 50) {
    grade = "C";
    gradeLabel = "Configuration partielle · Points bloquants";
    statusColor = "amber";
  } else {
    grade = "D";
    gradeLabel = "Boutique en chantier · Actions indispensables";
    statusColor = "rose";
  }

  const pillars: HealthPillar[] = [
    {
      id: "catalogue",
      label: "Catalogue & Visuels",
      score: catalogueScore,
      maxScore: 25,
      status: catalogueScore >= 22 ? "optimal" : catalogueScore >= 16 ? "good" : catalogueScore >= 10 ? "needs_attention" : "critical",
      summary: `${activeProducts.length} produit(s) actif(s), ${productsWithoutImages.length} sans photo`,
    },
    {
      id: "theme",
      label: "Thème & Accueil Vitrine",
      score: themeScore,
      maxScore: 20,
      status: themeScore >= 18 ? "optimal" : themeScore >= 13 ? "good" : themeScore >= 8 ? "needs_attention" : "critical",
      summary: `${activeBanners.length} bannière(s) active(s), agencement d'accueil configuré`,
    },
    {
      id: "delivery",
      label: "Expéditions & Livraisons",
      score: deliveryScore,
      maxScore: 20,
      status: deliveryScore >= 18 ? "optimal" : deliveryScore >= 12 ? "good" : deliveryScore >= 6 ? "needs_attention" : "critical",
      summary: hasAlgeriaDelivery ? "Module Algérie 58 wilayas actif" : hasStandardDelivery ? "Profil national & international actif" : "Aucun tarif de livraison défini",
    },
    {
      id: "payments",
      label: "Paiements & Encaissement",
      score: paymentsScore,
      maxScore: 20,
      status: paymentsScore >= 18 ? "optimal" : paymentsScore >= 12 ? "good" : paymentsScore >= 6 ? "needs_attention" : "critical",
      summary: hasStripeConnected && hasSwissQr ? "Stripe + QR-Facture Suisse actifs" : hasCod ? "Paiement à la livraison (COD) actif" : hasStripeConnected ? "Stripe Connect actif" : hasSwissQr ? "QR-Facture Suisse active" : "Aucun paiement configuré",
    },
    {
      id: "conversion",
      label: "Marketing & Réassurance",
      score: conversionScore,
      maxScore: 15,
      status: conversionScore >= 13 ? "optimal" : conversionScore >= 10 ? "good" : conversionScore >= 6 ? "needs_attention" : "critical",
      summary: hasReassurance ? "Piliers de confiance et garanties actives" : "Réassurance à compléter",
    },
  ];

  return {
    storeId,
    storeName: storeName || profile?.brandName || "Votre boutique",
    overallScore,
    grade,
    gradeLabel,
    statusColor,
    summary: `Votre boutique obtient un score de santé commerciale de ${overallScore}/100. ${recommendations.length} action(s) clé(s) recommandée(s) pour doper vos ventes.`,
    pillars,
    recommendations: recommendations.sort((a, b) => (a.priority === "critical" ? -1 : b.priority === "critical" ? 1 : a.priority === "high" ? -1 : 1)),
    stats: {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      productsWithoutImages: productsWithoutImages.length,
      productsWithShortDesc: productsWithShortDesc.length,
      activeBannersCount: activeBanners.length,
      hasActiveTheme,
      hasDeliveryConfigured: hasStandardDelivery || hasAlgeriaDelivery,
      hasAlgeriaDelivery,
      hasStripeConnected,
      hasSwissQrBill: hasSwissQr,
      hasReassurance,
      hasConversionTools,
    },
    scannedAt: new Date().toISOString(),
  };
}
