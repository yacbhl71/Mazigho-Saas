import type { DesignProfile } from "./db";

export const LEGACY_RITUELS_STORE_ID = 7020003;

export const RITUELS_PACKAGING_IMAGE = "/assets/rituels/rituels-collection-packaging-concept.jpg";
export const RITUELS_EARL_GREY_IMAGE = "/assets/rituels/rituels-earl-grey-infusette-box-concept.jpg";

const now = new Date("2026-10-03T10:00:00.000Z");

export const legacyRituelsDesignPatch: Partial<DesignProfile> = {
  themeId: "mazighoAtelierEditorial",
  paletteId: "sage",
  typographyId: "editorial",
  brandName: "Rituels d’Infusion",
  brandMessage: "Thés, rooibos et infusions imaginés comme des rituels à partager.",
  highlightEyebrow: "Maison Safaya · Rabios",
  highlightTitle: "Des rituels d’infusion pour chaque moment.",
  highlightText: "Une collection sensible de thés, rooibos, infusions et coffrets, pensée avec soin.",
  highlightImageUrl: RITUELS_PACKAGING_IMAGE,
  storyTitle: "Une maison de thés, de rooibos et de gestes simples.",
  storyText: "Rituels d’Infusion rassemble des mélanges lumineux, des rooibos enveloppants et des coffrets imaginés pour transformer une pause en véritable moment pour soi.",
  storyImageUrl: RITUELS_EARL_GREY_IMAGE,
  editorialEyebrow: "L’univers Rituels",
  editorialTitle: "Pochettes, boîtes et coffrets à offrir ou à garder près de soi.",
  editorialImageUrl: RITUELS_PACKAGING_IMAGE,
  navigationHome: "Accueil",
  navigationShop: "La collection",
  navigationCategories: "Nos univers",
  navigationCreations: "Les coffrets",
  navigationContact: "Contact",
  discoveryEyebrow: "Explorer la collection",
  discoveryTitle: "Des infusions pour chaque rituel",
  discoveryText: "Thés sélectionnés, infusions fruitées, rooibos et lattes : découvrez les familles historiques de Rabios.",
  discoveryAllShopLabel: "Voir la collection",
  discoveryAllShopUrl: "/boutique",
  discoveryBrowseShopLabel: "Découvrir les univers",
  discoveryBrowseShopUrl: "/categories",
  storyEyebrow: "L’esprit Rituels",
  storyFollowup: "Des compositions imaginées avec délicatesse, de la première gorgée au dernier parfum.",
  storyPoints: ["Des mélanges choisis avec soin", "Des pochettes pensées comme des objets", "Des coffrets pour créer un moment"],
  storyCtaLabel: "Entrer dans l’univers",
  storyCtaUrl: "/boutique",
  storyVisualEyebrow: "Maison Safaya",
  storyVisualTitle: "Le goût du calme, de la lumière et des choses bien faites.",
  storyPromiseEyebrow: "Notre promesse",
  storyPromise: "Une pause qui ressemble à un rituel.",
  closingEyebrow: "Rituels à offrir",
  closingTitle: "Composez votre moment d’infusion.",
  closingText: "Pochettes, boîtes et coffrets accompagnent les matins doux, les après-midi lumineux et les soirées calmes.",
  closingShopCtaLabel: "Voir les créations",
  closingShopCtaUrl: "/boutique",
  closingContactCtaLabel: "Découvrir la maison",
  closingContactCtaUrl: "/contact",
  closingVisualText: "Rituels d’Infusion",
  closingImageUrl: RITUELS_PACKAGING_IMAGE,
  textBanners: [],
  shopPageCopyCustomized: true,
  shopEyebrow: "La collection Rabios",
  shopTitle: "Thés, rooibos et infusions",
  shopIntro: "Retrouvez les compositions historiques de Rituels d’Infusion.",
  shopProductsEyebrow: "Sélection Rituels",
  shopProductsTitle: "Les créations de la maison",
  showShopEditorial: true,
  shopEditorialEyebrow: "Pochettes & coffrets",
  shopEditorialTitle: "Des formats conçus pour offrir un rituel.",
  shopEditorialImageUrl: RITUELS_PACKAGING_IMAGE,
  customColorsEnabled: true,
  customPrimary: "#52634b",
  customAccent: "#c99655",
  customSoft: "#f3eee5",
  buttonRadius: "rounded",
  headerLayout: "split",
  footerBackgroundColor: "#334231",
  footerTextColor: "#f5f0e6",
  footerDescription: "Rituels d’Infusion · Thés, rooibos et créations de la maison.",
  footerContactText: "Une collection historique Rabios imaginée avec Maison Safaya.",
  footerCopyrightText: "© Rituels d’Infusion · Rabios",
  announcementItems: ["Une collection historique Rabios", "Présentation éditoriale", "Commande et paiement fermés"],
  reassuranceItems: [
    { icon: "sparkles", title: "Collection historique", text: "Une sélection restaurée à titre éditorial." },
    { icon: "check", title: "Visuels Rituels", text: "Boîtes, pochettes et coffrets de l’univers Maison Safaya." },
    { icon: "arrow", title: "Sans transaction", text: "Aucun prix, panier ou paiement n’est ouvert." },
  ],
};

