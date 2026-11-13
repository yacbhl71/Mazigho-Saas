import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as schema from "../../drizzle/schema";
import { getDb, setStoreSettingValue } from "../db";

const { users, stores, storeMemberships, storeSettings, storeProvisioningDrafts, storeCmsPages, categories, products, productImages, ownerProductVariants } = schema;

const forbiddenKeys = /^(payment|checkout|customer|client|order|commande|token|secret|stripe|webhook|password|credential|billing|paiement)(?:_|[A-Z]|$)/i;
const executableContent = /<\s*(script|iframe|object|embed|form)\b|javascript\s*:|(?:^|[\s<])on[a-z]+\s*=|data\s*:\s*text\/html/i;
const safeText = (max: number) => z.string().max(max).refine(value => !executableContent.test(value), "Contenu exécutable interdit");
const safeUrl = z.string().max(1000).refine(value => /^https:\/\//i.test(value) || value.startsWith("/"), "URL non autorisée");
const looseProps = z.record(z.string(), z.unknown()).superRefine((value, ctx) => rejectForbiddenKeys(value, ctx));

function rejectForbiddenKeys(value: unknown, ctx: z.RefinementCtx, path: string[] = []) {
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (forbiddenKeys.test(key)) ctx.addIssue({ code: "custom", message: `Champ interdit: ${[...path, key].join(".")}` });
      if (typeof child === "string" && executableContent.test(child)) ctx.addIssue({ code: "custom", message: "Contenu exécutable interdit" });
      if (child && typeof child === "object") rejectForbiddenKeys(child, ctx, [...path, key]);
    }
  }
}

const variantSchema = z.object({
  title: safeText(160).optional(),
  label: safeText(160).optional(),
  price: z.number().finite().nonnegative().optional(),
  sku: safeText(100).optional(),
  options: z.record(z.string(), safeText(100)).optional(),
  imageUrl: safeUrl.optional(),
}).strict();

const productSchema = z.object({
  id: safeText(100).optional(), title: safeText(200), name: safeText(200).optional(),
  description: safeText(10000).optional(), body_html: safeText(10000).optional(), longDescription: safeText(10000).optional(),
  price: z.number().finite().nonnegative().optional(), compareAtPrice: z.number().finite().nonnegative().optional(),
  currency: safeText(3).optional(), images: z.array(z.union([safeUrl, z.object({ src: safeUrl.optional(), url: safeUrl.optional() }).strict()])).max(50).optional(),
  variants: z.array(variantSchema).max(100).optional(), tags: z.array(safeText(80)).max(50).optional(), type: safeText(100).optional(), vendor: safeText(160).optional(), category: safeText(100).optional(),
}).strict();

const blockSchema = z.object({ id: safeText(100).optional(), type: safeText(80), component: safeText(100).optional(), props: looseProps.optional(), reviewRequired: z.boolean().optional() }).strict();
const pageSchema = z.object({
  title: safeText(255).optional(),
  handle: safeText(180).optional(),
  category: z.enum(["essentielle", "à vérifier", "archivée"]).optional(),
  source_url: safeUrl.optional(),
  original_updated_at: safeText(80).optional(),
  reviewRequired: z.boolean().optional(),
  blocks: z.array(blockSchema).max(100),
}).strict();
const importSchema = z.object({
  user_id: safeText(160), project_name: safeText(160), source_url: z.string().url().max(1000), platform: z.enum(["shopify", "woocommerce", "prestashop", "bigcommerce", "generic"]),
  theme: z.object({ colors: z.record(z.string(), safeText(30)).optional(), fonts: z.record(z.string(), safeText(120)).optional(), borderRadius: safeText(30).optional() }).strict(),
  pages: z.record(z.string().max(180), pageSchema).refine(value => Object.keys(value).length <= 2500),
  catalog: z.array(productSchema).max(2500),
  navigation: z.array(z.object({ label: safeText(80), href: safeUrl }).strict()).max(50),
  settings: z.object({ currency: safeText(3).optional(), clonedFrom: z.string().url().optional(), clonedPlatform: safeText(30).optional(), clonedAt: safeText(80).optional(), robotsStatus: safeText(24).optional(), robotsForceConfirmed: z.boolean().optional(), recommendedTheme: z.object({ themeId: safeText(40), confidence: z.enum(["low", "medium", "high"]), reasons: z.array(safeText(240)).max(5) }).strict().optional() }).strict(),
}).strict().superRefine((value, ctx) => rejectForbiddenKeys(value, ctx));

