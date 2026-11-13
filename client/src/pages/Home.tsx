import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Quote, Search, ShoppingCart, Sparkles, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStorePrice } from "@/hooks/useStorePrice";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import ShoppableStoriesBanner from "@/components/ShoppableStoriesBanner";
import SpinToWinPopup from "@/components/SpinToWinPopup";
import ProductCompareDrawer from "@/components/ProductCompareDrawer";
import { trpc } from "@/lib/trpc";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getDiscoveryTiles, getPublicCopy, interpolatePublicCopy } from "@/lib/publicCopy";
import { t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { getLocalizedCategoryPresentation } from "@/lib/categoryPresentation";
import { isProductVisibleForStorefront } from "@shared/storefrontProductVisibility";
import { getLimitedStorefrontCopy } from "@/lib/limitedStorefrontCopy";

const optimizedBuiltInImageUrls: Record<string, string> = {
  "/assets/home-lifestyle-top.jpg": "/assets/home-lifestyle-top.webp",
  "/assets/home-editorial-divider.jpg": "/assets/home-editorial-divider.webp",
};

function getOptimizedHomeImageUrl(url: string) {
  return optimizedBuiltInImageUrls[url] || url;
}

const responsiveHomeImageSources: Record<string, string> = {
  "/assets/home-lifestyle-top.webp": "/assets/home-lifestyle-top-640.webp 640w, /assets/home-lifestyle-top.webp 1920w",
  "/assets/category-mode.webp": "/assets/category-mode-sm.webp 480w, /assets/category-mode.webp 960w",
  "/assets/category-beaute.webp": "/assets/category-beaute-sm.webp 480w, /assets/category-beaute.webp 960w",
  "/assets/category-maison.webp": "/assets/category-maison-sm.webp 480w, /assets/category-maison.webp 960w",
  "/assets/category-sport.webp": "/assets/category-sport-sm.webp 480w, /assets/category-sport.webp 960w",
  "/assets/category-high-tech.webp": "/assets/category-high-tech-sm.webp 480w, /assets/category-high-tech.webp 960w",
  "/assets/category-auto.webp": "/assets/category-auto-sm.webp 480w, /assets/category-auto.webp 960w",
};

const categoryAccents = [
  "from-orange-100 via-amber-50 to-white",
  "from-sky-100 via-blue-50 to-white",
  "from-rose-100 via-pink-50 to-white",
  "from-emerald-100 via-teal-50 to-white",
  "from-violet-100 via-purple-50 to-white",
];

const discoveryTileMeta = [
  { image: "/assets/category-mode.webp", href: "/categorie/mode" },
  { image: "/assets/category-beaute.webp", href: "/categorie/beaute-bien-etre" },
  { image: "/assets/category-maison.webp", href: "/categorie/maison-organisation" },
  { image: "/assets/category-sport.webp", href: "/categorie/sport-fitness" },
  { image: "/assets/category-high-tech.webp", href: "/categorie/high-tech-gadgets" },
  { image: "/assets/category-auto.webp", href: "/categorie/auto-accessoires" },
];

export default function Home() {
  const { locale } = useLocale();
  const { formatStorePrice: formatPrice } = useStorePrice();
  const { profile, palette, isLoading: designProfileLoading } = useDesignProfile(locale);
  const generatedCopy = getPublicCopy(locale);
  const useManagedPublicTranslation = locale === "fr" || profile.contentTranslationReady === true;
  const copy = {
    ...generatedCopy,
    highlight: useManagedPublicTranslation ? { ...generatedCopy.highlight, eyebrow: profile.highlightEyebrow, title: profile.highlightTitle, text: profile.highlightText } : generatedCopy.highlight,
    story: useManagedPublicTranslation ? {
      ...generatedCopy.story,
      eyebrow: profile.storyEyebrow,
      title: profile.storyTitle,
      text: profile.storyText,
      followup: profile.storyFollowup,
      points: profile.storyPoints,
      cta: profile.storyCtaLabel,
      visualEyebrow: profile.storyVisualEyebrow,
      visualTitle: profile.storyVisualTitle,
      promiseEyebrow: profile.storyPromiseEyebrow,
      promise: profile.storyPromise,
    } : generatedCopy.story,
    editorial: useManagedPublicTranslation ? { ...generatedCopy.editorial, eyebrow: profile.editorialEyebrow, title: profile.editorialTitle } : generatedCopy.editorial,
    reassurance: useManagedPublicTranslation ? profile.reassuranceItems : generatedCopy.reassurance,
    discovery: useManagedPublicTranslation ? { ...generatedCopy.discovery, eyebrow: profile.discoveryEyebrow, title: profile.discoveryTitle, text: profile.discoveryText, allShop: profile.discoveryAllShopLabel, browseShop: profile.discoveryBrowseShopLabel } : generatedCopy.discovery,
    testimonials: useManagedPublicTranslation ? { ...generatedCopy.testimonials, eyebrow: profile.testimonialsEyebrow, title: profile.testimonialsTitle, text: profile.testimonialsText, cta: profile.testimonialsCtaLabel } : generatedCopy.testimonials,
    closing: useManagedPublicTranslation ? { ...generatedCopy.closing, eyebrow: profile.closingEyebrow, title: profile.closingTitle, text: profile.closingText, shopCta: profile.closingShopCtaLabel, contactCta: profile.closingContactCtaLabel, chfText: profile.closingVisualText } : generatedCopy.closing,
  };
  const discoveryTiles = getDiscoveryTiles(locale);
  const featuredProductsQuery = trpc.products.getFeatured.useQuery(locale, { placeholderData: (prev) => prev });
  const catalogProductsQuery = trpc.products.getAll.useQuery(locale, { placeholderData: (prev) => prev });
  const categoriesQuery = trpc.categories.getAll.useQuery(locale, { placeholderData: (prev) => prev });
  const storeAvailability = trpc.storefront.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const marketSettings = trpc.storefront.getMarketSettings.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const activeBannersQuery = trpc.content.getActiveBanners.useQuery(locale, { retry: false, refetchOnWindowFocus: false });
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const highlightImageUrl = getOptimizedHomeImageUrl(profile.highlightImageUrl);
  const storyImageUrl = getOptimizedHomeImageUrl(profile.storyImageUrl);
  const editorialImageUrl = getOptimizedHomeImageUrl(profile.editorialImageUrl);
  const closingVisualValue = profile.closingVisualValue.trim();
  const usesGlamourNoir = profile.headerLayout === "glamour";
  const usesMarketStorefront = profile.headerLayout === "market";
  const visualAccent = usesGlamourNoir ? palette.accent : palette.primary;
  const closingVisualFontFamilies = {
    inherit: undefined,
    editorial: "var(--mazigho-heading-font)",
    modern: "Arial, Helvetica, sans-serif",
    classic: "Georgia, 'Times New Roman', serif",
  } as const;

  const isClientStore = Boolean(storeAvailability.data && !storeAvailability.data.isPlatformStore);
  const limitedShowcase = Boolean(storeAvailability.data?.publicStorefront && storeAvailability.data.commerceEnabled === false);
  const hasSingleActiveMarket = marketSettings.data?.activeCountries.length === 1;
  const limitedCopy = getLimitedStorefrontCopy(locale);
  const catalogProducts = (catalogProductsQuery.data || []).filter(product => isProductVisibleForStorefront(product.deliveryProfiles, countryCode, isClientStore, Boolean(product.isManualProduct)));
  const highlightedProducts = (featuredProductsQuery.data || []).filter(product => isProductVisibleForStorefront(product.deliveryProfiles, countryCode, isClientStore, Boolean(product.isManualProduct)));
  const featuredProducts = highlightedProducts.length ? highlightedProducts : catalogProducts.slice(0, 4);
  const platformDiscoveryTiles = discoveryTileMeta.map((tile, index) => {
    const slug = tile.href.split("/").pop();
    const sourceCategory = categoriesQuery.data?.find(item => item.slug === slug);
    const category = sourceCategory ? getLocalizedCategoryPresentation(locale, sourceCategory) : undefined;
    const fallback = discoveryTiles[index];
    return { ...tile, title: category?.name || fallback?.title || t(locale, "discover"), description: category?.description || fallback?.description || "", accent: categoryAccents[index % categoryAccents.length] };
  });
  const storeDiscoveryTiles = (categoriesQuery.data || []).slice(0, 12).map((sourceCategory, index) => {
    const category = getLocalizedCategoryPresentation(locale, sourceCategory);
    return {
      href: `/categorie/${sourceCategory.slug}`,
      image: sourceCategory.imageUrl || "",
      title: category.name || sourceCategory.name,
      description: category.description || sourceCategory.description || "",
      accent: categoryAccents[index % categoryAccents.length],
    };
  });
  const localizedDiscoveryTiles = isClientStore ? storeDiscoveryTiles : platformDiscoveryTiles;
  const importedCloneStore = isClientStore && Boolean(
    (profile as unknown as { imported?: boolean; source?: string }).imported === true
    || (profile as unknown as { source?: string }).source === "clone"
    || profile.textBanners.some(banner => banner.id.startsWith("clone-")),
  );
  // Older provisioned boutiques may have a null themeId even though their
  // persisted profile already contains the fashion asset family. Detect that
  // shape as well so the public storefront does not fall back to the generic
  // limited showcase.
  const usesFashionTheme = profile.themeId === "fashion"
    || (profile.highlightImageUrl.includes("/assets/themes/fashion/") && profile.storyImageUrl.includes("/assets/themes/fashion/"));

  const orderedKeys = profile.homeOrder?.length ? profile.homeOrder : ["discovery", "story", "testimonials", "editorial", "featured"];
  const orderIndex = (key: string) => { const index = orderedKeys.indexOf(key); return index === -1 ? 90 : index; };

  // Never reveal the platform template while a client storefront is still
  // resolving its own identity and carousel. A neutral, size-stable shell is
  // preferable to showing MAZIGHO content for a fraction of a second.
  const initialStorefrontLoading = designProfileLoading || storeAvailability.isLoading || activeBannersQuery.isLoading;
  if (initialStorefrontLoading) {
    return <div className="min-h-screen bg-slate-50" aria-busy="true" aria-label="Chargement de la boutique">
      <div className="h-[104px] border-b border-slate-100 bg-white" />
      <div className="h-[520px] animate-pulse bg-slate-200/80 md:h-[560px] lg:h-[640px]" />
      <div className="container grid gap-5 py-8 md:grid-cols-3 md:py-12"><div className="h-36 rounded-3xl bg-slate-100" /><div className="h-36 rounded-3xl bg-slate-100" /><div className="h-36 rounded-3xl bg-slate-100" /></div>
    </div>;
  }

  // Le statut « limited » bloque le commerce, pas le design. Une boutique
  // ayant déjà reçu un thème doit conserver sa page complète (hero, produits,
  // univers et catégories) en mode vitrine publique. Les imports clonés
  // gardent leur rendu dédié.
  if ((importedCloneStore || (limitedShowcase && !usesFashionTheme)) && isClientStore) {
    const cloneProducts = catalogProducts.slice(0, 12);
    const heroProducts = cloneProducts.slice(0, 7);
    const cloneBrand = profile.brandName || "Votre boutique";
    const cloneIsPickyBars = /picky bars/i.test(cloneBrand);
    const importedVisualBlocks = (profile.textBanners || []).filter(banner => banner.enabled && (banner.imageUrl || banner.text || banner.buttonLabel));
    const sourceHero = importedVisualBlocks.find(block => block.type === "hero") || importedVisualBlocks.find(block => /Dec_Hero_Picky|Picky_Hero_mobile/i.test(block.imageUrl || "")) || importedVisualBlocks.find(block => block.imageUrl);
    const sourceBlocks = importedVisualBlocks.filter(block => block !== sourceHero && !/Dec_Hero_Picky|Picky_Hero_mobile/i.test(block.imageUrl || ""));
    const galleryBlocks = sourceBlocks.filter(block => (block.galleryItems?.length || 0) > 0);
    const heroImage = sourceHero?.imageUrl || profile.highlightImageUrl;
    const heroMobileImage = sourceHero?.mobileImageUrl || (cloneIsPickyBars ? "https://pickybars.com/cdn/shop/files/Picky_Hero_mobile_Dec25.png?v=1764698531&width=1200" : "");
    const heroTitle = cloneIsPickyBars ? "Food for “I’m on top of the world” moments." : (profile.highlightTitle || cloneBrand);
    const heroText = cloneIsPickyBars ? "" : (profile.highlightText || profile.brandMessage || "Découvrez la boutique importée.");
    const cloneManifestoTitle = cloneIsPickyBars ? "DE LA VRAIE NOURRITURE. UNE ÉNERGIE ÉQUILIBRÉE." : (profile.highlightText || "Une sélection pensée pour chaque moment.");
    const cloneManifestoText = cloneIsPickyBars ? "Chaque bouchée contient suffisamment d’énergie pour alimenter un voyage à la vitesse de la lumière (ou votre prochain marathon)." : "Découvrez une sélection importée, présentée dans une vitrine claire et inspirante.";
    const productLabel = (product: typeof cloneProducts[number] | undefined) => product?.title || product?.name || "";
    const pickyLogoUrl = "https://cdn.shopify.com/s/files/1/1631/5219/files/Picky_Bars_Logo_480x480.png?v=1613502749";
    const pickyCategoryImages = [
      "https://cdn.shopify.com/s/files/1/1631/5219/files/Picky_10PK_Wholeshebang.png?v=1730918048",
      "https://cdn.shopify.com/s/files/1/1631/5219/files/CinnawinBarIngredientsEcom_a68fb7a0-ce50-4813-91df-206e84405e6c.png?v=1720642418",
      "https://cdn.shopify.com/s/files/1/1631/5219/files/Berries_Cream_Oats_and_Bag_white.png?v=1729030724",
      "https://cdn.shopify.com/s/files/1/1631/5219/files/PBlicious_pile.png?v=1711662469",
    ];
    const pickyNutritionImages = [
      "https://cdn.shopify.com/s/files/1/1631/5219/files/CinnawinBarIngredientsEcom_a68fb7a0-ce50-4813-91df-206e84405e6c.png?v=1720642418&width=1200",
      "https://cdn.shopify.com/s/files/1/1631/5219/files/PBlicious_pile.png?v=1711662469&width=1400",
      "https://cdn.shopify.com/s/files/1/1631/5219/files/Berries_Cream_Oats_and_Bag_white.png?v=1729030724&width=1200",
    ];
    const pickyCategoryProducts: Array<{ label: string; product: typeof cloneProducts[number] | undefined; image?: string }> = cloneIsPickyBars ? [
      { label: "TOUS LES EN-CAS", product: cloneProducts.find(product => /10 Bar Mix Pack/i.test(productLabel(product))) || cloneProducts[0], image: pickyCategoryImages[0] },
      { label: "BARRES PROTÉINÉES AU BEURRE DE NOIX", product: cloneProducts.find(product => /Peanut Butterlicious/i.test(productLabel(product))) || cloneProducts[1], image: pickyCategoryImages[1] },
      { label: "GRUAU DE PERFORMANCE", product: cloneProducts.find(product => /Performance Oatmeal/i.test(productLabel(product))) || cloneProducts[2], image: pickyCategoryImages[2] },
      { label: "MEILLEURES VENTES", product: cloneProducts.find(product => /20 Bar Mix Pack/i.test(productLabel(product))) || cloneProducts[3], image: pickyCategoryImages[3] },
    ] : storeDiscoveryTiles.slice(0, 4).map(tile => ({ label: tile.title, product: cloneProducts[0], image: tile.image }));
    const internalUrl = (url: string | undefined) => url && url.startsWith("/") ? url : "/boutique";
    const importedNavigationItems = profile.navigationItems.filter(item => item.visible).slice(0, 4);
    return (
      <div className="min-h-screen bg-white text-slate-950">
        <div className="bg-black px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-white sm:text-sm">{cloneIsPickyBars ? "LIVRAISON GRATUITE POUR LES COMMANDES DE 50 $ ET PLUS" : "Vitrine en préparation · commandes momentanément fermées"}</div>
        <header className="relative z-20 bg-white px-5 py-4 sm:px-10 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6">
            <Link href="/" aria-label={`Accueil ${cloneBrand}`} className="shrink-0">
              {cloneIsPickyBars ? <img src={pickyLogoUrl} alt="Picky Bars" className="h-16 w-16 object-contain" /> : profile.brandLogoUrl ? <img src={profile.brandLogoUrl} alt={cloneBrand} className="h-16 w-16 object-contain" /> : <div className="grid h-16 w-16 place-items-center bg-black px-2 text-center text-xs font-black uppercase leading-none text-white">{cloneBrand}</div>}
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-tight md:flex">
              {importedNavigationItems.map(item => <Link key={item.id} href={item.href?.startsWith("/") ? item.href : "/boutique"} className="transition-opacity hover:opacity-60">{item.label}</Link>)}
            </nav>
            <div className="flex items-center gap-4" aria-label="Actions boutique">
              <Link href="/mon-compte" aria-label="Mon compte"><UserRound className="h-6 w-6" strokeWidth={1.8} /></Link>
              <Link href="/boutique" aria-label="Rechercher"><Search className="h-6 w-6" strokeWidth={1.8} /></Link>
              <Link href="/panier" aria-label="Panier" className="pointer-events-none opacity-40"><ShoppingCart className="h-6 w-6" strokeWidth={1.8} /></Link>
            </div>
          </div>
        </header>
        <main>
          {pickyCategoryProducts.length > 0 && <section className="bg-white px-4 py-6 sm:px-10 lg:px-12"><div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{pickyCategoryProducts.map((item, index) => { const image = item.image || item.product?.images?.[0]?.imageUrl; return <Link key={`${item.label}-${index}`} href="/boutique" className="group text-center"><div className="aspect-square overflow-hidden border-[3px] border-black bg-white p-3 sm:p-6"><img src={image} alt={item.label} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" loading={index > 1 ? "lazy" : "eager"} /></div><p className="mt-3 text-xs font-black uppercase leading-tight sm:text-base lg:text-lg">{item.label}</p></Link>; })}</div></section>}
          <section className="relative min-h-[430px] overflow-hidden bg-slate-950 text-white sm:min-h-[560px] lg:min-h-[650px]">
            {heroImage ? <picture className="absolute inset-0 block">{heroMobileImage && <source media="(max-width: 639px)" srcSet={heroMobileImage} />}<img src={heroImage} alt={heroTitle} className="h-full w-full object-cover object-center" /></picture> : null}
            {!cloneIsPickyBars && <div className="relative mx-auto flex min-h-[430px] max-w-[1440px] items-center px-7 py-16 sm:min-h-[560px] sm:px-16 lg:min-h-[650px]"><div className="max-w-[600px]"><h1 className="max-w-xl text-4xl font-black leading-[.98] tracking-tight sm:text-6xl lg:text-7xl">{heroTitle}</h1>{heroText && <p className="mt-6 max-w-lg text-base font-medium leading-7 text-white/90">{heroText}</p>}<Link href="/boutique" className="mt-8 inline-flex min-h-14 items-center rounded-full border-[3px] border-black bg-white px-9 text-xl font-black text-slate-950 shadow-[4px_4px_0_#000] transition hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000]">SHOP NOW <ArrowRight className="ml-3 h-6 w-6" /></Link></div></div>}
          </section>

          {heroProducts.length > 0 && <section className="border-b border-slate-100 bg-white px-4 py-8 sm:px-8"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 overflow-hidden">{heroProducts.map(product => { const imageUrl = product.images?.[0]?.imageUrl; return <Link key={`rail-${product.id}`} href={`/produit/${product.slug}`} aria-label={product.name} className="group flex h-16 min-w-[80px] flex-1 items-center justify-center sm:h-24"><div className="h-full w-full transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">{imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" loading="lazy" /> : null}</div></Link>; })}</div></section>}

          {cloneIsPickyBars ? <section className="bg-white px-5 py-14 text-center sm:px-8 sm:py-20"><div className="mx-auto max-w-5xl"><h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">DE LA VRAIE NOURRITURE. UNE ÉNERGIE ÉQUILIBRÉE.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">Chaque bouchée contient suffisamment d’énergie pour alimenter un voyage à la vitesse de la lumière (ou votre prochain marathon).</p><div className="mt-10 grid items-center gap-5 sm:grid-cols-3 sm:gap-8">{pickyNutritionImages.map((image, index) => <div key={image} className={`${index === 1 ? "sm:scale-110" : ""} mx-auto aspect-square w-full max-w-[330px] overflow-hidden rounded-full ${index === 0 ? "bg-[#e8d6c1]" : index === 1 ? "bg-[#d39b2a]" : "bg-[#c12b82]"}`}><img src={image} alt="Picky Bars nutrition" className="h-full w-full object-cover" loading="lazy" /></div>)}</div><div className="mx-auto mt-8 max-w-xl"><h3 className="text-2xl font-black uppercase sm:text-3xl">BARRES DIFFICILES</h3><p className="mt-3 text-sm leading-6 text-slate-600">En combinant des glucides à action rapide et des graisses à action prolongée, nous avons trouvé la formule pour que le moteur tourne de manière optimale.</p><Link href="/boutique" className="mt-5 inline-flex rounded-full border-2 border-black bg-white px-6 py-3 text-sm font-black uppercase shadow-[3px_3px_0_#000]">ACHETEZ MAINTENANT</Link></div></div></section> : <section className="bg-white px-6 py-16 text-center sm:py-24"><div className="mx-auto max-w-3xl"><p className="text-3xl font-black uppercase tracking-[-0.04em] text-slate-950 sm:text-5xl">{cloneManifestoTitle}</p><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">{cloneManifestoText}</p></div></section>}

          {galleryBlocks.map((block, index) => <section key={`gallery-${block.id}`} className="border-y border-slate-100 bg-white px-5 py-14 sm:px-10 sm:py-20"><div className="mx-auto max-w-7xl text-center"><p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{block.eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{block.title}</h2>{block.text && <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{block.text}</p>}<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{block.galleryItems?.map(item => <Link key={item.id} href={internalUrl(item.href)} className="group text-center"><div className="aspect-square overflow-hidden rounded-[2rem] bg-slate-100 transition duration-500 group-hover:-translate-y-1 group-hover:shadow-xl"><img src={item.imageUrl} alt={item.imageAlt || item.label} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" /></div><p className="mt-3 font-black uppercase tracking-tight">{item.label}</p></Link>)}</div></div></section>)}
          {sourceBlocks.filter(block => !galleryBlocks.includes(block) && !(cloneIsPickyBars && /Real food\. balanced energy/i.test(block.title || ""))).slice(0, 8).map((block, index) => <section key={block.id || `visual-${index}`} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-950 text-white"} border-y border-slate-100 px-6 py-14 sm:px-10 sm:py-20`}><div className={`mx-auto grid max-w-7xl items-center gap-10 ${block.imageUrl ? "lg:grid-cols-2" : "max-w-3xl text-center"}`}><div className={index % 2 === 1 && block.imageUrl ? "lg:order-2" : ""}><p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{block.eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{block.title}</h2>{block.text && <p className={`mt-5 text-base leading-7 ${index % 2 === 0 ? "text-slate-600" : "text-white/75"}`}>{block.text}</p>}{block.buttonLabel && <Link href={internalUrl(block.buttonUrl)} className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white">{block.buttonLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>}</div>{block.imageUrl && <div className={`overflow-hidden ${index % 2 === 1 ? "lg:order-1" : ""}`}><picture>{block.mobileImageUrl && <source media="(max-width: 639px)" srcSet={block.mobileImageUrl} />}<img src={block.imageUrl} alt={block.imageAlt || block.title} className="max-h-[520px] w-full object-cover transition duration-700 hover:scale-[1.02]" loading="lazy" /></picture></div>}</div></section>)}

          <section className="bg-slate-50 px-4 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Sélection</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Shop our favorites</h2></div><Link href="/boutique" className="text-sm font-black underline underline-offset-4">SHOP ALL</Link></div>
              {catalogProducts.length > 0 ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{cloneProducts.slice(0, 8).map(product => { const imageUrl = product.images?.[0]?.imageUrl; return <Link key={product.id} href={`/produit/${product.slug}`} className="group overflow-hidden bg-white transition hover:-translate-y-1 hover:shadow-xl"><div className="aspect-square bg-white">{imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="grid h-full place-items-center text-4xl text-slate-300">✦</div>}</div><div className="p-4"><h3 className="line-clamp-2 min-h-12 font-black text-slate-950">{product.name}</h3><p className="mt-3 font-bold text-slate-700">{formatPrice(product.price)}</p></div></Link>; })}</div> : <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Le catalogue cloné est en préparation.</p>}
            </div>
          </section>
        </main>
        {cloneIsPickyBars && <div className="sticky bottom-0 z-30 bg-[#08a9a2] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white">GAGNEZ DES POINTS SPÉCIAUX⌃</div>}
      </div>
    );
  }

  if (usesFashionTheme && isClientStore) {
    const fashionProducts = catalogProducts.slice(0, 4);
    const fashionFallbackTiles = [
      "/assets/themes/fashion/category-clothing.webp",
      "/assets/themes/fashion/category-shoes.webp",
      "/assets/themes/fashion/category-accessories.webp",
    ];
    const fashionTiles = localizedDiscoveryTiles.slice(0, 3).map((tile, index) => ({ ...tile, image: tile.image || fashionFallbackTiles[index] }));
    const fashionHeroImage = profile.highlightImageUrl || "/assets/themes/fashion/hero.webp";
    const fashionStoryImage = profile.storyImageUrl || "/assets/themes/fashion/category-accessories.webp";
    const fashionProductImage = (product: typeof catalogProducts[number]) => product.images?.[0]?.imageUrl || "/assets/themes/fashion/category-clothing.webp";
    const showFashionFeatured = true;
    const showFashionDiscovery = true;
    const showFashionStory = true;
    return (
      <div className="min-h-screen bg-white text-slate-950">
        {profile.showAnnouncement && profile.announcementItems[0] && <div className="bg-slate-950 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white">{profile.announcementItems[0]}</div>}
        <header className="border-b border-slate-200 bg-white">
          <div className="container flex min-h-[76px] items-center justify-between gap-5">
            <Link href="/" className="font-serif text-xl tracking-[0.08em] sm:text-2xl">{profile.brandLogoUrl ? <img src={profile.brandLogoUrl} alt={profile.brandName} className="h-12 w-auto object-contain" /> : profile.brandName}</Link>
            <div className="flex items-center gap-3 text-xs text-slate-500 sm:gap-5"><Link href="/boutique" aria-label="Rechercher" className="hover:text-slate-950">⌕ <span className="hidden sm:inline">Rechercher</span></Link><Link href="/mon-compte" aria-label="Mon compte">◯ <span className="hidden sm:inline">Compte</span></Link><Link href="/panier" aria-label="Panier">□ <span className="hidden sm:inline">Panier</span></Link></div>
          </div>
          <nav className="container flex gap-5 overflow-x-auto border-t border-slate-100 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap sm:gap-7 sm:text-xs" aria-label="Navigation mode">
            {profile.navigationItems.filter(item => item.visible).slice(0, 8).map(item => <Link key={item.id} href={item.href.startsWith("/") ? item.href : "/boutique"} className="hover:text-sky-700">{item.label || profile.brandName}</Link>)}
          </nav>
        </header>
        <main>
          <section className="relative flex min-h-[520px] items-end overflow-hidden bg-slate-900 text-white sm:min-h-[620px]">
            <picture className="absolute inset-0"><source media="(max-width: 639px)" srcSet={profile.highlightImageUrl || "/assets/themes/fashion/hero.webp"} /><img src={fashionHeroImage} alt={copy.highlight.title} className="h-full w-full object-cover" /></picture>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/25 to-transparent" />
            <div className="container relative z-10 pb-14 sm:pb-20"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">{copy.highlight.eyebrow}</p><h1 className="mt-3 max-w-2xl font-serif text-5xl leading-[.98] tracking-[-0.04em] sm:text-7xl">{copy.highlight.title}</h1><p className="mt-5 max-w-xl text-sm leading-6 text-slate-100 sm:text-base">{copy.highlight.text}</p><Link href="/boutique" className="mt-7 inline-flex bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-950">{copy.discovery.browseShop || "Découvrir la sélection"}</Link></div>
          </section>
          {showFashionFeatured && <section className="container py-14 sm:py-20"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">À découvrir maintenant</p><h2 className="mt-2 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{profile.newArrivalsTitle || "Nouveautés de la maison"}</h2></div><Link href="/boutique" className="text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4">Voir toute la collection</Link></div>{fashionProducts.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{fashionProducts.map(product => <Link key={product.id} href={`/produit/${product.slug}`} className="group border border-slate-200 bg-white"><div className="aspect-[4/5] overflow-hidden bg-slate-50"><img src={fashionProductImage(product)} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /></div><div className="p-3 sm:p-4"><h3 className="font-serif text-lg leading-tight sm:text-xl">{product.name}</h3><p className="mt-1 text-xs text-slate-500">Sélection mode</p><p className="mt-3 text-sm font-bold">{formatPrice(product.price)}</p></div></Link>)}</div> : <p className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ajoutez vos premières pièces pour remplir cette sélection.</p>}</section>}
          {showFashionDiscovery && <section className="bg-slate-50 py-14 sm:py-20"><div className="container"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">{copy.discovery.eyebrow}</p><h2 className="mt-2 max-w-2xl font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{copy.discovery.title}</h2><div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-5">{fashionTiles.map(tile => <Link key={tile.href} href={tile.href} className="group relative min-h-[250px] overflow-hidden bg-slate-900 text-white"><div className="absolute inset-0">{tile.image ? <img src={tile.image} alt={tile.title} className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105" loading="lazy" /> : null}</div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16"><h3 className="font-serif text-3xl">{tile.title}</h3><p className="mt-1 text-xs text-white/80">{tile.description}</p></div></Link>)}</div></div></section>}
          {showFashionStory && <section className="container grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">{copy.story.eyebrow}</p><h2 className="mt-2 max-w-xl font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{copy.story.title}</h2><p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">{copy.story.text}</p><Link href="/a-propos" className="mt-7 inline-flex bg-slate-950 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white">{copy.story.cta || "Lire le journal"}</Link></div><img src={fashionStoryImage} alt={copy.story.visualTitle || copy.story.title} className="aspect-[4/3] w-full object-cover" loading="lazy" /></section>}
          {profile.showEditorial && <section className="border-y border-slate-200 py-14 sm:py-20"><div className="container flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">{copy.editorial.eyebrow}</p><h2 className="mt-2 max-w-3xl font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{copy.editorial.title}</h2></div><Link href="/contact" className="text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4">Voir les conseils</Link></div></section>}
          {profile.showReassurance && <section className="container grid border-y border-slate-200 sm:grid-cols-3">{copy.reassurance.slice(0, 3).map((item, index) => <article key={`${item.title}-${index}`} className="border-b border-slate-200 px-4 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><h3 className="font-serif text-xl">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p></article>)}</section>}
          <section className="bg-slate-950 py-14 text-center text-white sm:py-20"><div className="container"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">La lettre de la maison</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Recevez nos nouvelles silhouettes.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">Un message ponctuel avec les nouveautés, les matières et les conseils de saison.</p><form className="mx-auto mt-6 flex max-w-lg flex-col gap-2 sm:flex-row" onSubmit={event => event.preventDefault()}><input type="email" placeholder="Votre adresse e-mail" aria-label="Votre adresse e-mail" className="min-h-12 flex-1 border-0 px-4 text-sm text-slate-950" /><button type="submit" className="min-h-12 bg-sky-600 px-5 text-xs font-bold uppercase tracking-[0.12em] text-white">S’inscrire</button></form></div></section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${usesGlamourNoir ? "text-white" : "text-slate-900"}`} style={{ backgroundColor: palette.soft }}>
      <Header />

      <main>
        <HeroBanner allowPlatformFallback={!isClientStore} />
        <ShoppableStoriesBanner />

        <div className="flex flex-col">
        <section style={{ order: orderIndex("highlight") }} className="container py-8 md:py-12">
          <div className="relative min-h-[230px] overflow-hidden rounded-[1.75rem] bg-slate-950 md:min-h-[300px]">
            <img src={highlightImageUrl} alt={copy.highlight.title} width={1600} height={900} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />
            <div className="relative flex min-h-[230px] items-center px-7 py-8 text-white md:min-h-[300px] md:px-12">
              <div className="max-w-md">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: visualAccent }}>{copy.highlight.eyebrow}</p>
                <h2 className="text-2xl font-semibold leading-tight md:text-4xl">{copy.highlight.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/80 md:text-base">{copy.highlight.text}</p>
              </div>
            </div>
          </div>
        </section>

        {profile.showReassurance && (
        <section style={{ order: orderIndex("reassurance") }} className={usesGlamourNoir ? "border-y border-white/10 bg-[#1a1921]" : "border-y border-[#eadfd2] bg-white/80"}>
          <div className="container grid gap-0 md:grid-cols-3">
            {copy.reassurance.slice(0, 3).map((item, index) => {
              const icon = useManagedPublicTranslation ? profile.reassuranceItems[index]?.icon : ["sparkles", "check", "arrow"][index];
              const iconStyle = usesGlamourNoir ? "bg-white/10 text-[var(--mazigho-accent)]" : index === 0 ? "bg-[var(--mazigho-soft)] text-[var(--mazigho-accent)]" : index === 1 ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700";
              return <div key={`${item.title}-${index}`} className={`flex items-center gap-4 py-5 ${index < 2 ? usesGlamourNoir ? "border-b border-white/10 md:border-b-0 md:border-r" : "border-b border-[#eadfd2] md:border-b-0 md:border-r" : ""} ${index === 0 ? "md:pr-8" : index === 1 ? "md:px-8" : "md:pl-8"}`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
                  {icon === "check" ? <Check className="h-5 w-5" /> : icon === "arrow" ? <ArrowRight className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div><p className={`text-sm font-semibold ${usesGlamourNoir ? "text-white" : "text-slate-900"}`}>{item.title}</p><p className={`mt-1 text-xs ${usesGlamourNoir ? "text-white/60" : "text-slate-500"}`}>{item.text}</p></div>
              </div>;
            })}
          </div>
        </section>
        )}

        {profile.showDiscovery && (
        <section style={{ order: orderIndex("discovery") }} className={usesGlamourNoir ? "bg-[#15141a] py-16 md:py-24" : usesMarketStorefront ? "bg-white py-10 md:py-14" : "bg-white py-16 md:py-24"}>
          <div className="container">
            <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${usesMarketStorefront ? "mb-7" : "mb-10"}`}>
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: visualAccent }}>{copy.discovery.eyebrow}</p>
                <h2 className={`text-3xl font-semibold tracking-tight md:text-4xl ${usesGlamourNoir ? "text-white" : "text-slate-950"}`}>{copy.discovery.title}</h2>
                <p className={`mt-3 text-sm leading-6 md:text-base ${usesGlamourNoir ? "text-white/65" : "text-slate-600"}`}>{copy.discovery.text}</p>
              </div>
              {copy.discovery.allShop && profile.discoveryAllShopUrl ? <a href={useManagedPublicTranslation ? profile.discoveryAllShopUrl : "/boutique"} className={`inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--mazigho-accent)] ${usesGlamourNoir ? "text-white" : "text-slate-800"}`}>{copy.discovery.allShop} <ArrowUpRight className="h-4 w-4" /></a> : null}
            </div>
            {localizedDiscoveryTiles.length > 0 ? <div className={`grid gap-4 sm:grid-cols-2 ${usesMarketStorefront ? "lg:grid-cols-5" : "lg:grid-cols-3"}`} data-storefront-discovery={usesMarketStorefront ? "market" : "standard"}>
              {localizedDiscoveryTiles.map(tile => (
                <Link key={tile.href} href={tile.href} className={`group overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:border-[var(--mazigho-accent)] hover:shadow-xl ${usesMarketStorefront ? "relative min-h-[255px] rounded-xl border-slate-200 bg-slate-950" : `rounded-2xl ${usesGlamourNoir ? "border-white/10 bg-[#22212a]" : "border-[#e5e1d4] bg-[var(--mazigho-soft)]"}`}`}>
                  {usesMarketStorefront ? <><div className={`absolute inset-0 bg-gradient-to-br ${tile.accent}`}>{tile.image ? <img src={tile.image} srcSet={responsiveHomeImageSources[tile.image]} sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw" alt={tile.title} width={960} height={1200} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Sparkles className="h-10 w-10 text-slate-500/50" aria-hidden="true" /></div>}</div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent p-5 pt-14 text-white"><p className="text-base font-bold leading-tight">{tile.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{tile.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: palette.accent }}>Voir le rayon <ChevronRight className="h-3.5 w-3.5" /></span></div></> : <><div className={`aspect-[16/10] overflow-hidden bg-gradient-to-br ${tile.accent}`}>{tile.image ? <img src={tile.image} srcSet={responsiveHomeImageSources[tile.image]} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" alt={tile.title} width={960} height={540} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Sparkles className="h-10 w-10 text-slate-500/50" aria-hidden="true" /></div>}</div><div className="flex items-start justify-between gap-3 p-5"><div><h3 className={`text-lg font-semibold group-hover:text-[var(--mazigho-accent)] ${usesGlamourNoir ? "text-white" : "text-slate-900"}`}>{tile.title}</h3><p className={`mt-2 text-sm leading-6 ${usesGlamourNoir ? "text-white/60" : "text-slate-600"}`}>{tile.description}</p></div><ChevronRight className="mt-1 h-5 w-5 shrink-0" style={{ color: palette.accent }} /></div></>}
                </Link>
              ))}
            </div> : <div className={`rounded-2xl border border-dashed px-6 py-10 text-center text-sm leading-6 ${usesGlamourNoir ? "border-white/20 bg-white/5 text-white/65" : "border-slate-300 bg-slate-50 text-slate-600"}`}>Ajoutez vos catégories dans le catalogue pour les présenter ici.</div>}
            {copy.discovery.browseShop && profile.discoveryBrowseShopUrl ? <div className="mt-8 text-center"><Button asChild variant="outline" className={usesGlamourNoir ? "border-white/25 bg-white/5 text-white hover:border-[var(--mazigho-accent)] hover:bg-white/10 hover:text-white" : "border-[#d9cbbc] bg-white text-slate-800 hover:border-[var(--mazigho-accent)] hover:text-[var(--mazigho-primary)]"}><a href={useManagedPublicTranslation ? profile.discoveryBrowseShopUrl : "/boutique"}>{copy.discovery.browseShop} <ArrowRight className="ml-2 h-4 w-4" /></a></Button></div> : null}
          </div>
        </section>
        )}

        {profile.showStory && (
        <section className="relative overflow-hidden py-16 md:py-24" style={{ backgroundColor: palette.soft, order: orderIndex("story") }}>
          <div aria-hidden="true" className="absolute -left-24 top-12 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: "color-mix(in srgb, var(--mazigho-primary) 24%, transparent)" }} />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: "color-mix(in srgb, var(--mazigho-accent) 18%, transparent)" }} />
          <div className="container relative grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${usesGlamourNoir ? "border-white/10 bg-white/5" : "bg-white/75"}`} style={{ borderColor: usesGlamourNoir ? undefined : "color-mix(in srgb, var(--mazigho-primary) 24%, white)", color: visualAccent }}><Sparkles className="h-3.5 w-3.5" /> {copy.story.eyebrow}</div>
              <h2 className={`mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl ${usesGlamourNoir ? "text-white" : "text-slate-950"}`}>{copy.story.title}</h2>
              <p className={`mt-6 max-w-xl text-base leading-7 md:text-lg ${usesGlamourNoir ? "text-white/70" : "text-slate-600"}`}>{copy.story.text}</p>
              <p className={`mt-4 max-w-xl text-base leading-7 ${usesGlamourNoir ? "text-white/70" : "text-slate-600"}`}>{copy.story.followup}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[copy.story.points[0], copy.story.points[1], copy.story.points[2]].map((point, index) => <div key={`${point}-${index}`} className={`rounded-2xl border p-4 shadow-sm ${usesGlamourNoir ? "border-white/10 bg-white/5" : "border-white/90 bg-white/80"}`}><p className="text-2xl font-semibold" style={{ color: palette.accent }}>{`0${index + 1}`}</p><p className={`mt-2 text-sm font-semibold ${usesGlamourNoir ? "text-white" : "text-slate-800"}`}>{point}</p></div>)}
              </div>
              {copy.story.cta && profile.storyCtaUrl ? <Button asChild className="text-white shadow-lg shadow-fuchsia-700/20 hover:brightness-95"><Link href={useManagedPublicTranslation ? profile.storyCtaUrl : "/boutique"} className="mt-8 inline-block" style={{ backgroundColor: palette.accent }}>{copy.story.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : null}
            </div>
            <div className="relative order-1 mx-auto w-full max-w-[570px] lg:order-2">
              <div className={`relative min-h-[420px] overflow-hidden rounded-[2.25rem] border-[10px] bg-slate-900 shadow-2xl shadow-slate-900/15 md:min-h-[520px] ${usesGlamourNoir ? "border-[#24232b]" : "border-white"}`}><img src={storyImageUrl} srcSet={responsiveHomeImageSources[storyImageUrl]} sizes="(min-width: 1024px) 570px, 100vw" alt={copy.story.visualTitle || copy.story.title} width={1600} height={900} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />{(copy.story.visualEyebrow || copy.story.visualTitle) ? <><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" /><div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5" style={{ color: palette.accent }} /> {copy.story.visualEyebrow}</div><div className="absolute bottom-7 left-7 right-7"><p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{copy.story.visualEyebrow}</p><p className="mt-2 max-w-sm text-xl font-semibold leading-tight text-white md:text-2xl">{copy.story.visualTitle}</p></div></> : null}</div>
              <div className={`absolute -bottom-11 -left-3 rounded-2xl border px-5 py-4 shadow-xl md:-left-9 ${usesGlamourNoir ? "border-white/10 bg-[#22212a]" : "bg-white"}`} style={{ borderColor: usesGlamourNoir ? undefined : "color-mix(in srgb, var(--mazigho-primary) 18%, white)" }}><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.accent }}>{copy.story.promiseEyebrow}</p><p className={`mt-1 text-sm font-semibold ${usesGlamourNoir ? "text-white" : "text-slate-800"}`}>{copy.story.promise}</p></div>
              <div className="absolute -right-3 top-12 hidden rounded-2xl p-3 text-white shadow-lg md:flex" style={{ backgroundColor: palette.accent }}><ArrowUpRight className="h-5 w-5" /></div>
            </div>
          </div>
        </section>
        )}

        {profile.showTestimonials && (
        <section style={{ order: orderIndex("testimonials") }} className="bg-slate-950 py-16 text-white md:py-24">
          <div className="container">
            <div className="mx-auto mb-10 max-w-2xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "#F2C36B" }}>{copy.testimonials.eyebrow}</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.testimonials.title}</h2></div>
            <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center"><Quote className="mx-auto h-7 w-7" style={{ color: "#F2C36B" }} aria-hidden="true" /><p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">{copy.testimonials.text}</p></div>
            {copy.testimonials.cta && profile.testimonialsCtaUrl ? <div className="mt-8 text-center"><Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><a href={useManagedPublicTranslation ? profile.testimonialsCtaUrl : "/boutique"}>{copy.testimonials.cta} <ArrowRight className="ml-2 h-4 w-4" /></a></Button></div> : null}
          </div>
        </section>
        )}

        {profile.showEditorial && (
        <section style={{ order: orderIndex("editorial") }} className="container py-4 md:py-8">
          <div className="relative min-h-[180px] overflow-hidden rounded-[1.5rem] bg-[#c9b8a8]">
            <img src={editorialImageUrl} alt={copy.editorial.title} width={1600} height={900} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3a281f]/75 via-[#3a281f]/25 to-transparent" />
            <div className="relative flex min-h-[180px] items-center px-7 py-8 text-white md:px-12">
              <div className="max-w-sm">
                <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: visualAccent }}>{copy.editorial.eyebrow}</p>
                <p className="mt-3 text-xl font-semibold md:text-3xl">{copy.editorial.title}</p>
              </div>
            </div>
          </div>
        </section>
        )}

        {profile.showFeatured && (
        <section style={{ order: orderIndex("featured"), backgroundColor: palette.soft }} className="py-16 md:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: visualAccent }}>{limitedShowcase ? limitedCopy.homeEyebrow : copy.featured.eyebrow}</p>
                <h2 className={`text-3xl font-semibold tracking-tight md:text-4xl ${usesGlamourNoir ? "text-white" : "text-slate-950"}`}>{limitedShowcase ? limitedCopy.homeTitle : copy.featured.title}</h2>
                {(limitedShowcase || !hasSingleActiveMarket) && <p className={`mt-3 max-w-xl text-sm leading-6 md:text-base ${usesGlamourNoir ? "text-white/65" : "text-slate-600"}`}>{limitedShowcase ? limitedCopy.homeText : interpolatePublicCopy(copy.featured.text, { country: countryLabel })}</p>}
              </div>
              <Link href="/boutique" className={`inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--mazigho-accent)] ${usesGlamourNoir ? "text-white" : "text-slate-800"}`}>
                {limitedShowcase ? limitedCopy.catalogueLink : copy.featured.catalogue} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {!limitedShowcase && featuredProducts.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => {
                  const imageUrl = product.images?.[0]?.imageUrl;
                  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
                  return (
                    <Link key={product.id} href={`/produit/${product.slug}`}>
                      <Card className={`group h-full overflow-hidden border shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${usesGlamourNoir ? "border-white/10 bg-[#22212a]" : "border-[#e5d8cb] bg-white"}`}>
                        <CardContent className="p-0">
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f0ea]">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} width={720} height={720} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl text-slate-300" aria-label={t(locale, "imageUnavailable")}>✦</div>
                            )}
                            {hasDiscount && <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: palette.accent }}>{copy.featured.new}</span>}
                          </div>
                          <div className="space-y-3 p-5">
                            <div className={`flex items-center gap-1 text-xs ${usesGlamourNoir ? "text-white/55" : "text-slate-500"}`}>
                              <Star className="h-3.5 w-3.5" style={{ fill: palette.accent, color: palette.accent }} />
                              <span>{(product as any).averageRating || copy.featured.new}</span>
                            </div>
                            <h3 className={`line-clamp-2 min-h-[3.5rem] text-base font-semibold leading-6 transition-colors group-hover:text-[var(--mazigho-accent)] ${usesGlamourNoir ? "text-white" : "text-slate-900"}`}>{product.name}</h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold" style={{ color: visualAccent }}>{formatPrice(product.price, locale)}</span>
                              {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice!, locale)}</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={`border border-dashed px-6 py-12 text-center text-sm leading-6 ${usesGlamourNoir ? "border-white/20 bg-white/5 text-white/65" : "border-[#d9cbbc] bg-white/70 text-slate-600"}`}>{limitedShowcase ? limitedCopy.productsText : interpolatePublicCopy(copy.featured.unavailable, { country: countryLabel })}</div>
            )}
          </div>
        </section>
        )}

        {(profile.textBanners || []).filter(banner => banner.enabled).map(banner => {
          const blockTheme = banner.theme || "primary";
          const blockLayout = banner.layout || "banner";
          const isDark = blockTheme === "dark";
          const isLight = blockTheme === "light";
          const isSoft = blockTheme === "soft";
          const blockStyle = isDark ? { backgroundColor: "#0f172a" } : isLight ? { backgroundColor: "#ffffff" } : isSoft ? { backgroundColor: palette.soft } : { backgroundColor: palette.primary };
          const textClass = isDark || blockTheme === "primary" ? "text-white" : "text-slate-950";
          const mutedClass = isDark || blockTheme === "primary" ? "text-white/80" : "text-slate-600";
          const hasImage = Boolean(banner.imageUrl);
          const content = <div className={`relative ${hasImage && blockLayout === "banner" ? "z-10 max-w-2xl" : ""} ${textClass}`}>
            {banner.eyebrow ? <p className={`text-xs font-bold uppercase tracking-[0.28em] ${mutedClass}`}>{banner.eyebrow}</p> : null}
            <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-4xl">{banner.title}</h2>
            {banner.text ? <p className={`mt-3 max-w-xl text-sm leading-6 md:text-base ${mutedClass}`}>{banner.text}</p> : null}
            {banner.buttonLabel && banner.buttonUrl ? <Button asChild className={`mt-6 ${isDark || blockTheme === "primary" ? "bg-white text-slate-900 hover:bg-white/90" : "text-white hover:brightness-95"}`} style={isDark || blockTheme === "primary" ? undefined : { backgroundColor: palette.primary }}><Link href={banner.buttonUrl}>{banner.buttonLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : null}
          </div>;
          if (blockLayout === "roundGallery") {
            const galleryItems = (banner.galleryItems || []).slice(0, 6);
            return <section key={`text-${banner.id}`} style={{ order: orderIndex(`text:${banner.id}`), backgroundColor: palette.soft }} className="py-14 md:py-20">
              <div className="container">
                <div className="mx-auto max-w-5xl text-center">
                  {banner.eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: palette.primary }}>{banner.eyebrow}</p> : null}
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{banner.title}</h2>
                  {banner.text ? <p className="mx-auto mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">{banner.text}</p> : null}
                  {banner.buttonLabel && banner.buttonUrl ? <Link href={banner.buttonUrl} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: palette.primary }}>{banner.buttonLabel}<ChevronRight className="h-4 w-4" /></Link> : null}
                </div>
                <div className="mx-auto mt-9 grid max-w-6xl grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
                  {galleryItems.map(item => {
                    const itemContent = <><img src={item.imageUrl} alt={item.imageAlt} width={400} height={400} loading="lazy" decoding="async" className="aspect-square w-full rounded-full object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" /><p className="mt-3 text-center text-sm font-semibold leading-5" style={{ color: palette.primary }}>{item.label}</p></>;
                    return item.href ? <Link key={item.id} href={item.href} className="group mx-auto block w-full max-w-[156px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mazigho-accent)] focus-visible:ring-offset-4">{itemContent}</Link> : <div key={item.id} className="mx-auto w-full max-w-[156px]">{itemContent}</div>;
                  })}
                </div>
              </div>
            </section>;
          }
          return <section key={`text-${banner.id}`} style={{ order: orderIndex(`text:${banner.id}`) }} className="container py-4 md:py-8">
            {blockLayout === "split" ? <div className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 md:grid-cols-2" style={blockStyle}><div className="flex items-center px-7 py-9 md:px-12 md:py-12">{content}</div><div className="relative min-h-[230px] bg-slate-100 md:min-h-full">{hasImage ? <img src={banner.imageUrl} alt={banner.imageAlt || ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" /> : <div className="absolute inset-0 bg-gradient-to-br from-[var(--mazigho-soft)] via-white to-slate-100" />}</div></div> : blockLayout === "framedSplit" ? <div className="rounded-[1.5rem] p-3 md:p-4" style={blockStyle}><div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8"><div className="flex items-center px-4 py-6 md:px-8 md:py-10">{content}</div><div className="relative min-h-[230px] overflow-hidden rounded-[1rem] border border-white/20 bg-slate-100 shadow-sm md:min-h-full">{hasImage ? <img src={banner.imageUrl} alt={banner.imageAlt || ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" /> : <div className="absolute inset-0 bg-gradient-to-br from-[var(--mazigho-soft)] via-white to-slate-100" />}</div></div></div> : blockLayout === "spotlight" ? <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 px-7 py-8 md:px-12 md:py-12" style={blockStyle}>{hasImage ? <img src={banner.imageUrl} alt={banner.imageAlt || ""} className="absolute inset-0 h-full w-full object-cover opacity-15" loading="lazy" decoding="async" /> : null}<div aria-hidden="true" className="absolute -right-10 -top-12 h-52 w-52 rounded-full border-[26px] border-white/20" />{content}</div> : <div className="relative overflow-hidden rounded-[1.5rem] px-7 py-8 md:px-12 md:py-12" style={blockStyle}>{hasImage ? <><img src={banner.imageUrl} alt={banner.imageAlt || ""} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" /><div className="absolute inset-0 bg-slate-950/55" /></> : null}{content}</div>}
          </section>;
        })}
        </div>

        {profile.showClosing && (
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white md:grid-cols-[1.15fr_0.85fr] md:px-12 md:py-14">
              <div className="flex flex-col justify-center">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "#F2C36B" }}>{copy.closing.eyebrow}</p>
                <h2 className="max-w-xl text-3xl font-semibold leading-tight md:text-5xl">{copy.closing.title}</h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 md:text-base">{copy.closing.text}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {copy.closing.shopCta && profile.closingShopCtaUrl ? <Button asChild className="text-white hover:brightness-95"><a href={useManagedPublicTranslation ? profile.closingShopCtaUrl : "/boutique"} style={{ backgroundColor: palette.accent }}>{copy.closing.shopCta} <ArrowRight className="ml-2 h-4 w-4" /></a></Button> : null}
                  {copy.closing.contactCta && profile.closingContactCtaUrl ? <Button asChild variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-white/10 hover:text-white"><a href={useManagedPublicTranslation ? profile.closingContactCtaUrl : "/contact"}>{copy.closing.contactCta}</a></Button> : null}
                </div>
              </div>
              <div className="relative min-h-[250px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-orange-500/80 via-amber-300/30 to-sky-500/50">
                {useManagedPublicTranslation && profile.closingImageUrl ? <><img src={profile.closingImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-slate-950/35" /></> : null}
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-white/15" />
                <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full border-[36px] border-orange-200/20" />
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div>
                    {closingVisualValue ? <p className="text-6xl font-semibold tracking-tight" style={{ color: profile.closingVisualColor, fontFamily: closingVisualFontFamilies[profile.closingVisualFont] }}>{closingVisualValue}</p> : null}
                    {copy.closing.chfText ? <p className={closingVisualValue ? "mt-3 text-sm text-white/75" : "text-sm text-white/75"}>{copy.closing.chfText}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>

      <SpinToWinPopup />
      <ProductCompareDrawer />
      <Footer />
    </div>
  );
}
