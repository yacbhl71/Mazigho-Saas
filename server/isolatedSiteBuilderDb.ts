import { resolveTxt } from "node:dns/promises";
import { and, desc, eq } from "drizzle-orm";
import {
  independentSiteDomains,
  independentSiteMedia,
  independentSiteVersions,
  independentSites,
} from "../drizzle/schema";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  DEFAULT_IMAGE_TRANSFORMS,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_SITE_TEMPLATES,
  assertNoSecretsInIndependentSite,
  assertZeroEcommerceInIndependentSite,
  buildNavigationFromPages,
  normalizeImageTransforms,
  normalizeIndependentPageSlug,
  sanitizeBuilderImageSrc,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  sanitizeBuilderText,
  slugifyIndependentSite,
  validateIndependentCustomDomain,
  type IndependentImageTransforms,
  type IndependentSiteMenuItem,
  type IndependentSitePage,
  type IndependentSiteReusableBlock,
  type IndependentSiteStatus,
  type IndependentSiteThemeConfig,
  type IndependentSiteType,
} from "../shared/isolatedSiteBuilder";
import { getDb } from "./db";

export interface IndependentSiteProjectDto {
  id: number;
  ownerUserId: number;
  slug: string;
  title: string;
  siteType: IndependentSiteType;
  status: IndependentSiteStatus;
  templateId: string | null;
  theme: IndependentSiteThemeConfig;
  navigation: IndependentSiteMenuItem[];
  pages: IndependentSitePage[];
  reusableBlocks: IndependentSiteReusableBlock[];
  publishedSnapshot: {
    title: string;
    slug: string;
    siteType: IndependentSiteType;
    theme: IndependentSiteThemeConfig;
    navigation: IndependentSiteMenuItem[];
    pages: IndependentSitePage[];
    publishedAt: string;
  } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IndependentSiteVersionDto {
  id: number;
  siteId: number;
  ownerUserId: number;
  versionNumber: number;
  label: string;
  snapshot: {
    title: string;
    siteType: IndependentSiteType;
    theme: IndependentSiteThemeConfig;
    navigation: IndependentSiteMenuItem[];
    pages: IndependentSitePage[];
    reusableBlocks: IndependentSiteReusableBlock[];
  };
  createdAt: string;
}

export interface IndependentSiteMediaDto {
  id: number;
  siteId: number;
  ownerUserId: number;
  label: string;
  altText: string;
  url: string;
  mimeType: string;
  transforms: IndependentImageTransforms;
  createdAt: string;
}

export interface IndependentSiteDomainDto {
  id: number;
  siteId: number;
  ownerUserId: number;
  hostname: string;
  verificationStatus: "pending_dns" | "verified" | "active" | "failed";
  verificationToken: string;
  dnsRecordName: string;
  dnsRecordValue: string;
  sslStatus: "pending" | "active";
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// Isolated in-memory fallback store used when DATABASE_URL is not configured
// (e.g. unit tests or local preview without MySQL), strictly partitioned by ownerUserId.
const memorySites = new Map<number, IndependentSiteProjectDto>();
const memoryVersions = new Map<number, IndependentSiteVersionDto[]>();
const memoryMedia = new Map<number, IndependentSiteMediaDto[]>();
const memoryDomains = new Map<number, IndependentSiteDomainDto[]>();
let nextMemorySiteId = 1001;
let nextMemoryVersionId = 5001;
let nextMemoryMediaId = 8001;
let nextMemoryDomainId = 9001;

const DEFAULT_THEME: IndependentSiteThemeConfig = {
  primaryColor: "#172033",
  accentColor: "#9b563e",
  backgroundColor: "#faf8f5",
  headingFont: "Georgia, serif",
  bodyFont: "Inter, system-ui, sans-serif",
};

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToProjectDto(row: typeof independentSites.$inferSelect): IndependentSiteProjectDto {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    slug: row.slug,
    title: row.title,
    siteType: (row.siteType as IndependentSiteType) || "vitrine",
    status: row.status,
    templateId: row.templateId ?? null,
    theme: safeJsonParse<IndependentSiteThemeConfig>(row.themeJson, DEFAULT_THEME),
    navigation: safeJsonParse<IndependentSiteMenuItem[]>(row.navigationJson, []),
    pages: safeJsonParse<IndependentSitePage[]>(row.pagesJson, []),
    reusableBlocks: safeJsonParse<IndependentSiteReusableBlock[]>(row.reusableBlocksJson, []),
    publishedSnapshot: safeJsonParse(row.publishedSnapshotJson, null),
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function ensureUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  const clean = slugifyIndependentSite(baseSlug);
  if (!existingSlugs.has(clean)) return clean;
  let counter = 2;
  while (existingSlugs.has(`${clean}-${counter}`)) {
    counter += 1;
  }
  return `${clean}-${counter}`;
}

export async function listIndependentSiteProjects(
  ownerUserId: number,
  filters?: { status?: IndependentSiteStatus; siteType?: IndependentSiteType }
): Promise<IndependentSiteProjectDto[]> {
  const db = await getDb();
  if (!db) {
    const items = Array.from(memorySites.values())
      .filter((site) => site.ownerUserId === ownerUserId)
      .filter((site) => (filters?.status ? site.status === filters.status : true))
      .filter((site) => (filters?.siteType ? site.siteType === filters.siteType : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return items.map((item) => JSON.parse(JSON.stringify(item)));
  }

  const rows = await db
    .select()
    .from(independentSites)
    .where(eq(independentSites.ownerUserId, ownerUserId))
    .orderBy(desc(independentSites.updatedAt));

  return rows
    .map(rowToProjectDto)
    .filter((site) => (filters?.status ? site.status === filters.status : true))
    .filter((site) => (filters?.siteType ? site.siteType === filters.siteType : true));
}

export async function getIndependentSiteProject(
  ownerUserId: number,
  siteId: number
): Promise<IndependentSiteProjectDto | null> {
  const db = await getDb();
  if (!db) {
    const found = memorySites.get(siteId);
    if (!found || found.ownerUserId !== ownerUserId) return null;
    return JSON.parse(JSON.stringify(found));
  }

  const rows = await db
    .select()
    .from(independentSites)
    .where(and(eq(independentSites.id, siteId), eq(independentSites.ownerUserId, ownerUserId)))
    .limit(1);

  return rows[0] ? rowToProjectDto(rows[0]) : null;
}

export async function getPublicIndependentSiteBySlug(
  slug: string,
  options?: { allowDraftForOwnerUserId?: number }
): Promise<{
  id: number;
  slug: string;
  title: string;
  siteType: IndependentSiteType;
  status: IndependentSiteStatus;
  theme: IndependentSiteThemeConfig;
  navigation: IndependentSiteMenuItem[];
  pages: IndependentSitePage[];
  publishedAt: string | null;
} | null> {
  const normalizedSlug = slugifyIndependentSite(slug);
  const db = await getDb();

  let project: IndependentSiteProjectDto | null = null;
  if (!db) {
    for (const candidate of Array.from(memorySites.values())) {
      if (candidate.slug === normalizedSlug) {
        project = candidate;
        break;
      }
    }
  } else {
    const rows = await db
      .select()
      .from(independentSites)
      .where(eq(independentSites.slug, normalizedSlug))
      .limit(1);
    if (rows[0]) {
      project = rowToProjectDto(rows[0]);
    }
  }

  if (!project) return null;

  const isOwnerPreview =
    typeof options?.allowDraftForOwnerUserId === "number" &&
    project.ownerUserId === options.allowDraftForOwnerUserId;

  if (project.status === "published" && project.publishedSnapshot) {
    return {
      id: project.id,
      slug: project.slug,
      title: project.publishedSnapshot.title,
      siteType: project.publishedSnapshot.siteType,
      status: project.status,
      theme: project.publishedSnapshot.theme,
      navigation: project.publishedSnapshot.navigation,
      pages: project.publishedSnapshot.pages,
      publishedAt: project.publishedAt,
    };
  }

  if (isOwnerPreview) {
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      siteType: project.siteType,
      status: project.status,
      theme: project.theme,
      navigation: project.navigation,
      pages: project.pages,
      publishedAt: project.publishedAt,
    };
  }

  return null;
}

export async function createIndependentSiteProject(
  ownerUserId: number,
  input: {
    title: string;
    siteType?: IndependentSiteType;
    slug?: string;
    templateId?: string | null;
    socleId?: string | null;
  }
): Promise<IndependentSiteProjectDto> {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const safeTitle = sanitizeBuilderText(input.title || "Mon Site Internet", 160) || "Mon Site Internet";
  const template = input.templateId
    ? INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === input.templateId) ?? null
    : null;
  const socle = input.socleId
    ? INDEPENDENT_PAGE_SOCLES.find((s) => s.id === input.socleId) ?? null
    : null;

  const siteType: IndependentSiteType =
    input.siteType || template?.siteType || socle?.siteType || "vitrine";
  const theme: IndependentSiteThemeConfig = template
    ? { ...template.theme }
    : { ...DEFAULT_THEME };

  let pages: IndependentSitePage[];
  if (template) {
    pages = JSON.parse(JSON.stringify(template.pages));
  } else if (socle) {
    pages = [
      {
        id: "page-accueil",
        title: "Accueil",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: `${safeTitle} | Accueil`,
        seoDescription: socle.description,
        html: socle.html,
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
      },
    ];
  } else {
    const defaultSocle = INDEPENDENT_PAGE_SOCLES[0];
    pages = [
      {
        id: "page-accueil",
        title: "Accueil",
        slug: "/",
        parentPageId: null,
        showInMenu: true,
        menuOrder: 1,
        visibility: "public",
        seoTitle: `${safeTitle} | Accueil`,
        seoDescription: `Bienvenue sur le site ${safeTitle}`,
        html: defaultSocle.html,
        css: "body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #172033; }",
      },
    ];
  }

  const navigation: IndependentSiteMenuItem[] = template
    ? JSON.parse(JSON.stringify(template.navigation))
    : buildNavigationFromPages(pages);

  const db = await getDb();
  if (!db) {
    const existingSlugs = new Set(Array.from(memorySites.values()).map((s) => s.slug));
    const uniqueSlug = ensureUniqueSlug(input.slug || safeTitle, existingSlugs);
    const now = new Date().toISOString();
    const id = nextMemorySiteId++;

    const created: IndependentSiteProjectDto = {
      id,
      ownerUserId,
      slug: uniqueSlug,
      title: safeTitle,
      siteType,
      status: "draft",
      templateId: template?.id ?? null,
      theme,
      navigation,
      pages,
      reusableBlocks: [],
      publishedSnapshot: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    memorySites.set(id, created);
    await createIndependentSiteVersion(ownerUserId, id, "Version initiale");
    return JSON.parse(JSON.stringify(created));
  }

  const allExisting = await db.select({ slug: independentSites.slug }).from(independentSites);
  const existingSlugs = new Set(allExisting.map((r) => r.slug));
  const uniqueSlug = ensureUniqueSlug(input.slug || safeTitle, existingSlugs);

  const [insertResult] = await db.insert(independentSites).values({
    ownerUserId,
    slug: uniqueSlug,
    title: safeTitle,
    siteType,
    status: "draft",
    templateId: template?.id ?? null,
    themeJson: JSON.stringify(theme),
    navigationJson: JSON.stringify(navigation),
    pagesJson: JSON.stringify(pages),
    reusableBlocksJson: JSON.stringify([]),
    publishedSnapshotJson: null,
    publishedAt: null,
  });

  const insertedId = Number((insertResult as { insertId?: number }).insertId);
  await createIndependentSiteVersion(ownerUserId, insertedId, "Version initiale");
  const loaded = await getIndependentSiteProject(ownerUserId, insertedId);
  if (!loaded) {
    throw new Error("INDEPENDENT_SITE_CREATION_FAILED");
  }
  return loaded;
}

export async function saveIndependentSiteProject(
  ownerUserId: number,
  input: {
    siteId: number;
    title?: string;
    siteType?: IndependentSiteType;
    theme?: IndependentSiteThemeConfig;
    navigation?: IndependentSiteMenuItem[];
    pages?: IndependentSitePage[];
    reusableBlocks?: IndependentSiteReusableBlock[];
    createVersionLabel?: string;
  }
): Promise<IndependentSiteProjectDto> {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const current = await getIndependentSiteProject(ownerUserId, input.siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const nextTitle = input.title ? sanitizeBuilderText(input.title, 160) : current.title;
  const nextSiteType = input.siteType ?? current.siteType;
  const nextTheme = input.theme ? { ...current.theme, ...input.theme } : current.theme;
  const nextPages: IndependentSitePage[] = input.pages
    ? input.pages.map((p, idx) => ({
        ...p,
        title: sanitizeBuilderText(p.title || `Page ${idx + 1}`, 140),
        slug: normalizeIndependentPageSlug(p.slug),
        menuOrder: typeof p.menuOrder === "number" ? p.menuOrder : idx + 1,
        seoTitle: sanitizeBuilderText(p.seoTitle || p.title || `Page ${idx + 1}`, 180),
        seoDescription: sanitizeBuilderText(p.seoDescription || "", 320),
        socialImageUrl: p.socialImageUrl ? sanitizeBuilderImageSrc(p.socialImageUrl) : undefined,
        indexable: p.indexable !== false,
        html: sanitizeIndependentHtml(p.html),
        css: sanitizeIndependentCss(p.css),
      }))
    : current.pages;

  if (nextPages.length === 0) {
    throw new Error("INDEPENDENT_SITE_EMPTY_PAGES_FORBIDDEN");
  }

  const nextNavigation = input.navigation ?? buildNavigationFromPages(nextPages);
  const nextReusableBlocks = (input.reusableBlocks ?? current.reusableBlocks).map((block) => ({
    ...block,
    name: sanitizeBuilderText(block.name, 140),
    category: sanitizeBuilderText(block.category, 80),
    html: sanitizeIndependentHtml(block.html),
  }));
  const now = new Date().toISOString();

  const db = await getDb();
  if (!db) {
    const updated: IndependentSiteProjectDto = {
      ...current,
      title: nextTitle,
      siteType: nextSiteType,
      theme: nextTheme,
      pages: nextPages,
      navigation: nextNavigation,
      reusableBlocks: nextReusableBlocks,
      updatedAt: now,
    };
    memorySites.set(current.id, updated);
    if (input.createVersionLabel) {
      await createIndependentSiteVersion(ownerUserId, current.id, input.createVersionLabel);
    }
    return JSON.parse(JSON.stringify(updated));
  }

  await db
    .update(independentSites)
    .set({
      title: nextTitle,
      siteType: nextSiteType,
      themeJson: JSON.stringify(nextTheme),
      pagesJson: JSON.stringify(nextPages),
      navigationJson: JSON.stringify(nextNavigation),
      reusableBlocksJson: JSON.stringify(nextReusableBlocks),
    })
    .where(and(eq(independentSites.id, current.id), eq(independentSites.ownerUserId, ownerUserId)));

  if (input.createVersionLabel) {
    await createIndependentSiteVersion(ownerUserId, current.id, input.createVersionLabel);
  }

  const reloaded = await getIndependentSiteProject(ownerUserId, current.id);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function duplicateIndependentSiteProject(
  ownerUserId: number,
  siteId: number,
  newTitle?: string
): Promise<IndependentSiteProjectDto> {
  const source = await getIndependentSiteProject(ownerUserId, siteId);
  if (!source) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const copyTitle = sanitizeBuilderText(newTitle || `${source.title} (copie)`, 160);
  const created = await createIndependentSiteProject(ownerUserId, {
    title: copyTitle,
    siteType: source.siteType,
    templateId: source.templateId,
  });

  return await saveIndependentSiteProject(ownerUserId, {
    siteId: created.id,
    title: copyTitle,
    siteType: source.siteType,
    theme: source.theme,
    navigation: source.navigation,
    pages: source.pages,
    reusableBlocks: source.reusableBlocks,
    createVersionLabel: `Dupliqué depuis ${source.title}`,
  });
}

export async function updateIndependentSiteStatus(
  ownerUserId: number,
  siteId: number,
  status: IndependentSiteStatus
): Promise<IndependentSiteProjectDto> {
  const current = await getIndependentSiteProject(ownerUserId, siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  if (status === "published") {
    return await publishIndependentSiteProject(ownerUserId, siteId);
  }

  const db = await getDb();
  if (!db) {
    const updated: IndependentSiteProjectDto = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    };
    memorySites.set(siteId, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  await db
    .update(independentSites)
    .set({ status })
    .where(and(eq(independentSites.id, siteId), eq(independentSites.ownerUserId, ownerUserId)));

  const reloaded = await getIndependentSiteProject(ownerUserId, siteId);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function publishIndependentSiteProject(
  ownerUserId: number,
  siteId: number
): Promise<IndependentSiteProjectDto> {
  const current = await getIndependentSiteProject(ownerUserId, siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  assertNoSecretsInIndependentSite(current);
  assertZeroEcommerceInIndependentSite(current);

  if (!current.pages.length || !current.pages.some((p) => p.html && p.html.trim().length > 0)) {
    throw new Error("INDEPENDENT_SITE_PUBLISH_EMPTY_CONTENT");
  }

  const nowIso = new Date().toISOString();
  const snapshot = {
    title: current.title,
    slug: current.slug,
    siteType: current.siteType,
    theme: current.theme,
    navigation: current.navigation,
    pages: current.pages.map((page) => ({
      ...page,
      html: sanitizeIndependentHtml(page.html),
      css: sanitizeIndependentCss(page.css),
    })),
    publishedAt: nowIso,
  };

  const db = await getDb();
  if (!db) {
    const updated: IndependentSiteProjectDto = {
      ...current,
      status: "published",
      publishedSnapshot: snapshot,
      publishedAt: nowIso,
      updatedAt: nowIso,
    };
    memorySites.set(siteId, updated);
    await createIndependentSiteVersion(ownerUserId, siteId, `Publication du site (${nowIso.slice(0, 10)})`);
    return JSON.parse(JSON.stringify(updated));
  }

  await db
    .update(independentSites)
    .set({
      status: "published",
      publishedSnapshotJson: JSON.stringify(snapshot),
      publishedAt: new Date(nowIso),
    })
    .where(and(eq(independentSites.id, siteId), eq(independentSites.ownerUserId, ownerUserId)));

  await createIndependentSiteVersion(ownerUserId, siteId, `Publication du site (${nowIso.slice(0, 10)})`);
  const reloaded = await getIndependentSiteProject(ownerUserId, siteId);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

// ---------------------------------------------------------------------------
// Versions & Historique
// ---------------------------------------------------------------------------

export async function listIndependentSiteVersions(
  ownerUserId: number,
  siteId: number
): Promise<IndependentSiteVersionDto[]> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const db = await getDb();
  if (!db) {
    const list = memoryVersions.get(siteId) ?? [];
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  const rows = await db
    .select()
    .from(independentSiteVersions)
    .where(
      and(
        eq(independentSiteVersions.siteId, siteId),
        eq(independentSiteVersions.ownerUserId, ownerUserId)
      )
    )
    .orderBy(desc(independentSiteVersions.versionNumber));

  return rows.map((row) => ({
    id: row.id,
    siteId: row.siteId,
    ownerUserId: row.ownerUserId,
    versionNumber: row.versionNumber,
    label: row.label,
    snapshot: safeJsonParse(row.snapshotJson, {
      title: project.title,
      siteType: project.siteType,
      theme: project.theme,
      navigation: project.navigation,
      pages: project.pages,
      reusableBlocks: project.reusableBlocks,
    }),
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export async function createIndependentSiteVersion(
  ownerUserId: number,
  siteId: number,
  label?: string
): Promise<IndependentSiteVersionDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const existing = await listIndependentSiteVersions(ownerUserId, siteId);
  const nextVersionNumber = existing.length > 0 ? existing[0].versionNumber + 1 : 1;
  const safeLabel = sanitizeBuilderText(label || `Point de sauvegarde v${nextVersionNumber}`, 150);

  const snapshot = {
    title: project.title,
    siteType: project.siteType,
    theme: project.theme,
    navigation: project.navigation,
    pages: project.pages,
    reusableBlocks: project.reusableBlocks,
  };

  const db = await getDb();
  if (!db) {
    const created: IndependentSiteVersionDto = {
      id: nextMemoryVersionId++,
      siteId,
      ownerUserId,
      versionNumber: nextVersionNumber,
      label: safeLabel,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      createdAt: new Date().toISOString(),
    };
    const currentList = memoryVersions.get(siteId) ?? [];
    memoryVersions.set(siteId, [...currentList, created]);
    return JSON.parse(JSON.stringify(created));
  }

  const [res] = await db.insert(independentSiteVersions).values({
    siteId,
    ownerUserId,
    versionNumber: nextVersionNumber,
    label: safeLabel,
    snapshotJson: JSON.stringify(snapshot),
  });

  return {
    id: Number((res as { insertId?: number }).insertId),
    siteId,
    ownerUserId,
    versionNumber: nextVersionNumber,
    label: safeLabel,
    snapshot,
    createdAt: new Date().toISOString(),
  };
}

export async function restoreIndependentSiteVersion(
  ownerUserId: number,
  siteId: number,
  versionId: number
): Promise<IndependentSiteProjectDto> {
  const versions = await listIndependentSiteVersions(ownerUserId, siteId);
  const target = versions.find((v) => v.id === versionId);
  if (!target) {
    throw new Error("INDEPENDENT_SITE_VERSION_NOT_FOUND");
  }

  return await saveIndependentSiteProject(ownerUserId, {
    siteId,
    title: target.snapshot.title,
    siteType: target.snapshot.siteType,
    theme: target.snapshot.theme,
    navigation: target.snapshot.navigation,
    pages: target.snapshot.pages,
    reusableBlocks: target.snapshot.reusableBlocks,
    createVersionLabel: `Restauration de v${target.versionNumber} (${target.label})`,
  });
}

// ---------------------------------------------------------------------------
// Bibliothèque Personnelle de Médias par Projet
// ---------------------------------------------------------------------------

export async function listIndependentSiteMedia(
  ownerUserId: number,
  siteId: number
): Promise<IndependentSiteMediaDto[]> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const db = await getDb();
  if (!db) {
    return [...(memoryMedia.get(siteId) ?? [])];
  }

  const rows = await db
    .select()
    .from(independentSiteMedia)
    .where(
      and(eq(independentSiteMedia.siteId, siteId), eq(independentSiteMedia.ownerUserId, ownerUserId))
    )
    .orderBy(desc(independentSiteMedia.createdAt));

  return rows.map((row) => ({
    id: row.id,
    siteId: row.siteId,
    ownerUserId: row.ownerUserId,
    label: row.label,
    altText: row.altText,
    url: row.url,
    mimeType: row.mimeType,
    transforms: normalizeImageTransforms(safeJsonParse(row.transformsJson, DEFAULT_IMAGE_TRANSFORMS)),
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export async function addIndependentSiteMedia(
  ownerUserId: number,
  input: {
    siteId: number;
    label: string;
    altText: string;
    url: string;
    mimeType?: string;
    transforms?: Partial<IndependentImageTransforms>;
  }
): Promise<IndependentSiteMediaDto> {
  assertNoSecretsInIndependentSite(input);
  const project = await getIndependentSiteProject(ownerUserId, input.siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const safeLabel = sanitizeBuilderText(input.label || "Image du projet", 150);
  const safeAlt = sanitizeBuilderText(input.altText || safeLabel, 220);
  const transforms = normalizeImageTransforms(input.transforms);
  const mimeType = sanitizeBuilderText(input.mimeType || "image/webp", 60);

  const db = await getDb();
  if (!db) {
    const item: IndependentSiteMediaDto = {
      id: nextMemoryMediaId++,
      siteId: input.siteId,
      ownerUserId,
      label: safeLabel,
      altText: safeAlt,
      url: input.url,
      mimeType,
      transforms,
      createdAt: new Date().toISOString(),
    };
    const list = memoryMedia.get(input.siteId) ?? [];
    memoryMedia.set(input.siteId, [item, ...list]);
    return item;
  }

  const [res] = await db.insert(independentSiteMedia).values({
    siteId: input.siteId,
    ownerUserId,
    label: safeLabel,
    altText: safeAlt,
    url: input.url,
    mimeType,
    transformsJson: JSON.stringify(transforms),
  });

  return {
    id: Number((res as { insertId?: number }).insertId),
    siteId: input.siteId,
    ownerUserId,
    label: safeLabel,
    altText: safeAlt,
    url: input.url,
    mimeType,
    transforms,
    createdAt: new Date().toISOString(),
  };
}

export async function updateIndependentSiteMediaTransforms(
  ownerUserId: number,
  siteId: number,
  mediaId: number,
  transforms: Partial<IndependentImageTransforms>
): Promise<IndependentSiteMediaDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  const normalized = normalizeImageTransforms(transforms);

  const db = await getDb();
  if (!db) {
    const list = memoryMedia.get(siteId) ?? [];
    const index = list.findIndex((m) => m.id === mediaId && m.ownerUserId === ownerUserId);
    if (index === -1) throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
    const updated: IndependentSiteMediaDto = {
      ...list[index],
      transforms: normalized,
    };
    const nextList = [...list];
    nextList[index] = updated;
    memoryMedia.set(siteId, nextList);
    return updated;
  }

  await db
    .update(independentSiteMedia)
    .set({ transformsJson: JSON.stringify(normalized) })
    .where(
      and(
        eq(independentSiteMedia.id, mediaId),
        eq(independentSiteMedia.siteId, siteId),
        eq(independentSiteMedia.ownerUserId, ownerUserId)
      )
    );

  const all = await listIndependentSiteMedia(ownerUserId, siteId);
  const found = all.find((m) => m.id === mediaId);
  if (!found) throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
  return found;
}

export async function deleteIndependentSiteMedia(
  ownerUserId: number,
  siteId: number,
  mediaId: number
): Promise<{ deleted: true }> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const db = await getDb();
  if (!db) {
    const list = memoryMedia.get(siteId) ?? [];
    memoryMedia.set(
      siteId,
      list.filter((m) => !(m.id === mediaId && m.ownerUserId === ownerUserId))
    );
    return { deleted: true };
  }

  await db
    .delete(independentSiteMedia)
    .where(
      and(
        eq(independentSiteMedia.id, mediaId),
        eq(independentSiteMedia.siteId, siteId),
        eq(independentSiteMedia.ownerUserId, ownerUserId)
      )
    );
  return { deleted: true };
}

// ---------------------------------------------------------------------------
// Domaines Personnalisés Indépendants
// ---------------------------------------------------------------------------

function formatDomainDto(row: {
  id: number;
  siteId: number;
  ownerUserId: number;
  hostname: string;
  verificationStatus: "pending_dns" | "verified" | "active" | "failed";
  verificationToken: string;
  sslStatus: "pending" | "active";
  isPrimary: number | boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}): IndependentSiteDomainDto {
  return {
    id: row.id,
    siteId: row.siteId,
    ownerUserId: row.ownerUserId,
    hostname: row.hostname,
    verificationStatus: row.verificationStatus,
    verificationToken: row.verificationToken,
    dnsRecordName: `_mazigho-site-verify.${row.hostname}`,
    dnsRecordValue: row.verificationToken,
    sslStatus: row.sslStatus,
    isPrimary: Boolean(row.isPrimary),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function listIndependentSiteDomains(
  ownerUserId: number,
  siteId: number
): Promise<IndependentSiteDomainDto[]> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const db = await getDb();
  if (!db) {
    return [...(memoryDomains.get(siteId) ?? [])];
  }

  const rows = await db
    .select()
    .from(independentSiteDomains)
    .where(
      and(
        eq(independentSiteDomains.siteId, siteId),
        eq(independentSiteDomains.ownerUserId, ownerUserId)
      )
    );
  return rows.map(formatDomainDto);
}

export async function addIndependentSiteDomain(
  ownerUserId: number,
  siteId: number,
  rawHostname: string
): Promise<IndependentSiteDomainDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const check = validateIndependentCustomDomain(rawHostname);
  if (!check.valid) {
    throw new Error(check.error || "INDEPENDENT_SITE_INVALID_DOMAIN");
  }

  const token = `msite-verify-${siteId}-${Math.random().toString(36).slice(2, 12)}`;
  const existing = await listIndependentSiteDomains(ownerUserId, siteId);
  const isPrimary = existing.length === 0 ? 1 : 0;

  const db = await getDb();
  if (!db) {
    for (const domainList of Array.from(memoryDomains.values())) {
      if (domainList.some((d) => d.hostname === check.normalizedHostname)) {
        throw new Error("Ce nom de domaine est déjà rattaché à un site.");
      }
    }
    const now = new Date().toISOString();
    const dto = formatDomainDto({
      id: nextMemoryDomainId++,
      siteId,
      ownerUserId,
      hostname: check.normalizedHostname,
      verificationStatus: "pending_dns",
      verificationToken: token,
      sslStatus: "pending",
      isPrimary,
      createdAt: now,
      updatedAt: now,
    });
    memoryDomains.set(siteId, [...existing, dto]);
    return dto;
  }

  const [res] = await db.insert(independentSiteDomains).values({
    siteId,
    ownerUserId,
    hostname: check.normalizedHostname,
    verificationStatus: "pending_dns",
    verificationToken: token,
    sslStatus: "pending",
    isPrimary,
  });

  const now = new Date();
  return formatDomainDto({
    id: Number((res as { insertId?: number }).insertId),
    siteId,
    ownerUserId,
    hostname: check.normalizedHostname,
    verificationStatus: "pending_dns",
    verificationToken: token,
    sslStatus: "pending",
    isPrimary,
    createdAt: now,
    updatedAt: now,
  });
}

export async function verifyIndependentSiteDomain(
  ownerUserId: number,
  siteId: number,
  domainId: number
): Promise<IndependentSiteDomainDto> {
  const domains = await listIndependentSiteDomains(ownerUserId, siteId);
  const target = domains.find((d) => d.id === domainId);
  if (!target) {
    throw new Error("INDEPENDENT_SITE_DOMAIN_NOT_FOUND");
  }

  let txtRecords: string[][];
  try {
    txtRecords = await resolveTxt(target.dnsRecordName);
  } catch {
    throw new Error("INDEPENDENT_SITE_DOMAIN_DNS_NOT_VERIFIED");
  }
  if (!txtRecords.some((record) => record.join("") === target.verificationToken)) {
    throw new Error("INDEPENDENT_SITE_DOMAIN_DNS_NOT_VERIFIED");
  }

  const db = await getDb();
  if (!db) {
    const updated: IndependentSiteDomainDto = {
      ...target,
      verificationStatus: "verified",
      sslStatus: "pending",
      updatedAt: new Date().toISOString(),
    };
    memoryDomains.set(
      siteId,
      domains.map((d) => (d.id === domainId ? updated : d))
    );
    return updated;
  }

  await db
    .update(independentSiteDomains)
    .set({
      verificationStatus: "verified",
      sslStatus: "pending",
    })
    .where(
      and(
        eq(independentSiteDomains.id, domainId),
        eq(independentSiteDomains.siteId, siteId),
        eq(independentSiteDomains.ownerUserId, ownerUserId)
      )
    );

  const refreshed = await listIndependentSiteDomains(ownerUserId, siteId);
  const found = refreshed.find((d) => d.id === domainId);
  if (!found) throw new Error("INDEPENDENT_SITE_DOMAIN_NOT_FOUND");
  return found;
}

export async function removeIndependentSiteDomain(
  ownerUserId: number,
  siteId: number,
  domainId: number
): Promise<{ removed: true }> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const db = await getDb();
  if (!db) {
    const list = memoryDomains.get(siteId) ?? [];
    memoryDomains.set(
      siteId,
      list.filter((d) => !(d.id === domainId && d.ownerUserId === ownerUserId))
    );
    return { removed: true };
  }

  await db
    .delete(independentSiteDomains)
    .where(
      and(
        eq(independentSiteDomains.id, domainId),
        eq(independentSiteDomains.siteId, siteId),
        eq(independentSiteDomains.ownerUserId, ownerUserId)
      )
    );
  return { removed: true };
}

/**
 * Crée ou retourne le site de démonstration « Association familiale ATH VAHLOUL »
 * pour l’utilisateur courant, afin de démontrer un site associatif et familial complet sans boutique.
 */
export async function ensureAthVahloulDemoProject(
  ownerUserId: number
): Promise<IndependentSiteProjectDto> {
  const existing = await listIndependentSiteProjects(ownerUserId);
  const found = existing.find(
    (site) =>
      site.templateId === ATH_VAHLOUL_DEMO_TEMPLATE_ID ||
      site.title.toLowerCase().includes("ath vahloul")
  );
  if (found) return found;

  return await createIndependentSiteProject(ownerUserId, {
    title: "Association familiale ATH VAHLOUL",
    siteType: "familial",
    slug: "association-familiale-ath-vahloul",
    templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  });
}