export type CloneImportPayload = z.infer<typeof importSchema>;
export const cloneImportPayloadSchema = importSchema;
export function isCloneApiKeyValid(received: string | undefined, configured = process.env.CLONER_API_KEY) {
  return Boolean(configured?.trim()) && received === configured;
}

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "boutique-clone";
}
function cents(value: number | undefined) { return Math.round((value ?? 0) * 100); }
function uniqueSlug(base: string, suffix: string) { return `${base.slice(0, 48)}-${suffix.slice(0, 10)}`.replace(/-+/g, "-"); }
function imageUrl(value: string | { src?: string; url?: string }) { return typeof value === "string" ? value : value.src || value.url || null; }

function buildImportedDesignProfile(payload: CloneImportPayload) {
  const home = payload.pages.home;
  const blocks = home?.blocks || [];
  const props = (type: string) => blocks.find(block => block.type === type)?.props || {};
  const text = (value: unknown, fallback = "") => typeof value === "string" ? value.trim().slice(0, 900) : fallback;
  const url = (value: unknown) => typeof value === "string" && (/^https:\/\//i.test(value) || value.startsWith("/")) ? value.slice(0, 1000) : "";
  const hero = props("hero");
  const about = props("about");
  const testimonial = props("testimonials");
  const cta = props("cta");
  const recommendedTheme = payload.settings.recommendedTheme;
  const image = (value: unknown) => url(value);
  const visualBlocks = blocks.filter(block => !["header", "footer", "product-grid"].includes(block.type));
  const normalizedVisualBlocks = visualBlocks.map((block, index) => {
    const blockProps = block.props || {};
    const links = Array.isArray(blockProps.links) ? blockProps.links.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
    const galleryItems = Array.isArray(blockProps.galleryItems)
      ? blockProps.galleryItems.slice(0, 16).map((item, galleryIndex) => {
        const entry = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: text(entry.id, `gallery-${index + 1}-${galleryIndex + 1}`),
          label: text(entry.title || entry.label),
          text: text(entry.text || entry.description),
          imageUrl: image(entry.imageUrl || entry.image || entry.src),
          imageAlt: text(entry.imageAlt || entry.alt, text(entry.title || entry.label, payload.project_name)),
          href: url(entry.href || entry.url),
        };
      }).filter(item => item.imageUrl || item.label || item.text)
      : [];
    return {
      id: `clone-visual-${index + 1}`,
      type: block.type,
      eyebrow: text(blockProps.eyebrow, block.type),
      title: text(blockProps.title, payload.project_name),
      text: text(blockProps.text || blockProps.description),
      imageUrl: image(blockProps.imageUrl),
      mobileImageUrl: image(blockProps.mobileImageUrl || blockProps.mobileImage || blockProps.imageMobile),
      imageAlt: text(blockProps.imageAlt, text(blockProps.title, payload.project_name)),
      buttonLabel: text(blockProps.buttonLabel || links[0]?.label),
      buttonUrl: url(blockProps.buttonUrl || links[0]?.href),
      layout: ["banner", "split", "framedSplit", "spotlight", "roundGallery"].includes(String(blockProps.layout))
        ? blockProps.layout
        : block.type === "hero" || block.type === "testimonials" ? "spotlight" : "split",
      theme: ["primary", "dark", "soft", "light"].includes(String(blockProps.theme))
        ? blockProps.theme
        : block.type === "testimonials" ? "dark" : block.type === "cta" ? "primary" : "light",
      galleryItems,
      enabled: true,
      position: index,
    };
  });
  return {
    imported: true,
    source: "clone",
    theme: payload.theme,
    themeId: recommendedTheme?.themeId,
    themeRecommendation: recommendedTheme,
    brandName: payload.project_name,
    brandMessage: text(hero.title) || text(hero.text),
    customColorsEnabled: true,
    customPrimary: payload.theme.colors?.primary || "#1a1a2e",
    customAccent: payload.theme.colors?.accent || "#e94560",
    customSoft: payload.theme.colors?.background || "#ffffff",
    typographyId: "modern",
    headerLayout: "inline",
    highlightEyebrow: text(hero.eyebrow, "Présentation"),
    highlightTitle: text(hero.title, payload.project_name),
    highlightText: text(hero.text, "Découvrez la boutique importée."),
    highlightImageUrl: image(hero.imageUrl),
    storyTitle: text(about.title, "Notre histoire"),
    storyText: text(about.text),
    storyImageUrl: image(about.imageUrl),
    testimonialsTitle: text(testimonial.title, "Ce que nos clients disent"),
    testimonialsText: text(testimonial.text),
    closingTitle: text(cta.title, "Découvrez la boutique"),
    closingText: text(cta.text),
    closingImageUrl: image(cta.imageUrl),
    textBanners: normalizedVisualBlocks.slice(0, 24),
    visualBlocks: normalizedVisualBlocks.slice(0, 48),
    homeOrder: normalizedVisualBlocks.map(block => `text:${block.id}`),
    navigationItems: payload.navigation.map((item, index) => ({ id: `clone-${index + 1}`, ...item, visible: true, kind: "custom" })),
  };
}