type LegacyCategory = {
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

export const legacyRituelsCategories: LegacyCategory[] = [
  { id: 702000301, storeId: LEGACY_RITUELS_STORE_ID, name: "Thés sélectionnés", slug: "thes-selectionnes", description: "Thés noirs et verts choisis pour leurs notes et leurs accords.", imageUrl: RITUELS_EARL_GREY_IMAGE, icon: "leaf", publicMessage: null, publicNotice: null, emptyStateMessage: null, catalogSection: "standard", displayOrder: 1, createdAt: now },
  { id: 702000302, storeId: LEGACY_RITUELS_STORE_ID, name: "Infusions & rooibos", slug: "infusions-rooibos", description: "Des rooibos ronds et des infusions fruitées à savourer à tout moment.", imageUrl: RITUELS_PACKAGING_IMAGE, icon: "sparkles", publicMessage: null, publicNotice: null, emptyStateMessage: null, catalogSection: "standard", displayOrder: 2, createdAt: now },
  { id: 702000303, storeId: LEGACY_RITUELS_STORE_ID, name: "Lattes & superaliments", slug: "lattes-superaliments", description: "Des mélanges généreux pour composer une pause réconfortante.", imageUrl: RITUELS_PACKAGING_IMAGE, icon: "sun", publicMessage: null, publicNotice: null, emptyStateMessage: null, catalogSection: "standard", displayOrder: 3, createdAt: now },
  { id: 702000304, storeId: LEGACY_RITUELS_STORE_ID, name: "Pochettes & coffrets", slug: "pochettes-coffrets", description: "Les formats historiques Rituels à offrir et à collectionner.", imageUrl: RITUELS_PACKAGING_IMAGE, icon: "gift", publicMessage: null, publicNotice: null, emptyStateMessage: null, catalogSection: "creations", displayOrder: 4, createdAt: now },
];

type LegacyProduct = {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  featured: number;
  showNewBadge: number;
  status: "active";
  options: string | null;
  supplier: null;
  createdAt: Date;
  updatedAt: Date;
};

const legacyProduct = (id: number, categoryId: number, name: string, slug: string, description: string, imageUrl: string, featured = 0): LegacyProduct & { legacyImageUrl: string } => ({
  id,
  storeId: LEGACY_RITUELS_STORE_ID,
  categoryId,
  name,
  slug,
  description,
  longDescription: description,
  // Aucun prix historique fiable n’a été retrouvé : null évite d’afficher un
  // montant fictif tout en conservant les références dans la vitrine.
  price: null as unknown as number,
  originalPrice: null,
  stock: 0,
  featured,
  showNewBadge: 0,
  status: "active",
  options: null,
  supplier: null,
  createdAt: now,
  updatedAt: now,
  legacyImageUrl: imageUrl,
});

export const legacyRituelsProducts = [
  legacyProduct(702000401, 702000301, "Thé Noir Earl Grey Bleu", "the-noir-earl-grey-bleu", "Un thé noir aux notes élégantes et lumineuses, présenté dans son écrin Rituels.", RITUELS_EARL_GREY_IMAGE, 1),
  legacyProduct(702000402, 702000301, "Thé Noir Mandala", "the-noir-mandala", "Un thé noir profond imaginé pour les pauses lentes et les conversations.", RITUELS_PACKAGING_IMAGE, 1),
  legacyProduct(702000403, 702000301, "Thé Vert Basilic Citron", "the-vert-basilic-citron", "Une composition verte et fraîche aux accents de citron et d’herbes.", RITUELS_PACKAGING_IMAGE),
  legacyProduct(702000404, 702000301, "Thé Vert Fruits de la Forêt", "the-vert-fruits-de-la-foret", "Un accord fruité et délicat inspiré des baies de la forêt.", RITUELS_PACKAGING_IMAGE),
  legacyProduct(702000405, 702000302, "Rooibos Quatre Saisons", "rooibos-quatre-saisons", "Un rooibos rond et chaleureux pour accompagner les quatre saisons.", RITUELS_PACKAGING_IMAGE, 1),
  legacyProduct(702000406, 702000302, "Rooibos Citron Grec", "rooibos-citron-grec", "Une infusion solaire, vive et citronnée.", RITUELS_PACKAGING_IMAGE, 1),
  legacyProduct(702000407, 702000302, "Rooibos Miel Gingembre Citron", "rooibos-miel-gingembre-citron", "La douceur du miel rencontre le gingembre et le citron.", RITUELS_PACKAGING_IMAGE),
  legacyProduct(702000408, 702000302, "Rooibos Truffe d’Orange", "rooibos-truffe-orange", "Une composition enveloppante aux notes d’orange et d’épices douces.", RITUELS_PACKAGING_IMAGE, 1),
  legacyProduct(702000409, 702000303, "Rituel des Épices", "rituel-des-epices", "Un mélange généreux aux accents chauds et réconfortants.", RITUELS_PACKAGING_IMAGE),
  legacyProduct(702000410, 702000304, "Accord du Soir", "accord-du-soir", "Une pochette pensée pour accompagner les fins de journée.", RITUELS_PACKAGING_IMAGE),
  legacyProduct(702000411, 702000304, "Premiers Rituels", "premiers-rituels", "Un coffret découverte pour entrer dans l’univers de la maison.", RITUELS_PACKAGING_IMAGE),
];

export function isLegacyRituelsStore(storeId?: number): boolean {
  return storeId === LEGACY_RITUELS_STORE_ID;
}

export function getLegacyImages(ids: number[]) {
  return new Map(ids.map(id => {
    const product = legacyRituelsProducts.find(item => item.id === id);
    return [id, product ? [{ id: id + 1000000, storeId: LEGACY_RITUELS_STORE_ID, productId: id, imageUrl: product.legacyImageUrl, displayOrder: 0, createdAt: now }] : []] as const;
  }));
}
