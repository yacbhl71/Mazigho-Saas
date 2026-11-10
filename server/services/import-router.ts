import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as schema from "../../drizzle/schema";
import { getDb } from "../db";

const { users, stores, storeMemberships, storeSettings, storeCmsPages, categories, products, productImages, ownerProductVariants } = schema;

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
  settings: z.object({ currency: safeText(3).optional(), clonedFrom: z.string().url().optional(), clonedPlatform: safeText(30).optional(), clonedAt: safeText(80).optional(), robotsStatus: safeText(24).optional(), robotsForceConfirmed: z.boolean().optional() }).strict(),
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
    const designProfile = { imported: true, source: "clone", theme: payload.theme, navigationItems: payload.navigation.map((item, index) => ({ id: `clone-${index + 1}`, ...item, visible: true, kind: "custom" })) };
    const metadata = { source: "clone", sourceUrl: payload.source_url, platform: payload.platform, clonedAt: payload.settings.clonedAt || new Date().toISOString(), productsCount: payload.catalog.length, pagesCount: cmsEntries.length, sections: { theme: "success", pages: "success", catalog: "pending", navigation: "success" } };
    // Page HTML is persisted individually in storeCmsPages. Keep the legacy
    // setting compact so a 125-page import cannot overflow MySQL TEXT.
    const pagesSetting = { home: pages.home, cms: cmsEntries.map(([handle, page]) => ({ handle, title: page.title, category: page.category, reviewRequired: page.reviewRequired })) };
    await tx.insert(storeSettings).values([
      { storeId, key: "design_profile", value: JSON.stringify(designProfile), description: "Design et navigation importés en brouillon depuis un site public." },
      { storeId, key: "clone_import_pages", value: JSON.stringify(pagesSetting), description: "Index des pages importées ; le contenu complet est conservé dans storeCmsPages." },
      { storeId, key: "clone_import_metadata", value: JSON.stringify(metadata), description: "Métadonnées techniques de l’import clone." },
    ]);

    const categoriesByName = new Map<string, number>();
    let categoryOrder = 0;
    for (const product of payload.catalog) {
      const categoryName = (product.category || product.type || "Produits importés").trim().slice(0, 100) || "Produits importés";
      let categoryId = categoriesByName.get(categoryName);
      if (!categoryId) {
        const categoryInsert = await tx.insert(categories).values({ storeId, name: categoryName, slug: uniqueSlug(slugify(categoryName), `${categoryOrder}`), description: "Catégorie importée en brouillon.", displayOrder: categoryOrder++, catalogSection: "standard" });
        categoryId = Number(categoryInsert[0]?.insertId ?? categoryInsert.insertId); categoriesByName.set(categoryName, categoryId);
      }
      const productInsert = await tx.insert(products).values({ storeId, categoryId, name: product.title || product.name || "Produit importé", slug: uniqueSlug(slugify(product.title || product.name || "produit"), `${productsImported}`), description: product.description || product.body_html || null, longDescription: product.longDescription || product.description || product.body_html || null, price: cents(product.price), originalPrice: product.compareAtPrice == null ? null : cents(product.compareAtPrice), stock: 0, featured: 0, showNewBadge: 0, status: "draft", options: product.variants?.length ? JSON.stringify(product.variants.flatMap(variant => Object.entries(variant.options || {}))) : null });
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
  return { ...result, productsImported, variantsImported, imagesImported, pagesImported: pagesEssential + pagesToReview + pagesArchived, pagesEssential, pagesToReview, pagesArchived, blocksImported, warnings: warnings.slice(0, 50) };
}

export function registerCloneImportRoute(app: Express) {
  app.post("/api/import/clone", async (req: Request, res: Response, next: NextFunction) => {
    if (!isCloneApiKeyValid(req.header("x-cloner-api-key"))) return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "INVALID_IMPORT", details: parsed.error.issues.map(issue => issue.message) });
    try {
      const result = await importCloneDraft(parsed.data);
      const base = process.env.PUBLIC_APP_URL || "https://studio.mazigho.ch";
      return res.status(201).json({ success: true, store_id: String(result.storeId), store_url: `${base}/admin/stores/${result.storeId}`, editor_url: `${base}/admin/editor/${result.storeId}`, preview_url: `${base}/preview/${result.storeId}`, import_summary: { products_imported: result.productsImported, variants_imported: result.variantsImported, images_imported: result.imagesImported, pages_imported: result.pagesImported, pages_essential: result.pagesEssential, pages_to_review: result.pagesToReview, pages_archived: result.pagesArchived, blocks_imported: result.blocksImported, warnings: result.warnings } });
    } catch (error) {
      if (error instanceof Error && error.message === "USER_NOT_FOUND") return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") return res.status(503).json({ success: false, error: "DATABASE_UNAVAILABLE" });
      return next(error);
    }
  });
}