export async function importCloneDraft(payload: CloneImportPayload) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [target] = await db.select({ id: users.id }).from(users).where(
    typeof payload.user_id === "string" && /^\d+$/.test(payload.user_id)
      ? eq(users.id, Number(payload.user_id))
      : eq(users.openId, payload.user_id),
  ).limit(1);
  if (!target) throw new Error("USER_NOT_FOUND");
  const suffix = randomUUID().replace(/-/g, "");
  const baseSlug = slugify(payload.project_name);
  const slug = uniqueSlug(baseSlug, suffix);
  const domain = `${slug}.mazigho.ch`;
  const warnings: string[] = [];
  let productsImported = 0, variantsImported = 0, imagesImported = 0, blocksImported = 0;
  let pagesEssential = 0, pagesToReview = 0, pagesArchived = 0;

  const result = await db.transaction(async (tx: any) => {
    const storeInsert = await tx.insert(stores).values({ slug, displayName: payload.project_name, primaryDomain: domain, status: "setup", isPlatformStore: 0 });
    const storeId = Number(storeInsert[0]?.insertId ?? storeInsert.insertId);
    if (!Number.isInteger(storeId) || storeId <= 0) throw new Error("STORE_CREATE_FAILED");
    await tx.insert(storeMemberships).values({ storeId, userId: target.id, role: "owner", status: "active" });

    const pages = Object.fromEntries(Object.entries(payload.pages).map(([name, page]) => {
      blocksImported += page.blocks.length;
      return [name, { ...page, blocks: page.blocks.map(block => ({ ...block, type: ["header", "hero", "product-grid", "testimonials", "cta", "about", "newsletter", "footer", "rich-text", "custom-html"].includes(block.type) ? block.type : "custom-html", reviewRequired: Boolean(block.reviewRequired) || !["header", "hero", "product-grid", "testimonials", "cta", "about", "newsletter", "footer", "rich-text", "custom-html"].includes(block.type) })) }];
    }));
    const cmsEntries = Object.entries(pages).filter(([handle]) => handle !== "home");
    const cmsPageRows = cmsEntries.map(([handle, page]) => {
      const category = page.category || "à vérifier";
      if (category === "essentielle") pagesEssential += 1;
      else if (category === "archivée") pagesArchived += 1;
      else pagesToReview += 1;
      const blocks = page.blocks;
      return {
        storeId,
        handle: (page.handle || handle).slice(0, 180),
        title: (page.title || page.handle || handle).slice(0, 255),
        category,
        sourceUrl: page.source_url || null,
        blocks: JSON.stringify(blocks),
        reviewRequired: page.reviewRequired === false ? 0 : 1,
        status: "draft",
        originalUpdatedAt: page.original_updated_at || null,
      };
    });
    if (cmsPageRows.length) await tx.insert(storeCmsPages).values(cmsPageRows);
    for (const [pageName, page] of Object.entries(payload.pages)) {
      const unknownCount = page.blocks.filter(block => !["header", "hero", "product-grid", "testimonials", "cta", "about", "newsletter", "footer", "rich-text", "custom-html"].includes(block.type)).length;
      if (unknownCount) warnings.push(`Page « ${pageName} » : ${unknownCount} bloc(s) non reconnu(s), converti(s) en bloc personnalisé.`);
    }
    const categoriesByName = new Map<string, number>();
    let categoryOrder = 0;
    for (const product of payload.catalog) {
      const categoryName = (product.category || product.type || "Produits importés").trim().slice(0, 100) || "Produits importés";
      let categoryId = categoriesByName.get(categoryName);
      if (!categoryId) {
        const categoryInsert = await tx.insert(categories).values({ storeId, name: categoryName, slug: uniqueSlug(slugify(categoryName), `${categoryOrder}`), description: "Catégorie importée en brouillon.", displayOrder: categoryOrder++, catalogSection: "standard" });
        categoryId = Number(categoryInsert[0]?.insertId ?? categoryInsert.insertId); categoriesByName.set(categoryName, categoryId);
      }
      const productInsert = await tx.insert(products).values({ storeId, categoryId, name: product.title || product.name || "Produit importé", slug: uniqueSlug(slugify(product.title || product.name || "produit"), `${storeId}-${productsImported}`), description: product.description || product.body_html || null, longDescription: product.longDescription || product.description || product.body_html || null, price: cents(product.price), originalPrice: product.compareAtPrice == null ? null : cents(product.compareAtPrice), stock: 0, featured: 0, showNewBadge: 0, status: "draft", options: product.variants?.length ? JSON.stringify(product.variants.flatMap(variant => Object.entries(variant.options || {}))) : null });
      const productId = Number(productInsert[0]?.insertId ?? productInsert.insertId); productsImported++;
      const images = (product.images || []).map(imageUrl).filter((value): value is string => Boolean(value));
      if (images.length) { await tx.insert(productImages).values(images.map((url, index) => ({ storeId, productId, imageUrl: url, displayOrder: index }))); imagesImported += images.length; } else warnings.push(`Produit « ${product.title || product.name} » sans image.`);
      for (let index = 0; index < (product.variants || []).length; index += 1) {
        const variant = (product.variants || [])[index];
        if (!variant) continue;
        await tx.insert(ownerProductVariants).values({ storeId, productId, label: variant.title || variant.label || `Variante ${index + 1}`, sku: variant.sku || null, imageUrl: variant.imageUrl || null, priceAdjustmentCents: 0, stock: 0, status: "inactive", displayOrder: index });
        variantsImported++;
      }
    }
    return { storeId, slug };
  });
  const cmsEntries = Object.entries(payload.pages).filter(([handle]) => handle !== "home");
  const designProfile = buildImportedDesignProfile(payload);
  const pagesSetting = { home: payload.pages.home, cms: cmsEntries.map(([handle, page]) => ({ handle, title: page.title, category: page.category, reviewRequired: page.reviewRequired })) };
  const metadata = { source: "clone", sourceUrl: payload.source_url, platform: payload.platform, clonedAt: payload.settings.clonedAt || new Date().toISOString(), productsCount: payload.catalog.length, pagesCount: cmsEntries.length, sections: { theme: "success", pages: "success", catalog: "pending", navigation: "success" } };
  // Persist settings through the shared idempotent helper after the catalog
  // transaction. This avoids driver-specific upsert behavior inside tx and
  // keeps retries safe on the unique (storeId, key) constraint.
  await setStoreSettingValue(result.storeId, "design_profile", JSON.stringify(designProfile), "Design et navigation importés en brouillon depuis un site public.");
  await setStoreSettingValue(result.storeId, "clone_import_pages", JSON.stringify(pagesSetting), "Index des pages importées ; le contenu complet est conservé dans storeCmsPages.");
  await setStoreSettingValue(result.storeId, "clone_import_metadata", JSON.stringify(metadata), "Métadonnées techniques de l’import clone.");
  return { ...result, productsImported, variantsImported, imagesImported, pagesImported: pagesEssential + pagesToReview + pagesArchived, pagesEssential, pagesToReview, pagesArchived, blocksImported, warnings: warnings.slice(0, 50) };
}

