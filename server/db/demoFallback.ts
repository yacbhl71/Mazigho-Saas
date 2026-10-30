import { createHash, randomBytes } from "node:crypto";
import type { StoreScope } from "../db";

export type DemoCategory = {
  id: number;
  storeId: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  publicMessage: string | null;
  publicNotice: string | null;
  emptyStateMessage: string | null;
  catalogSection: "standard" | "creations";
  displayOrder: number;
  createdAt: Date;
};

export type DemoDeliveryProfile = {
  id: number;
  storeId: number;
  productId: number;
  countryCode: string;
  supplierVariantId: string | null;
  supplierShippingCost: number;
  customerShippingCost: number;
  deliveryMethod: string | null;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
  quotedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoProduct = {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  featured: number;
  showNewBadge: number;
  status: "active" | "draft" | "archived";
  options: string | null;
  supplier: string | null;
  supplierProductId: string | null;
  supplierVariantMappings: string | null;
  supplierUrl: string | null;
  supplierPrice: number | null;
  supplierWeightG: number | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoProductImage = {
  id: number;
  storeId: number;
  productId: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: Date;
};

export type DemoReview = {
  id: number;
  storeId: number;
  productId: number;
  userId: number | null;
  authorName: string | null;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
};

export type DemoBanner = {
  id: number;
  storeId: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  active: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  loginMethod: string | null;
  role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin";
  accountStatus: "pending_invitation" | "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date | null;
};

const now = new Date("2026-10-20T10:00:00.000Z");
type DemoStore = StoreScope & { createdAt: Date; updatedAt: Date };

export const DEMO_STORES: DemoStore[] = [
  {
    id: 1,
    slug: "primary-store",
    displayName: "MAZIGHO",
    primaryDomain: "mazigho.ch",
    status: "active",
    isPlatformStore: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    slug: "atelier-tiziri",
    displayName: "Atelier Tiziri Bijoux",
    primaryDomain: "tiziri.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    slug: "maison-atlas-deco",
    displayName: "Maison Atlas Déco",
    primaryDomain: "atlas-deco.mazigho.ch",
    status: "setup",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    slug: "bhll-voyage",
    displayName: "BHLL Voyage Boutique",
    primaryDomain: "bhll.mazigho.com",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 5,
    slug: "atelier-kenza",
    displayName: "Atelier Kenza",
    primaryDomain: "kenza.mazigho.ch",
    status: "limited",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 6,
    slug: "atelier-sylvie",
    displayName: "Atelier Sylvie — Créations & Loisirs",
    primaryDomain: "dyama.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 7,
    slug: "bahloul-souhila",
    displayName: "Bahloul Souhila",
    primaryDomain: "souhila.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 8,
    slug: "compagnons-studio",
    displayName: "Compagnons Studio — Démo",
    primaryDomain: "compagnons.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 9,
    slug: "connect-gadgets",
    displayName: "Connect & Gadgets — Démonstration",
    primaryDomain: "connect.mazigho.ch",
    status: "setup",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 10,
    slug: "creations-lina",
    displayName: "Créations Lina",
    primaryDomain: "lina.mazigho.ch",
    status: "setup",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 11,
    slug: "import-wordpress",
    displayName: "Import WordPress — Test Studio",
    primaryDomain: "import-wp.mazigho.ch",
    status: "setup",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 12,
    slug: "les-mondes-dasma",
    displayName: "Les Mondes d'Asma",
    primaryDomain: "asma.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 13,
    slug: "mazigho-pets",
    displayName: "MAZIGHO PET'S — Pattes & Compagnie",
    primaryDomain: "pets.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 14,
    slug: "marche-atlas",
    displayName: "Marché Atlas — Épicerie & livraison",
    primaryDomain: "marche-atlas.mazigho.ch",
    status: "limited",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 15,
    slug: "rituels-dinfusion",
    displayName: "Rituels d'Infusion",
    primaryDomain: "rituels.mazigho.ch",
    status: "active",
    isPlatformStore: 0,
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: 1,
    storeId: 1,
    name: "High-Tech & Gadgets",
    slug: "high-tech-gadgets",
    description: "Accessoires intelligents, charge rapide et équipements connectés vérifiés.",
    imageUrl: "/assets/category-high-tech.webp",
    icon: "📱",
    publicMessage: "Livraison suivie en Suisse et en Europe avec contrôle qualité avant expédition.",
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 1,
    createdAt: now,
  },
  {
    id: 2,
    storeId: 1,
    name: "Maison & Organisation",
    slug: "maison-organisation",
    description: "Objets durables pour la cuisine, le café de spécialité et l'organisation.",
    imageUrl: "/assets/category-maison.webp",
    icon: "🏠",
    publicMessage: "Une sélection pensée pour embellir et simplifier chaque espace de vie.",
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 2,
    createdAt: now,
  },
  {
    id: 3,
    storeId: 1,
    name: "Beauté & Bien-Être",
    slug: "beaute-bien-etre",
    description: "Rituels de soin, appareils de relaxation et accessoires beauté haut de gamme.",
    imageUrl: "/assets/category-beaute.webp",
    icon: "💄",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 3,
    createdAt: now,
  },
  {
    id: 4,
    storeId: 1,
    name: "Sport & Fitness",
    slug: "sport-fitness",
    description: "Équipements d'entraînement, récupération musculaire et mobilité.",
    imageUrl: "/assets/category-sport.webp",
    icon: "🏋️",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 4,
    createdAt: now,
  },
  {
    id: 5,
    storeId: 1,
    name: "Auto & Accessoires",
    slug: "auto-accessoires",
    description: "Supports magnétiques, entretien intérieur et sécurité embarquée.",
    imageUrl: "/assets/category-auto.webp",
    icon: "🚗",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 5,
    createdAt: now,
  },
  {
    id: 6,
    storeId: 1,
    name: "Mode",
    slug: "mode",
    description: "Pièces intemporelles, maroquinerie et accessoires du quotidien.",
    imageUrl: "/assets/category-mode.webp",
    icon: "👗",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "standard",
    displayOrder: 6,
    createdAt: now,
  },
  {
    id: 101,
    storeId: 1,
    name: "T-shirts",
    slug: "t-shirts-creatifs",
    description: "Des motifs originaux en coton bio épais à porter au quotidien.",
    imageUrl: "/assets/category-mode.webp",
    icon: "👕",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "creations",
    displayOrder: 101,
    createdAt: now,
  },
  {
    id: 102,
    storeId: 1,
    name: "Sweats",
    slug: "sweats-creatifs",
    description: "Des pièces confortables pensées comme des éditions limitées.",
    imageUrl: "/assets/category-mode.webp",
    icon: "🧥",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "creations",
    displayOrder: 102,
    createdAt: now,
  },
  {
    id: 103,
    storeId: 1,
    name: "Mugs",
    slug: "mugs-creatifs",
    description: "Céramique artisanale et objets du quotidien personnalisés avec intention.",
    imageUrl: "/assets/category-maison.webp",
    icon: "☕",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "creations",
    displayOrder: 103,
    createdAt: now,
  },
  {
    id: 104,
    storeId: 1,
    name: "Affiches",
    slug: "affiches-creatives",
    description: "Illustrations d'atelier et compositions graphiques sur papier d'art.",
    imageUrl: "/assets/dyama/dyama-category-floral.webp",
    icon: "🖼️",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "creations",
    displayOrder: 104,
    createdAt: now,
  },
  {
    id: 105,
    storeId: 1,
    name: "Tote bags",
    slug: "tote-bags-creatifs",
    description: "Cabas en toile sergée robuste aux visuels originaux.",
    imageUrl: "/assets/dyama/dyama-category-landscape.webp",
    icon: "👜",
    publicMessage: null,
    publicNotice: null,
    emptyStateMessage: null,
    catalogSection: "creations",
    displayOrder: 105,
    createdAt: now,
  },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 1,
    storeId: 1,
    categoryId: 2,
    name: "Machine Espresso Barista 20 Bars",
    slug: "machine-espresso-barista-20-bars",
    description: "Extraction haute pression 20 bars avec buse vapeur professionnelle et contrôle thermique PID.",
    longDescription: "Préparez un véritable espresso de spécialité à la maison. Dotée d'une pompe italienne 20 bars, d'un chauffe-eau Thermoblock rapide et d'une buse vapeur orientable pour une micro-mousse veloutée. Corps en acier brossé, porte-filtre 58 mm et plateau chauffe-tasses intégré.",
    price: 18900,
    originalPrice: 22900,
    stock: 14,
    featured: 1,
    showNewBadge: 1,
    status: "active",
    options: JSON.stringify([{ id: "color-inox", type: "color", label: "Acier brossé", value: "#94a3b8" }, { id: "color-noir", type: "color", label: "Noir mat", value: "#0f172a" }]),
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 11200,
    supplierWeightG: 4200,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    storeId: 1,
    categoryId: 2,
    name: "Moulin à Café Conique Précision",
    slug: "moulin-cafe-conique-precision",
    description: "Meules coniques en acier inoxydable avec 38 crans de mouture, de l'espresso à la cafetière piston.",
    longDescription: "Un moulin électrique compact et silencieux conçu pour préserver tous les arômes de vos grains fraîchement torréfiés. Ses meules coniques de 40 mm limitent la chauffe et assurent une granulométrie régulière.",
    price: 7900,
    originalPrice: 9500,
    stock: 22,
    featured: 1,
    showNewBadge: 0,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 4200,
    supplierWeightG: 1450,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    storeId: 1,
    categoryId: 2,
    name: "Espresso Nomade Haute Pression USB-C",
    slug: "espresso-nomade-haute-pression",
    description: "Machine espresso portable autonome compatible café moulu et capsules, idéale en déplacement.",
    longDescription: "Emportez votre rituel café partout : randonnée, bureau ou voyage. Batterie lithium 7500 mAh rechargeable en USB-C, chauffe l'eau à 92 °C et extrait un espresso crémeux à 18 bars en 3 minutes.",
    price: 8900,
    originalPrice: 10900,
    stock: 19,
    featured: 1,
    showNewBadge: 1,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 4800,
    supplierWeightG: 680,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    storeId: 1,
    categoryId: 1,
    name: "Station de Charge GaN 3-en-1 Magnétique",
    slug: "station-charge-gan-3-en-1",
    description: "Chargeur rapide 65W GaN pliable pour smartphone, montre connectée et écouteurs sans fil.",
    longDescription: "Fini les câbles emmêlés sur le bureau ou la table de chevet. Son architecture GaN de 3e génération délivre une charge rapide sécurisée tout en restant ultra-compacte pour vos déplacements.",
    price: 5400,
    originalPrice: 6900,
    stock: 35,
    featured: 1,
    showNewBadge: 1,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 2700,
    supplierWeightG: 320,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 5,
    storeId: 1,
    categoryId: 3,
    name: "Coffret Rituel Soin Botanique & Quartz",
    slug: "coffret-rituel-soin-botanique",
    description: "Ensemble de massage facial en quartz rose naturel et diffuseur de brume thermale ionique.",
    longDescription: "Un rituel complet pour apaiser les traits, stimuler la micro-circulation et hydrater l'épiderme en profondeur. Livré dans son écrin de rangement en lin lavé.",
    price: 6400,
    originalPrice: 7900,
    stock: 18,
    featured: 1,
    showNewBadge: 0,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 3100,
    supplierWeightG: 540,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 6,
    storeId: 1,
    categoryId: 4,
    name: "Pistolet de Massage Percussion Pro Silence",
    slug: "pistolet-massage-percussion-pro",
    description: "Récupération musculaire profonde avec moteur brushless 45 dB et 6 têtes ergonomiques.",
    longDescription: "Conçu pour détendre les tensions après le sport ou une longue journée de travail. 5 vitesses de percussion réglables de 1800 à 3200 tr/min et autonomie longue durée de 8 heures.",
    price: 9400,
    originalPrice: 11900,
    stock: 12,
    featured: 1,
    showNewBadge: 0,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 4900,
    supplierWeightG: 920,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 7,
    storeId: 1,
    categoryId: 6,
    name: "Sac Cabas Structuré Cuir Végétal",
    slug: "sac-cabas-structure-cuir-vegetal",
    description: "Ligne architecturale épurée, compartiment ordinateur 14 pouces intégré et finitions sellier.",
    longDescription: "Pensé pour accompagner vos journées actives avec élégance. Sa matière grainée résistante à l'eau et ses coutures renforcées en font un allié durable au quotidien.",
    price: 11500,
    originalPrice: 13900,
    stock: 9,
    featured: 1,
    showNewBadge: 1,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 5800,
    supplierWeightG: 780,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 8,
    storeId: 1,
    categoryId: 5,
    name: "Support Auto Magnétique Induction 15W",
    slug: "support-auto-magnetique-induction-15w",
    description: "Maintien magnétique N52 ultra-stable avec charge sans fil rapide 15W et rotation 360°.",
    longDescription: "S'installe en quelques secondes sur la grille d'aération ou le tableau de bord. Maintient fermement votre téléphone même sur routes sinueuses tout en le rechargeant.",
    price: 3900,
    originalPrice: 4900,
    stock: 28,
    featured: 1,
    showNewBadge: 0,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 1800,
    supplierWeightG: 240,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 9,
    storeId: 1,
    categoryId: 104,
    name: "Affiche d'Art « Lumière de Méditerranée »",
    slug: "affiche-art-lumiere-mediterranee",
    description: "Tirage pigmentaire sur papier coton Hahnemühle 310 g/m², signé et numéroté en atelier.",
    longDescription: "Une composition chaleureuse inspirée des architectures en terre cuite et des ombres portées du sud. Imprimée à la demande avec des encres d'archivage résistantes à la lumière.",
    price: 4500,
    originalPrice: null,
    stock: 25,
    featured: 0,
    showNewBadge: 1,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 1600,
    supplierWeightG: 350,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 10,
    storeId: 1,
    categoryId: 105,
    name: "Cabas Atelier Toile Sergée Bio 340g",
    slug: "cabas-atelier-toile-sergee-bio",
    description: "Tote bag grand format en coton biologique certifié GOTS avec sérigraphie originale MAZIGHO.",
    longDescription: "Assez spacieux pour vos courses du marché, vos carnets de croquis ou votre ordinateur portable. Anses larges renforcées au point Sellier et poche intérieure zippée.",
    price: 3200,
    originalPrice: 3900,
    stock: 40,
    featured: 0,
    showNewBadge: 1,
    status: "active",
    options: null,
    supplier: null,
    supplierProductId: null,
    supplierVariantMappings: null,
    supplierUrl: null,
    supplierPrice: 1200,
    supplierWeightG: 290,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

const DEMO_PRODUCT_IMAGE_MAP: Record<number, string[]> = {
  1: ["/assets/shein/shein-machine-espresso-20-bars.jpg", "/assets/shein/shein-mousseur-lait.jpg"],
  2: ["/assets/shein/shein-mini-moulin.jpg", "/assets/shein/shein-french-press.jpg"],
  3: ["/assets/shein/shein-espresso-portable.jpg", "/assets/shein/shein-mini-machine-capsules.jpg"],
  4: ["/assets/category-high-tech.webp", "/assets/category-high-tech-hero.webp"],
  5: ["/assets/category-beaute.webp", "/assets/category-beaute-hero.webp"],
  6: ["/assets/category-sport.webp", "/assets/category-sport-hero.webp"],
  7: ["/assets/category-mode.webp", "/assets/category-mode-hero.webp"],
  8: ["/assets/category-auto.webp", "/assets/category-auto-hero.webp"],
  9: ["/assets/dyama/dyama-category-floral.webp", "/assets/dyama/dyama-editorial-lavender.webp"],
  10: ["/assets/dyama/dyama-category-landscape.webp", "/assets/dyama/dyama-highlight-craft-table.webp"],
};

export const DEMO_PRODUCT_IMAGES: DemoProductImage[] = Object.entries(DEMO_PRODUCT_IMAGE_MAP).flatMap(
  ([productIdStr, urls]) =>
    urls.map((imageUrl, index) => ({
      id: Number(productIdStr) * 10 + index + 1,
      storeId: 1,
      productId: Number(productIdStr),
      imageUrl,
      displayOrder: index,
      createdAt: now,
    }))
);

const SUPPORTED_DELIVERY_COUNTRIES = ["CH", "FR", "DE", "BE", "IT", "AT", "ES", "NL", "GB", "US", "CA", "DZ", "MA"];

export const DEMO_DELIVERY_PROFILES: DemoDeliveryProfile[] = DEMO_PRODUCTS.flatMap((product) =>
  SUPPORTED_DELIVERY_COUNTRIES.map((countryCode, idx) => ({
    id: product.id * 100 + idx + 1,
    storeId: product.storeId,
    productId: product.id,
    countryCode,
    supplierVariantId: null,
    supplierShippingCost: 450,
    customerShippingCost: countryCode === "CH" ? 690 : 890,
    deliveryMethod: countryCode === "CH" ? "PostPac Priority Suivi" : "Livraison Internationale Suivie",
    minDeliveryDays: countryCode === "CH" ? 2 : 4,
    maxDeliveryDays: countryCode === "CH" ? 4 : 7,
    quotedAt: now,
    createdAt: now,
    updatedAt: now,
  }))
);

export const DEMO_REVIEWS: DemoReview[] = [
  {
    id: 1,
    storeId: 1,
    productId: 1,
    userId: null,
    authorName: "Camille R. (Lausanne)",
    rating: 5,
    comment: "Qualité d'extraction remarquable et finitions impeccables. La mousse de lait est digne d'un coffee shop.",
    status: "approved",
    createdAt: now,
  },
  {
    id: 2,
    storeId: 1,
    productId: 1,
    userId: null,
    authorName: "Marc-Antoine V. (Genève)",
    rating: 5,
    comment: "Livraison reçue en 72h, emballage très soigné et prise en main immédiate.",
    status: "approved",
    createdAt: now,
  },
  {
    id: 3,
    storeId: 1,
    productId: 2,
    userId: null,
    authorName: "Sophie D. (Zurich)",
    rating: 5,
    comment: "Mouture très homogène et niveau sonore très doux le matin.",
    status: "approved",
    createdAt: now,
  },
  {
    id: 4,
    storeId: 1,
    productId: 4,
    userId: null,
    authorName: "Yacine B. (Neuchâtel)",
    rating: 5,
    comment: "Compact, puissant et ne chauffe pas. Parfait pour voyager léger.",
    status: "approved",
    createdAt: now,
  },
  {
    id: 5,
    storeId: 1,
    productId: 5,
    userId: null,
    authorName: "Nadia K. (Bâle)",
    rating: 5,
    comment: "Très beau coffret cadeau, le quartz rose est d'une fraîcheur apaisante.",
    status: "approved",
    createdAt: now,
  },
];

export const DEMO_BANNERS: DemoBanner[] = [
  {
    id: 1,
    storeId: 1,
    title: "L'exigence du quotidien, livrée avec clarté",
    subtitle: "Objets utiles, équipements café de spécialité et collections d'atelier avec disponibilité et livraison vérifiées avant commande.",
    imageUrl: "/assets/hero-best-offers.webp",
    linkUrl: "/boutique",
    active: 1,
    displayOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    storeId: 1,
    title: "Silhouettes & Accessoires Intemporels",
    subtitle: "Des pièces choisies pour leur tenue, leurs matières durables et leur élégance sobre.",
    imageUrl: "/assets/hero-mode-accessoires.webp",
    linkUrl: "/categorie/mode",
    active: 1,
    displayOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    storeId: 1,
    title: "Rituels Beauté & Bien-Être",
    subtitle: "Prenez soin de vous avec notre sélection d'instruments de soin et de relaxation.",
    imageUrl: "/assets/hero-beaute-bien-etre.webp",
    linkUrl: "/categorie/beaute-bien-etre",
    active: 1,
    displayOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
];

// Mutable in-memory state for interactive demo sessions when DATABASE_URL is absent
const inMemoryUsers = new Map<string, DemoUser>();
const inMemoryCarts = new Map<string, Array<{ id: number; productId: number; quantity: number }>>();
const inMemoryStoreSettings = new Map<string, string>();
let nextUserId = 10;
let nextCartItemId = 100;

// Pre-seed default demo admin & super admin accounts
// Password hash corresponds to "MazighoAdmin2026!" (scrypt-v1)
export const DEFAULT_SUPER_ADMIN_PASSWORD_HASH =
  "scrypt-v1$CTQP92IgJcVPDF3kVjS4jw$TkBvKJ-2fv4qIXv0n_o7kyCzluiwY1dWmgn0O12PgCOofEusR87azMf8IUhhrSwuHqjfZcLuJfgvQn2IWT0a4g";

const DEMO_ADMIN_USER: DemoUser = {
  id: 1,
  openId: "local_demo_admin",
  name: "Direction MAZIGHO Studio",
  email: "admin@mazigho.ch",
  passwordHash: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
  loginMethod: "password",
  role: "admin",
  accountStatus: "active",
  createdAt: now,
  updatedAt: now,
  lastSignedIn: now,
};

const DEMO_OPERATOR_USER: DemoUser = {
  id: 2,
  openId: "operator-yacbhl71",
  name: "Yacine (Super Admin)",
  email: "yacbhl71@gmail.com",
  passwordHash: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
  loginMethod: "password",
  role: "admin",
  accountStatus: "active",
  createdAt: now,
  updatedAt: now,
  lastSignedIn: now,
};

const DEMO_BHLL_USER: DemoUser = {
  id: 4,
  openId: "user-bhllvoyage",
  name: "BHLL Voyage",
  email: "bhllvoyage@gmail.com",
  passwordHash: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
  loginMethod: "password",
  role: "user",
  accountStatus: "active",
  createdAt: now,
  updatedAt: now,
  lastSignedIn: now,
};

inMemoryUsers.set(DEMO_ADMIN_USER.openId, DEMO_ADMIN_USER);
inMemoryUsers.set(DEMO_OPERATOR_USER.openId, DEMO_OPERATOR_USER);
inMemoryUsers.set("firebase_operator-yacbhl71", DEMO_OPERATOR_USER);
inMemoryUsers.set(DEMO_BHLL_USER.openId, DEMO_BHLL_USER);

// Seed store 4 settings for BHLL Voyage Boutique with Premium Theme luminaLuxe
inMemoryStoreSettings.set("4:site_name", "BHLL Voyage Boutique");
inMemoryStoreSettings.set("4:contact_email", "bhllvoyage@gmail.com");
inMemoryStoreSettings.set("4:store_currency_code", "CHF");
inMemoryStoreSettings.set("4:currency", "CHF");
inMemoryStoreSettings.set("4:provisioning_mode", "gift");
inMemoryStoreSettings.set("4:provisioning_draft_id", "1");
inMemoryStoreSettings.set("4:commercial_offer_mode", "perpetual_sale");
inMemoryStoreSettings.set("4:store_factory_model", "clothing");
inMemoryStoreSettings.set("4:storefront_theme_access", JSON.stringify({
  themeIds: ["luminaLuxe", "auraJewelry", "gallerySignature", "glamourNoir", "fashion", "jewelry"],
}));
inMemoryStoreSettings.set("4:design_profile", JSON.stringify({
  themeId: "luminaLuxe",
  paletteId: "midnight",
  typographyId: "editorial",
  brandName: "BHLL Voyage Boutique",
  brandMessage: "Boutique offerte BHLL Voyage — Luxe, Haute Horlogerie & Bagagerie d'Exception",
  highlightEyebrow: "Collection Prestige BHLL Voyage",
  highlightTitle: "L'élégance du voyage et de la haute horlogerie.",
  highlightText: "Une sélection exclusive de pièces horlogères, maroquinerie de voyage et accessoires de prestige signée BHLL Voyage.",
  customColorsEnabled: true,
  customPrimary: "#0F0D0A",
  customAccent: "#D97706",
  customSoft: "#1C1917",
}));

// Seed default provisioning_mode & commercial_offer_mode for all client stores
for (const store of DEMO_STORES) {
  if (store.isPlatformStore) continue;
  if (!inMemoryStoreSettings.has(`${store.id}:provisioning_mode`)) {
    inMemoryStoreSettings.set(`${store.id}:provisioning_mode`, "gift");
  }
  if (!inMemoryStoreSettings.has(`${store.id}:commercial_offer_mode`)) {
    inMemoryStoreSettings.set(
      `${store.id}:commercial_offer_mode`,
      store.id % 2 === 0 ? "perpetual_sale" : "rental"
    );
  }
  if (!inMemoryStoreSettings.has(`${store.id}:store_currency_code`)) {
    inMemoryStoreSettings.set(`${store.id}:store_currency_code`, "CHF");
  }
  if (!inMemoryStoreSettings.has(`${store.id}:storefront_theme_access`)) {
    inMemoryStoreSettings.set(`${store.id}:storefront_theme_access`, JSON.stringify({
      themeIds: ["violetCraft", "fashion", "jewelry", "luminaLuxe", "nordicMinimal", "studioFlux"],
    }));
  }
}

export type DemoProvisioningDraft = {
  id: number;
  displayName: string;
  requestedDomain: string;
  ownerName: string;
  ownerEmail: string;
  businessType: "animalier" | "bijoux" | "vetements" | "autre";
  customBusinessTheme: string | null;
  themePreset: string | null;
  factoryModel: string;
  provisioningTemplate: string;
  launchMarket: string;
  paymentRoute: string;
  preferredCurrency: string;
  requestedPlan: string | null;
  copySourceStoreId: number | null;
  copySelection: string | null;
  status: "draft" | "ready_for_confirmation" | "archived";
  notes: string | null;
  provisionedStoreId: number | null;
  provisionedAt: Date | null;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
};

export const DEMO_PROVISIONING_DRAFTS: DemoProvisioningDraft[] = [
  {
    id: 1,
    displayName: "BHLL Voyage Boutique",
    requestedDomain: "bhll.mazigho.com",
    ownerName: "BHLL Voyage",
    ownerEmail: "bhllvoyage@gmail.com",
    businessType: "vetements",
    customBusinessTheme: "Voyage, bagagerie de luxe & haute horlogerie",
    themePreset: "luminaLuxe",
    factoryModel: "clothing",
    provisioningTemplate: "standard",
    launchMarket: "switzerland",
    paymentRoute: "stripe_connect",
    preferredCurrency: "CHF",
    requestedPlan: "pro",
    copySourceStoreId: null,
    copySelection: null,
    status: "ready_for_confirmation",
    notes: "Boutique offerte à bhllvoyage@gmail.com avec thème premium Lumina Luxe attribué.",
    provisionedStoreId: 4,
    provisionedAt: now,
    createdByUserId: 2,
    createdAt: now,
    updatedAt: now,
  },
];

let nextDemoBannerId = 100;
export function createDemoBanner(
  data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    active?: number;
    displayOrder?: number;
  },
  storeId = 1
) {
  const banner: DemoBanner = {
    id: nextDemoBannerId++,
    storeId,
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    active: data.active ?? 1,
    displayOrder: data.displayOrder ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  DEMO_BANNERS.push(banner);
  return { success: true, id: banner.id };
}

export function updateDemoBanner(
  id: number,
  data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    active: number;
    displayOrder: number;
  },
  storeId = 1
) {
  const found = DEMO_BANNERS.find(b => b.id === id && b.storeId === storeId);
  if (!found) {
    return createDemoBanner({ ...data }, storeId);
  }
  found.title = data.title;
  found.subtitle = data.subtitle || null;
  found.imageUrl = data.imageUrl;
  found.linkUrl = data.linkUrl || null;
  found.active = data.active;
  found.displayOrder = data.displayOrder;
  found.updatedAt = new Date();
  return { success: true };
}

export function deleteDemoBanner(id: number, storeId = 1) {
  const index = DEMO_BANNERS.findIndex(b => b.id === id && b.storeId === storeId);
  if (index >= 0) DEMO_BANNERS.splice(index, 1);
  return { success: true };
}

type DemoAccountToken = {
  id: number;
  userId: number;
  purpose: "account_invitation" | "password_reset";
  token: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};
const inMemoryAccountTokens: DemoAccountToken[] = [];
let nextTokenId = 1;

export function issueDemoAccountToken(userId: number, purpose: "account_invitation" | "password_reset") {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const entry: DemoAccountToken = {
    id: nextTokenId++,
    userId,
    purpose,
    token,
    tokenHash,
    expiresAt,
    usedAt: null,
  };
  inMemoryAccountTokens.push(entry);
  return { id: entry.id, token, expiresAt };
}

export function consumeDemoAccountToken(token: string, purpose: "account_invitation" | "password_reset"): number {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const found = inMemoryAccountTokens.find(
    t => (t.token === token || t.tokenHash === tokenHash) && t.purpose === purpose && !t.usedAt && t.expiresAt > now
  );
  if (!found) throw new Error("TOKEN_INVALID_OR_EXPIRED");
  found.usedAt = now;
  return found.userId;
}

export function updateDemoUserPassword(openId: string, passwordHash: string): DemoUser | undefined {
  const user = inMemoryUsers.get(openId);
  if (user) {
    user.passwordHash = passwordHash;
    user.loginMethod = "password";
    user.accountStatus = "active";
    user.updatedAt = new Date();
    return user;
  }
  return undefined;
}

export function updateDemoUserPasswordByEmail(email: string, passwordHash: string): DemoUser | undefined {
  const normalized = email.trim().toLowerCase();
  for (const user of Array.from(inMemoryUsers.values())) {
    if (user.email?.toLowerCase() === normalized) {
      user.passwordHash = passwordHash;
      user.loginMethod = "password";
      user.accountStatus = "active";
      user.updatedAt = new Date();
      return user;
    }
  }
  return undefined;
}

export function getDemoUserByOpenId(openId: string): DemoUser | undefined {
  return inMemoryUsers.get(openId);
}

export function getDemoUserByEmail(email: string): DemoUser | undefined {
  const normalized = email.trim().toLowerCase();
  for (const user of Array.from(inMemoryUsers.values())) {
    if (user.email?.toLowerCase() === normalized) return user;
  }
  return undefined;
}

export function createDemoPasswordUser(input: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
}): DemoUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  const isAdminEmail =
    normalizedEmail === "yacbhl71@gmail.com" ||
    normalizedEmail === "admin@mazigho.ch" ||
    normalizedEmail.endsWith("@mazigho.ch");
  const user: DemoUser = {
    id: nextUserId++,
    openId: input.openId,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    loginMethod: "password",
    role: isAdminEmail ? "admin" : "user",
    accountStatus: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  inMemoryUsers.set(user.openId, user);
  return user;
}

export function upsertDemoFirebaseUser(input: {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
}): DemoUser {
  const openId = `firebase_${input.uid}`;
  const normalizedEmail = input.email.trim().toLowerCase();
  const isAdminEmail =
    input.emailVerified &&
    (normalizedEmail === "yacbhl71@gmail.com" ||
      normalizedEmail === "admin@mazigho.ch" ||
      normalizedEmail.endsWith("@mazigho.ch"));

  const existing = inMemoryUsers.get(openId) || getDemoUserByEmail(normalizedEmail);
  if (existing) {
    existing.name = input.name.trim() || existing.name;
    existing.email = normalizedEmail || existing.email;
    if (isAdminEmail) existing.role = "admin";
    existing.updatedAt = new Date();
    existing.lastSignedIn = new Date();
    inMemoryUsers.set(existing.openId, existing);
    return existing;
  }

  const user: DemoUser = {
    id: nextUserId++,
    openId,
    name: input.name.trim() || "Utilisateur Google",
    email: normalizedEmail,
    passwordHash: null,
    loginMethod: "google",
    role: isAdminEmail ? "admin" : "user",
    accountStatus: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  inMemoryUsers.set(user.openId, user);
  return user;
}

export function getDemoStoreSettingValue(storeId: number | undefined, key: string): string | null {
  const effectiveStoreId = storeId ?? 1;
  return inMemoryStoreSettings.get(`${effectiveStoreId}:${key}`) ?? null;
}

export function setDemoStoreSettingValue(storeId: number | undefined, key: string, value: string): void {
  const effectiveStoreId = storeId ?? 1;
  inMemoryStoreSettings.set(`${effectiveStoreId}:${key}`, value);
}

export function getDemoCart(userId: number, storeId = 1) {
  const cartKey = `${storeId}:${userId}`;
  const rawItems = inMemoryCarts.get(cartKey) ?? [];
  const items = rawItems
    .map((item) => {
      const product = DEMO_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        name: product.name,
        price: product.price,
        slug: product.slug,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    id: userId * 100 + storeId,
    items,
  };
}

export function addDemoCartItem(userId: number, productId: number, quantity: number, storeId = 1) {
  const product = DEMO_PRODUCTS.find((p) => p.id === productId && p.status === "active");
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  const cartKey = `${storeId}:${userId}`;
  const items = inMemoryCarts.get(cartKey) ?? [];
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ id: nextCartItemId++, productId, quantity });
  }
  inMemoryCarts.set(cartKey, items);
  return { success: true };
}

export function updateDemoCartItem(userId: number, productId: number, quantity: number, storeId = 1) {
  const cartKey = `${storeId}:${userId}`;
  const items = inMemoryCarts.get(cartKey) ?? [];
  if (quantity <= 0) {
    inMemoryCarts.set(
      cartKey,
      items.filter((i) => i.productId !== productId)
    );
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = quantity;
    inMemoryCarts.set(cartKey, items);
  }
  return { success: true };
}

export function clearDemoCart(userId: number, storeId = 1) {
  const cartKey = `${storeId}:${userId}`;
  inMemoryCarts.set(cartKey, []);
  return { success: true };
}

export function getDemoAdminStats() {
  const activeProducts = DEMO_PRODUCTS.filter((p) => p.status === "active");
  const revenueTrend: Array<{ date: string; revenue: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    revenueTrend.push({ date: key, revenue: (i % 4 === 0 ? 38900 : i % 3 === 0 ? 18900 : 9400) });
  }
  const revenueLast30Days = revenueTrend.reduce((acc, row) => acc + row.revenue, 0);
  return {
    products: DEMO_PRODUCTS.length,
    activeProducts: activeProducts.length,
    draftProducts: 0,
    orders: 24,
    pendingOrders: 3,
    users: 18,
    revenue: revenueLast30Days,
    averageCart: 14200,
    topProducts: [
      { productId: 1, name: "Machine Espresso Barista 20 Bars", quantitySold: 9, revenue: 170100 },
      { productId: 6, name: "Pistolet de Massage Percussion Pro Silence", quantitySold: 6, revenue: 56400 },
      { productId: 7, name: "Sac Cabas Structuré Cuir Végétal", quantitySold: 5, revenue: 57500 },
    ],
    revenueLast30Days,
    revenueTrend,
    pendingReviews: 1,
    unreadMessages: 2,
    lowStockProducts: DEMO_PRODUCTS.filter((p) => p.stock <= 12).map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
    })),
    recentOrders: [
      {
        id: 1001,
        status: "paid",
        totalAmount: 18900,
        createdAt: now,
        userName: "Camille Rochat",
        userEmail: "camille.rochat@example.ch",
      },
      {
        id: 1002,
        status: "shipped",
        totalAmount: 14300,
        createdAt: now,
        userName: "Marc-Antoine V.",
        userEmail: "ma.v@example.ch",
      },
    ],
    orderStatusCounts: [
      { status: "paid", value: 14 },
      { status: "shipped", value: 7 },
      { status: "pending", value: 3 },
    ],
    catalogCategoryCounts: [
      { categoryName: "Maison & Organisation", value: 3 },
      { categoryName: "High-Tech & Gadgets", value: 1 },
      { categoryName: "Beauté & Bien-Être", value: 1 },
      { categoryName: "Sport & Fitness", value: 1 },
      { categoryName: "Mode", value: 1 },
      { categoryName: "Collections Créatives", value: 2 },
    ],
    catalogReadiness: {
      productsWithoutDeliveryProfiles: [],
      productsNeedingTranslations: [],
    },
  };
}