export async function ensureImportedStoreStudioProvisioning(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || store.status !== "setup") return;
  const settingRows = await db.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, storeId));
  const settings = new Map(settingRows.map(row => [row.key, row.value]));
  if (settings.get("provisioning_mode") === "gift" && Number(settings.get("provisioning_draft_id")) > 0) return;
  const [owner] = await db.select({ userId: storeMemberships.userId, name: users.name, email: users.email })
    .from(storeMemberships).innerJoin(users, eq(users.id, storeMemberships.userId))
    .where(and(eq(storeMemberships.storeId, storeId), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"))).limit(1);
  if (!owner?.userId || !owner.email) throw new Error("STORE_OWNER_MISSING");
  const preferredCurrency = (settings.get("currency") || "CHF").slice(0, 3).toUpperCase();
  const [draft] = await db.insert(storeProvisioningDrafts).values({
    displayName: store.displayName, requestedDomain: store.primaryDomain,
    ownerName: (owner.name || "Opérateur MAZIGHO").slice(0, 160), ownerEmail: owner.email,
    businessType: "autre", factoryModel: "blank", provisioningTemplate: "standard",
    launchMarket: "custom", paymentRoute: "stripe_connect", preferredCurrency,
    status: "ready_for_confirmation", notes: "Brouillon Studio créé automatiquement pour un import de boutique existant.",
    provisionedStoreId: store.id, provisionedAt: new Date(), createdByUserId: owner.userId,
  }).$returningId();
  const draftId = Number(draft?.id);
  if (!draftId) throw new Error("PROVISIONING_DRAFT_CREATE_FAILED");
  await setStoreSettingValue(store.id, "provisioning_mode", "gift", "Boutique importée, sans facturation automatique ni ouverture publique.");
  await setStoreSettingValue(store.id, "provisioning_draft_id", String(draftId), "Brouillon Studio source de la préparation de l’import.");
  await setStoreSettingValue(store.id, "store_currency_code", preferredCurrency, "Devise détectée pour la préparation de l’import.");
  const design = settings.get("design_profile");
  try {
    const profile = design ? JSON.parse(design) as Record<string, unknown> : {};
    if (!String(profile.brandName || "").trim()) profile.brandName = store.displayName;
    await setStoreSettingValue(store.id, "design_profile", JSON.stringify(profile), "Identité importée en préparation privée.");
  } catch {
    await setStoreSettingValue(store.id, "design_profile", JSON.stringify({ imported: true, brandName: store.displayName }), "Identité importée en préparation privée.");
  }
}

export function registerCloneImportRoute(app: Express) {
  app.post("/api/import/clone", async (req: Request, res: Response, next: NextFunction) => {
    if (!isCloneApiKeyValid(req.header("x-cloner-api-key"))) return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "INVALID_IMPORT", details: parsed.error.issues.map(issue => issue.message) });
    try {
      const result = await importCloneDraft(parsed.data);
      const base = process.env.PUBLIC_APP_URL || "https://studio.mazigho.ch";
      return res.status(201).json({ success: true, store_id: String(result.storeId), store_url: `${base}/admin/studio/catalogue-existant/${result.storeId}`, editor_url: `${base}/admin/studio/catalogue-existant/${result.storeId}`, preview_url: `${base}/admin/studio/apercu/${result.storeId}`, import_summary: { products_imported: result.productsImported, variants_imported: result.variantsImported, images_imported: result.imagesImported, pages_imported: result.pagesImported, pages_essential: result.pagesEssential, pages_to_review: result.pagesToReview, pages_archived: result.pagesArchived, blocks_imported: result.blocksImported, warnings: result.warnings } });
    } catch (error) {
      if (error instanceof Error && error.message === "USER_NOT_FOUND") return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") return res.status(503).json({ success: false, error: "DATABASE_UNAVAILABLE" });
      console.error("[clone-import] import failed", error instanceof Error ? error.message : "unknown error");
      return res.status(500).json({ success: false, error: "IMPORT_FAILED", message: error instanceof Error ? error.message.slice(0, 240) : "Import failed" });
    }
  });
}
