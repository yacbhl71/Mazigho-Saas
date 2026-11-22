import { resolveTxt } from "node:dns/promises";
import { and, desc, eq, isNull, gt, inArray } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import {
  independentSiteDomains,
  independentSiteMedia,
  independentSiteVersions,
  independentSites,
  independentSiteMembers,
  independentSiteAccessAuditLogs,
  independentSiteFormSubmissions,
  users,
} from "../drizzle/schema";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  DEFAULT_IMAGE_TRANSFORMS,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_SITE_TEMPLATES,
  assertNoSecretsInIndependentSite,
  assertZeroEcommerceInIndependentSite,
  buildNavigationFromPages,
  evaluateIndependentSiteQualityAndChecklist,
  exportIndependentSiteProjectToJson,
  normalizeImageTransforms,
  normalizeIndependentPageSlug,
  repairKnownIndependentInternalLinks,
  sanitizeBuilderImageSrc,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  sanitizeBuilderText,
  shouldAutoCreateVersionOnSave,
  slugifyIndependentSite,
  validateAndSanitizeIndependentSiteImport,
  validateIndependentCustomDomain,
  type IndependentImageTransforms,
  type IndependentSiteInvitationInspectionDto,
  type IndependentSiteMenuItem,
  type IndependentSitePage,
  type IndependentSiteReusableBlock,
  type IndependentSiteStatus,
  type IndependentSiteThemeConfig,
  type IndependentSiteType,
  type RepairedInternalLinkChange,
} from "../shared/isolatedSiteBuilder";
import { getDb } from "./db";
import {
  getPublicUrl,
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./transactionalEmail";

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

function filterPublicPagesAndNavigation(
  pages: IndependentSitePage[],
  navigation: IndependentSiteMenuItem[],
): { pages: IndependentSitePage[]; navigation: IndependentSiteMenuItem[] } {
  const publicPages = pages.filter((page) => page.visibility === "public");
  const publicPageIds = new Set(publicPages.map((page) => page.id));

  const filterItems = (
    items: IndependentSiteMenuItem[],
  ): IndependentSiteMenuItem[] =>
    items.flatMap((item) => {
      if (item.pageId && !publicPageIds.has(item.pageId)) return [];
      const children = item.children ? filterItems(item.children) : undefined;
      return [
        {
          ...item,
          ...(children && children.length > 0
            ? { children }
            : { children: undefined }),
        },
      ];
    });

  return { pages: publicPages, navigation: filterItems(navigation) };
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

export type IndependentSiteAccessRole = "owner" | "admin" | "editor";
export type IndependentSiteAccessStatus = "invited" | "active" | "blocked";
export interface IndependentSiteAccessDto {
  id: number;
  siteId: number;
  userId: number | null;
  email: string;
  role: IndependentSiteAccessRole;
  status: IndependentSiteAccessStatus;
  invitationExpiresAt: string | null;
  createdAt: string;
}
const memoryMembers = new Map<number, IndependentSiteAccessDto[]>();
export interface IndependentSiteFormSubmissionDto {
  id: number;
  siteId: number;
  formType: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  payload: Record<string, unknown>;
  status: "new" | "read" | "archived";
  createdAt: string;
  readAt: string | null;
}
const memoryFormSubmissions = new Map<number, IndependentSiteFormSubmissionDto[]>();
let nextMemoryFormSubmissionId = 12001;
const memoryAccessAudit: Array<Record<string, unknown>> = [];
const memoryInvitationTokens = new Map<
  string,
  { siteId: number; memberId: number; expiresAt: string; usedAt: string | null }
>();
function normalizeAccessEmail(email: string) {
  return email.trim().toLowerCase();
}
function accessHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function ensureMemoryOwner(site: IndependentSiteProjectDto) {
  const members = memoryMembers.get(site.id) ?? [];
  if (
    !members.some((m) => m.userId === site.ownerUserId && m.role === "owner")
  ) {
    members.unshift({
      id: site.ownerUserId,
      siteId: site.id,
      userId: site.ownerUserId,
      email: `owner-${site.ownerUserId}@local.invalid`,
      role: "owner",
      status: "active",
      invitationExpiresAt: null,
      createdAt: site.createdAt,
    });
    memoryMembers.set(site.id, members);
  }
  return members;
}
export async function resolveIndependentSiteAccess(
  userId: number,
  siteId: number,
): Promise<IndependentSiteAccessDto | null> {
  const db = await getDb();
  if (!db) {
    const site = memorySites.get(siteId);
    if (!site) return null;
    const owner = site.ownerUserId === userId;
    const member = ensureMemoryOwner(site).find(
      (m) => m.userId === userId && m.status === "active",
    );
    return owner
      ? (ensureMemoryOwner(site).find(
          (m) => m.userId === site.ownerUserId && m.role === "owner",
        ) ?? null)
      : (member ?? null);
  }
  const sites = await db
    .select({ ownerUserId: independentSites.ownerUserId })
    .from(independentSites)
    .where(eq(independentSites.id, siteId))
    .limit(1);
  if (!sites[0]) return null;
  if (sites[0].ownerUserId === userId)
    return {
      id: 0,
      siteId,
      userId,
      email: "",
      role: "owner",
      status: "active",
      invitationExpiresAt: null,
      createdAt: new Date().toISOString(),
    };
  const rows = await db
    .select()
    .from(independentSiteMembers)
    .where(
      and(
        eq(independentSiteMembers.siteId, siteId),
        eq(independentSiteMembers.userId, userId),
        eq(independentSiteMembers.status, "active"),
      ),
    )
    .limit(1);
  const row = rows[0];
  return row
    ? {
        id: row.id,
        siteId: row.siteId,
        userId: row.userId,
        email: row.email,
        role: row.role,
        status: row.status,
        invitationExpiresAt: row.invitationExpiresAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      }
    : null;
}
const roleRank: Record<IndependentSiteAccessRole, number> = {
  editor: 1,
  admin: 2,
  owner: 3,
};
export async function assertIndependentSiteAccess(
  userId: number,
  siteId: number,
  minimumRole: IndependentSiteAccessRole = "editor",
) {
  const access = await resolveIndependentSiteAccess(userId, siteId);
  if (!access || roleRank[access.role] < roleRank[minimumRole])
    throw new Error("INDEPENDENT_SITE_ACCESS_DENIED");
  return access;
}
async function ownerForSite(
  userId: number,
  siteId: number,
  minimumRole: IndependentSiteAccessRole = "editor",
) {
  const access = await assertIndependentSiteAccess(userId, siteId, minimumRole);
  const db = await getDb();
  if (!db)
    return access.role === "owner"
      ? userId
      : (memorySites.get(siteId)?.ownerUserId ?? userId);
  const rows = await db
    .select({ ownerUserId: independentSites.ownerUserId })
    .from(independentSites)
    .where(eq(independentSites.id, siteId))
    .limit(1);
  return rows[0]?.ownerUserId ?? userId;
}
export async function resolveIndependentSiteOwnerUserId(
  userId: number,
  siteId: number,
  minimumRole: IndependentSiteAccessRole = "editor",
) {
  return ownerForSite(userId, siteId, minimumRole);
}
export async function listIndependentSiteProjectsAccessible(
  userId: number,
  filters?: { status?: IndependentSiteStatus; siteType?: IndependentSiteType },
) {
  const db = await getDb();
  if (!db)
    return Array.from(memorySites.values())
      .filter((s) => Boolean(awaitableAccess(userId, s.id)))
      .filter((s) => !filters?.status || s.status === filters.status)
      .filter((s) => !filters?.siteType || s.siteType === filters.siteType)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((s) => JSON.parse(JSON.stringify(s)));
  const owned = await db
    .select()
    .from(independentSites)
    .where(eq(independentSites.ownerUserId, userId));
  const memberships = await db
    .select({ siteId: independentSiteMembers.siteId })
    .from(independentSiteMembers)
    .where(
      and(
        eq(independentSiteMembers.userId, userId),
        eq(independentSiteMembers.status, "active"),
      ),
    );
  const ids = new Set([
    ...owned.map((r) => r.id),
    ...memberships.map((r) => r.siteId),
  ]);
  const rows = ids.size
    ? await db
        .select()
        .from(independentSites)
        .where(inArray(independentSites.id, Array.from(ids)))
    : [];
  return rows
    .map(rowToProjectDto)
    .filter((s) => ids.has(s.id))
    .filter((s) => !filters?.status || s.status === filters.status)
    .filter((s) => !filters?.siteType || s.siteType === filters.siteType)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
function awaitableAccess(userId: number, siteId: number) {
  const s = memorySites.get(siteId);
  if (!s) return false;
  return (
    s.ownerUserId === userId ||
    ensureMemoryOwner(s).some(
      (m) => m.userId === userId && m.status === "active",
    )
  );
}
export async function listIndependentSiteAccess(
  userId: number,
  siteId: number,
) {
  await assertIndependentSiteAccess(userId, siteId, "editor");
  const db = await getDb();
  if (!db)
    return ensureMemoryOwner(memorySites.get(siteId)!).map((m) => ({ ...m }));
  const siteRows = await db
    .select({
      ownerUserId: independentSites.ownerUserId,
      ownerEmail: users.email,
    })
    .from(independentSites)
    .leftJoin(users, eq(users.id, independentSites.ownerUserId))
    .where(eq(independentSites.id, siteId))
    .limit(1);
  const site = siteRows[0];
  if (!site) return [];
  const rows = await db
    .select()
    .from(independentSiteMembers)
    .where(eq(independentSiteMembers.siteId, siteId));
  const members = rows.map((r) => ({
    id: r.id,
    siteId: r.siteId,
    userId: r.userId,
    email: r.email,
    role: r.role,
    status: r.status,
    invitationExpiresAt: r.invitationExpiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
  if (
    members.some(
      (member) => member.userId === site.ownerUserId || member.role === "owner",
    )
  )
    return members;
  return [
    {
      id: 0,
      siteId,
      userId: site.ownerUserId,
      email: site.ownerEmail ?? `owner-${site.ownerUserId}@local.invalid`,
      role: "owner" as const,
      status: "active" as const,
      invitationExpiresAt: null,
      createdAt: new Date().toISOString(),
    },
    ...members,
  ];
}
export async function logIndependentSiteAccessAction(
  actorUserId: number,
  siteId: number,
  action: string,
  target?: { userId?: number | null; email?: string },
  metadata?: Record<string, unknown>,
) {
  const db = await getDb();
  if (!db) {
    memoryAccessAudit.push({
      actorUserId,
      siteId,
      action,
      target,
      metadata,
      createdAt: new Date().toISOString(),
    });
    return;
  }
  await db
    .insert(independentSiteAccessAuditLogs)
    .values({
      siteId,
      actorUserId,
      action,
      targetUserId: target?.userId ?? null,
      targetEmail: target?.email ?? null,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    });
}
export async function inviteIndependentSiteAccess(
  actorUserId: number,
  input: {
    siteId: number;
    email: string;
    role?: "admin" | "editor";
    expiresInHours?: number;
  },
) {
  await assertIndependentSiteAccess(actorUserId, input.siteId, "owner");
  const email = normalizeAccessEmail(input.email);
  const expires = new Date(Date.now() + 3600000 * (input.expiresInHours ?? 72));
  const token = randomBytes(32).toString("base64url");
  const role = input.role ?? "editor";
  const db = await getDb();
  let member: IndependentSiteAccessDto;
  let siteTitle = "Site indépendant";
  let siteSlug = "";
  if (!db) {
    const site = memorySites.get(input.siteId);
    if (!site) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
    siteTitle = site.title;
    siteSlug = site.slug;
    const list = ensureMemoryOwner(site);
    const existing = list.find((m) => m.email === email);
    member = {
      id: existing?.id ?? Math.floor(Math.random() * 1e6),
      siteId: input.siteId,
      userId: null,
      email,
      role,
      status: "invited",
      invitationExpiresAt: expires.toISOString(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) Object.assign(existing, member);
    else list.push(member);
    for (const [k, v] of Array.from(memoryInvitationTokens.entries())) {
      if (v.siteId === input.siteId && v.memberId === member.id && !v.usedAt) {
        memoryInvitationTokens.delete(k);
      }
    }
    memoryInvitationTokens.set(accessHash(token), {
      siteId: input.siteId,
      memberId: member.id,
      expiresAt: expires.toISOString(),
      usedAt: null,
    });
  } else {
    const siteRows = await db
      .select({ title: independentSites.title, slug: independentSites.slug })
      .from(independentSites)
      .where(eq(independentSites.id, input.siteId))
      .limit(1);
    if (siteRows[0]) {
      siteTitle = siteRows[0].title;
      siteSlug = siteRows[0].slug;
    }
    const existing = await db
      .select()
      .from(independentSiteMembers)
      .where(
        and(
          eq(independentSiteMembers.siteId, input.siteId),
          eq(independentSiteMembers.email, email),
        ),
      )
      .limit(1);
    if (existing[0])
      await db
        .update(independentSiteMembers)
        .set({
          role,
          status: "invited",
          invitationTokenHash: accessHash(token),
          invitationExpiresAt: expires,
          invitationUsedAt: null,
        })
        .where(eq(independentSiteMembers.id, existing[0].id));
    else
      await db
        .insert(independentSiteMembers)
        .values({
          siteId: input.siteId,
          email,
          role,
          status: "invited",
          invitationTokenHash: accessHash(token),
          invitationExpiresAt: expires,
        });
    member = {
      id: existing[0]?.id ?? 0,
      siteId: input.siteId,
      userId: null,
      email,
      role,
      status: "invited",
      invitationExpiresAt: expires.toISOString(),
      createdAt:
        existing[0]?.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
  await logIndependentSiteAccessAction(actorUserId, input.siteId, "invite", {
    email,
  });
  const invitationPath = `/constructeur-sites/invitation/${encodeURIComponent(token)}`;
  const result = {
    ...member,
    expiresAt: expires,
    siteTitle,
    siteSlug,
    invitationPath,
    invitationDelivery: "not_configured" as
      | "not_configured"
      | "delivered"
      | "failed",
    developmentOnlyToken:
      process.env.NODE_ENV === "production" ? undefined : token,
  };
  if (!isTransactionalEmailConfigured()) return result;
  try {
    const link = `${getPublicUrl()}${invitationPath}`;
    const roleLabel =
      role === "admin" ? "Administrateur du site" : "Éditeur de contenu";
    const delivery = await sendTransactionalEmail({
      to: email,
      subject: `Invitation à gérer le site « ${siteTitle} » (${roleLabel})`,
      text: `Vous êtes invité à rejoindre l’espace d’administration du site « ${siteTitle} » avec le rôle ${roleLabel}. Ce lien est à usage unique et doit être activé avec l’adresse ${email} : ${link}`,
      html: `<p>Vous êtes invité à rejoindre l’espace d’administration du site <strong>${siteTitle}</strong> avec le rôle <strong>${roleLabel}</strong>.</p><p>Important : connectez-vous avec l’adresse e-mail invitée (<strong>${email}</strong>).</p><p><a href="${link}">Activer mon accès au site</a></p>`,
      idempotencyKey: `independent-site-invitation/${input.siteId}/${member.id}/${accessHash(token).slice(0, 12)}`,
    });
    return {
      ...result,
      invitationDelivery: delivery.delivered
        ? ("delivered" as const)
        : ("failed" as const),
    };
  } catch {
    return { ...result, invitationDelivery: "failed" as const };
  }
}
export async function revokeIndependentSiteAccess(
  actorUserId: number,
  siteId: number,
  memberId: number,
) {
  await assertIndependentSiteAccess(actorUserId, siteId, "owner");
  const db = await getDb();
  if (!db) {
    const list = ensureMemoryOwner(memorySites.get(siteId)!);
    const m = list.find((x) => x.id === memberId);
    if (!m || m.role === "owner")
      throw new Error("INDEPENDENT_SITE_MEMBER_NOT_FOUND");
    m.status = "blocked";
    await logIndependentSiteAccessAction(actorUserId, siteId, "revoke", m);
    return m;
  }
  const rows = await db
    .select()
    .from(independentSiteMembers)
    .where(
      and(
        eq(independentSiteMembers.id, memberId),
        eq(independentSiteMembers.siteId, siteId),
      ),
    )
    .limit(1);
  const m = rows[0];
  if (!m || m.role === "owner")
    throw new Error("INDEPENDENT_SITE_MEMBER_NOT_FOUND");
  await db
    .update(independentSiteMembers)
    .set({ status: "blocked" })
    .where(eq(independentSiteMembers.id, memberId));
  await logIndependentSiteAccessAction(actorUserId, siteId, "revoke", m);
  return { ...m, status: "blocked" as const };
}
export async function updateIndependentSiteAccessRole(
  actorUserId: number,
  siteId: number,
  memberId: number,
  role: "admin" | "editor",
) {
  await assertIndependentSiteAccess(actorUserId, siteId, "owner");
  const db = await getDb();
  if (!db) {
    const m = ensureMemoryOwner(memorySites.get(siteId)!).find(
      (x) => x.id === memberId,
    );
    if (!m || m.role === "owner")
      throw new Error("INDEPENDENT_SITE_MEMBER_NOT_FOUND");
    m.role = role;
    await logIndependentSiteAccessAction(actorUserId, siteId, "role_change", m);
    return m;
  }
  await db
    .update(independentSiteMembers)
    .set({ role })
    .where(
      and(
        eq(independentSiteMembers.id, memberId),
        eq(independentSiteMembers.siteId, siteId),
      ),
    );
  await logIndependentSiteAccessAction(actorUserId, siteId, "role_change", {
    userId: memberId,
  });
  return { memberId, role };
}
export async function transferIndependentSiteOwnership(
  actorUserId: number,
  siteId: number,
  targetEmail: string,
  confirmationSiteTitle: string,
) {
  const currentAccess = await assertIndependentSiteAccess(
    actorUserId,
    siteId,
    "owner",
  );
  const normalizedEmail = normalizeAccessEmail(targetEmail);
  if (!normalizedEmail || confirmationSiteTitle.trim().length === 0)
    throw new Error("INDEPENDENT_SITE_TRANSFER_CONFIRMATION_REQUIRED");
  const db = await getDb();
  if (!db) {
    const site = memorySites.get(siteId);
    if (!site) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
    if (confirmationSiteTitle.trim() !== site.title)
      throw new Error("INDEPENDENT_SITE_TRANSFER_CONFIRMATION_MISMATCH");
    const members = ensureMemoryOwner(site);
    const target = members.find(
      (member) =>
        member.email === normalizedEmail &&
        member.userId !== null &&
        member.status === "active",
    );
    if (!target?.userId)
      throw new Error("INDEPENDENT_SITE_TRANSFER_TARGET_NOT_ACTIVE");
    if (target.userId === actorUserId)
      throw new Error("INDEPENDENT_SITE_TRANSFER_TARGET_IS_CURRENT_OWNER");
    const previousOwner = site.ownerUserId;
    const previousOwnerMember = members.find(
      (member) => member.userId === previousOwner,
    );
    site.ownerUserId = target.userId;
    target.role = "owner";
    target.status = "active";
    if (previousOwnerMember && previousOwnerMember.id !== target.id) {
      previousOwnerMember.role = "admin";
      previousOwnerMember.status = "active";
    } else {
      members.push({
        id: previousOwner,
        siteId,
        userId: previousOwner,
        email: currentAccess.email || `owner-${previousOwner}@local.invalid`,
        role: "admin",
        status: "active",
        invitationExpiresAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    await logIndependentSiteAccessAction(actorUserId, siteId, "ownership_transfer", {
      userId: target.userId,
      email: normalizedEmail,
    }, { previousOwnerUserId: previousOwner });
    return { siteId, previousOwnerUserId: previousOwner, ownerUserId: target.userId };
  }
  const targetUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.accountStatus, "active")))
    .limit(2);
  if (targetUsers.length !== 1 || !targetUsers[0]?.email)
    throw new Error("INDEPENDENT_SITE_TRANSFER_TARGET_NOT_ACTIVE");
  const targetUser = targetUsers[0];
  if (targetUser.id === actorUserId)
    throw new Error("INDEPENDENT_SITE_TRANSFER_TARGET_IS_CURRENT_OWNER");
  return db.transaction(async (tx) => {
    const sites = await tx
      .select({ ownerUserId: independentSites.ownerUserId, title: independentSites.title })
      .from(independentSites)
      .where(and(eq(independentSites.id, siteId), eq(independentSites.ownerUserId, actorUserId)))
      .limit(1);
    const site = sites[0];
    if (!site) throw new Error("INDEPENDENT_SITE_TRANSFER_STALE_OWNER");
    if (confirmationSiteTitle.trim() !== site.title)
      throw new Error("INDEPENDENT_SITE_TRANSFER_CONFIRMATION_MISMATCH");
    const previousOwner = site.ownerUserId;
    const ownershipUpdate = await tx
      .update(independentSites)
      .set({ ownerUserId: targetUser.id })
      .where(
        and(
          eq(independentSites.id, siteId),
          eq(independentSites.ownerUserId, previousOwner),
        ),
      );
    const ownershipAffectedRows = Number(
      (ownershipUpdate as any)?.[0]?.affectedRows ??
        (ownershipUpdate as any)?.affectedRows ??
        0,
    );
    if (ownershipAffectedRows !== 1)
      throw new Error("INDEPENDENT_SITE_TRANSFER_CONFLICT");
    const existingTarget = await tx
      .select()
      .from(independentSiteMembers)
      .where(and(eq(independentSiteMembers.siteId, siteId), eq(independentSiteMembers.email, normalizedEmail)))
      .limit(1);
    if (existingTarget[0]) {
      await tx.update(independentSiteMembers).set({
        userId: targetUser.id,
        role: "owner",
        status: "active",
        invitationTokenHash: null,
        invitationExpiresAt: null,
        invitationUsedAt: null,
      }).where(eq(independentSiteMembers.id, existingTarget[0].id));
    } else {
      await tx.insert(independentSiteMembers).values({
        siteId,
        userId: targetUser.id,
        email: normalizedEmail,
        role: "owner",
        status: "active",
      });
    }
    const previousOwnerUser = await tx.select({ email: users.email }).from(users).where(eq(users.id, previousOwner)).limit(1);
    const previousOwnerEmail = previousOwnerUser[0]?.email ?? `owner-${previousOwner}@local.invalid`;
    const existingPreviousOwner = await tx
      .select()
      .from(independentSiteMembers)
      .where(and(eq(independentSiteMembers.siteId, siteId), eq(independentSiteMembers.email, previousOwnerEmail)))
      .limit(1);
    if (existingPreviousOwner[0]) {
      await tx.update(independentSiteMembers).set({ userId: previousOwner, role: "admin", status: "active" }).where(eq(independentSiteMembers.id, existingPreviousOwner[0].id));
    } else {
      await tx.insert(independentSiteMembers).values({ siteId, userId: previousOwner, email: previousOwnerEmail, role: "admin", status: "active" });
    }
    await tx.update(independentSiteVersions).set({ ownerUserId: targetUser.id }).where(and(eq(independentSiteVersions.siteId, siteId), eq(independentSiteVersions.ownerUserId, previousOwner)));
    await tx.update(independentSiteMedia).set({ ownerUserId: targetUser.id }).where(and(eq(independentSiteMedia.siteId, siteId), eq(independentSiteMedia.ownerUserId, previousOwner)));
    await tx.update(independentSiteDomains).set({ ownerUserId: targetUser.id }).where(and(eq(independentSiteDomains.siteId, siteId), eq(independentSiteDomains.ownerUserId, previousOwner)));
    await tx.insert(independentSiteAccessAuditLogs).values({
      siteId,
      actorUserId,
      action: "ownership_transfer",
      targetUserId: targetUser.id,
      targetEmail: normalizedEmail,
      metadataJson: JSON.stringify({ previousOwnerUserId: previousOwner }),
    });
    return { siteId, previousOwnerUserId: previousOwner, ownerUserId: targetUser.id };
  });
}
export async function inspectIndependentSiteInvitation(
  token: string,
  viewerEmail?: string | null,
): Promise<IndependentSiteInvitationInspectionDto> {
  const cleanToken = (token || "").trim();
  if (!cleanToken) {
    return {
      status: "not_found",
      siteId: null,
      siteTitle: null,
      siteSlug: null,
      role: null,
      invitedEmail: null,
      expiresAt: null,
      emailMatchesViewer: null,
    };
  }
  const tokenHash = accessHash(cleanToken);
  const normalizedViewer = viewerEmail ? normalizeAccessEmail(viewerEmail) : null;
  const db = await getDb();
  if (!db) {
    const invitation = memoryInvitationTokens.get(tokenHash);
    if (!invitation) {
      return {
        status: "not_found",
        siteId: null,
        siteTitle: null,
        siteSlug: null,
        role: null,
        invitedEmail: null,
        expiresAt: null,
        emailMatchesViewer: null,
      };
    }
    const site = memorySites.get(invitation.siteId);
    const member = site
      ? ensureMemoryOwner(site).find((m) => m.id === invitation.memberId)
      : null;
    if (!site || !member) {
      return {
        status: "not_found",
        siteId: null,
        siteTitle: null,
        siteSlug: null,
        role: null,
        invitedEmail: null,
        expiresAt: null,
        emailMatchesViewer: null,
      };
    }
    const role: "admin" | "editor" = member.role === "admin" ? "admin" : "editor";
    const emailMatchesViewer = normalizedViewer
      ? normalizeAccessEmail(member.email) === normalizedViewer
      : null;
    if (member.status === "blocked") {
      return {
        status: "revoked",
        siteId: site.id,
        siteTitle: site.title,
        siteSlug: site.slug,
        role,
        invitedEmail: member.email,
        expiresAt: invitation.expiresAt,
        emailMatchesViewer,
      };
    }
    if (invitation.usedAt || member.status === "active") {
      return {
        status: "already_used",
        siteId: site.id,
        siteTitle: site.title,
        siteSlug: site.slug,
        role,
        invitedEmail: member.email,
        expiresAt: invitation.expiresAt,
        emailMatchesViewer,
      };
    }
    if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
      return {
        status: "expired",
        siteId: site.id,
        siteTitle: site.title,
        siteSlug: site.slug,
        role,
        invitedEmail: member.email,
        expiresAt: invitation.expiresAt,
        emailMatchesViewer,
      };
    }
    return {
      status: "valid",
      siteId: site.id,
      siteTitle: site.title,
      siteSlug: site.slug,
      role,
      invitedEmail: member.email,
      expiresAt: invitation.expiresAt,
      emailMatchesViewer,
    };
  }

  const rows = await db
    .select({
      id: independentSiteMembers.id,
      siteId: independentSiteMembers.siteId,
      email: independentSiteMembers.email,
      role: independentSiteMembers.role,
      status: independentSiteMembers.status,
      invitationExpiresAt: independentSiteMembers.invitationExpiresAt,
      invitationUsedAt: independentSiteMembers.invitationUsedAt,
      siteTitle: independentSites.title,
      siteSlug: independentSites.slug,
    })
    .from(independentSiteMembers)
    .leftJoin(
      independentSites,
      eq(independentSites.id, independentSiteMembers.siteId),
    )
    .where(eq(independentSiteMembers.invitationTokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return {
      status: "not_found",
      siteId: null,
      siteTitle: null,
      siteSlug: null,
      role: null,
      invitedEmail: null,
      expiresAt: null,
      emailMatchesViewer: null,
    };
  }
  const role: "admin" | "editor" = row.role === "admin" ? "admin" : "editor";
  const expiresAtIso = row.invitationExpiresAt
    ? row.invitationExpiresAt.toISOString()
    : null;
  const emailMatchesViewer = normalizedViewer
    ? normalizeAccessEmail(row.email) === normalizedViewer
    : null;

  if (row.status === "blocked") {
    return {
      status: "revoked",
      siteId: row.siteId,
      siteTitle: row.siteTitle ?? "Site indépendant",
      siteSlug: row.siteSlug ?? null,
      role,
      invitedEmail: row.email,
      expiresAt: expiresAtIso,
      emailMatchesViewer,
    };
  }
  if (row.invitationUsedAt !== null || row.status === "active") {
    return {
      status: "already_used",
      siteId: row.siteId,
      siteTitle: row.siteTitle ?? "Site indépendant",
      siteSlug: row.siteSlug ?? null,
      role,
      invitedEmail: row.email,
      expiresAt: expiresAtIso,
      emailMatchesViewer,
    };
  }
  if (!row.invitationExpiresAt || row.invitationExpiresAt.getTime() <= Date.now()) {
    return {
      status: "expired",
      siteId: row.siteId,
      siteTitle: row.siteTitle ?? "Site indépendant",
      siteSlug: row.siteSlug ?? null,
      role,
      invitedEmail: row.email,
      expiresAt: expiresAtIso,
      emailMatchesViewer,
    };
  }
  return {
    status: "valid",
    siteId: row.siteId,
    siteTitle: row.siteTitle ?? "Site indépendant",
    siteSlug: row.siteSlug ?? null,
    role,
    invitedEmail: row.email,
    expiresAt: expiresAtIso,
    emailMatchesViewer,
  };
}
export async function acceptIndependentSiteInvitation(
  userId: number,
  token: string,
  accountEmail: string,
) {
  const email = normalizeAccessEmail(accountEmail);
  const inspection = await inspectIndependentSiteInvitation(token, email);
  if (inspection.status === "not_found") {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:NOT_FOUND");
  }
  if (inspection.status === "revoked") {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:REVOKED");
  }
  if (inspection.status === "already_used") {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:ALREADY_USED");
  }
  if (inspection.status === "expired") {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:EXPIRED");
  }
  if (inspection.emailMatchesViewer === false) {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:EMAIL_MISMATCH");
  }

  const db = await getDb();
  if (!db) {
    const invitation = memoryInvitationTokens.get(accessHash(token));
    if (!invitation || new Date(invitation.expiresAt) <= new Date() || invitation.usedAt)
      throw new Error("INDEPENDENT_SITE_INVITATION_INVALID");
    const site = memorySites.get(invitation.siteId);
    const member = site
      ? ensureMemoryOwner(site).find((m) => m.id === invitation.memberId)
      : null;
    if (
      !member ||
      member.status !== "invited" ||
      normalizeAccessEmail(member.email) !== email
    )
      throw new Error("INDEPENDENT_SITE_INVITATION_INVALID");
    member.userId = userId;
    member.status = "active";
    invitation.usedAt = new Date().toISOString();
    await logIndependentSiteAccessAction(userId, invitation.siteId, "accept", {
      email: member.email,
      userId,
    });
    return {
      siteId: invitation.siteId,
      siteTitle: site?.title ?? "Site indépendant",
      siteSlug: site?.slug ?? null,
      role: member.role,
      status: "active" as const,
    };
  }
  const rows = await db
    .select()
    .from(independentSiteMembers)
    .where(
      and(
        eq(independentSiteMembers.invitationTokenHash, accessHash(token)),
        eq(independentSiteMembers.status, "invited"),
        eq(independentSiteMembers.email, email),
        gt(independentSiteMembers.invitationExpiresAt, new Date()),
        isNull(independentSiteMembers.invitationUsedAt),
      ),
    )
    .limit(1);
  const m = rows[0];
  if (!m) throw new Error("INDEPENDENT_SITE_INVITATION_INVALID");
  const updateResult = await db
    .update(independentSiteMembers)
    .set({
      userId,
      status: "active",
      invitationUsedAt: new Date(),
    })
    .where(
      and(
        eq(independentSiteMembers.id, m.id),
        eq(independentSiteMembers.status, "invited"),
        isNull(independentSiteMembers.invitationUsedAt),
      ),
    );
  const affectedRows = Number(
    (updateResult as { affectedRows?: number }).affectedRows ?? 0,
  );
  if (affectedRows !== 1) {
    throw new Error("INDEPENDENT_SITE_INVITATION_INVALID:ALREADY_USED");
  }
  await logIndependentSiteAccessAction(userId, m.siteId, "accept", {
    email: m.email,
    userId,
  });
  return {
    siteId: m.siteId,
    siteTitle: inspection.siteTitle ?? "Site indépendant",
    siteSlug: inspection.siteSlug ?? null,
    role: m.role,
    status: "active" as const,
  };
}

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

function rowToProjectDto(
  row: typeof independentSites.$inferSelect,
): IndependentSiteProjectDto {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    slug: row.slug,
    title: row.title,
    siteType: (row.siteType as IndependentSiteType) || "vitrine",
    status: row.status,
    templateId: row.templateId ?? null,
    theme: safeJsonParse<IndependentSiteThemeConfig>(
      row.themeJson,
      DEFAULT_THEME,
    ),
    navigation: safeJsonParse<IndependentSiteMenuItem[]>(
      row.navigationJson,
      [],
    ),
    pages: safeJsonParse<IndependentSitePage[]>(row.pagesJson, []),
    reusableBlocks: safeJsonParse<IndependentSiteReusableBlock[]>(
      row.reusableBlocksJson,
      [],
    ),
    publishedSnapshot: safeJsonParse(row.publishedSnapshotJson, null),
    publishedAt: row.publishedAt
      ? new Date(row.publishedAt).toISOString()
      : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: Set<string>,
): string {
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
  filters?: { status?: IndependentSiteStatus; siteType?: IndependentSiteType },
): Promise<IndependentSiteProjectDto[]> {
  const repairAthProjects = async (projects: IndependentSiteProjectDto[]) =>
    Promise.all(
      projects.map(async (project) => {
        const isAthProject =
          project.templateId === ATH_VAHLOUL_DEMO_TEMPLATE_ID ||
          project.title.toLowerCase().includes("ath vahloul");
        if (!isAthProject) return project;
        const repaired = repairKnownIndependentInternalLinks(project.pages);
        if (repaired.changes.length === 0) return project;
        return saveIndependentSiteProject(ownerUserId, {
          siteId: project.id,
          pages: repaired.pages,
          createVersionLabel: "Réparation automatique des anciens liens ATH VAHLOUL",
        });
      }),
    );

  const db = await getDb();
  if (!db) {
    const items = Array.from(memorySites.values())
      .filter((site) => site.ownerUserId === ownerUserId)
      .filter((site) =>
        filters?.status ? site.status === filters.status : true,
      )
      .filter((site) =>
        filters?.siteType ? site.siteType === filters.siteType : true,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return repairAthProjects(items.map((item) => JSON.parse(JSON.stringify(item))));
  }

  const rows = await db
    .select()
    .from(independentSites)
    .where(eq(independentSites.ownerUserId, ownerUserId))
    .orderBy(desc(independentSites.updatedAt));

  const projects = rows
    .map(rowToProjectDto)
    .filter((site) => (filters?.status ? site.status === filters.status : true))
    .filter((site) =>
      filters?.siteType ? site.siteType === filters.siteType : true,
    );
  return repairAthProjects(projects);
}

export async function getIndependentSiteProject(
  ownerUserId: number,
  siteId: number,
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
    .where(
      and(
        eq(independentSites.id, siteId),
        eq(independentSites.ownerUserId, ownerUserId),
      ),
    )
    .limit(1);

  return rows[0] ? rowToProjectDto(rows[0]) : null;
}

export async function getPublicIndependentSiteBySlug(
  slug: string,
  options?: { allowDraftForOwnerUserId?: number; previewToken?: string | null },
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
  isCollaboratorPreview?: boolean;
  collaboratorLabel?: string | null;
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
  const tokenVerification = options?.previewToken
    ? verifyIndependentCollaboratorPreviewToken(
        project.id,
        options.previewToken,
      )
    : { valid: false as const };
  const isCollaboratorPreview = tokenVerification.valid;

  if (
    project.status === "published" &&
    project.publishedSnapshot &&
    !isOwnerPreview &&
    !isCollaboratorPreview
  ) {
    const publicContent = filterPublicPagesAndNavigation(
      project.publishedSnapshot.pages,
      project.publishedSnapshot.navigation,
    );
    return {
      id: project.id,
      slug: project.slug,
      title: project.publishedSnapshot.title,
      siteType: project.publishedSnapshot.siteType,
      status: project.status,
      theme: project.publishedSnapshot.theme,
      navigation: publicContent.navigation,
      pages: publicContent.pages,
      publishedAt: project.publishedAt,
    };
  }
  if (isOwnerPreview || isCollaboratorPreview) {
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
      isCollaboratorPreview,
      collaboratorLabel: tokenVerification.share?.collaboratorLabel ?? null,
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
  },
): Promise<IndependentSiteProjectDto> {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const safeTitle =
    sanitizeBuilderText(input.title || "Mon Site Internet", 160) ||
    "Mon Site Internet";
  const template = input.templateId
    ? (INDEPENDENT_SITE_TEMPLATES.find((t) => t.id === input.templateId) ??
      null)
    : null;
  const socle = input.socleId
    ? (INDEPENDENT_PAGE_SOCLES.find((s) => s.id === input.socleId) ?? null)
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
    const existingSlugs = new Set(
      Array.from(memorySites.values()).map((s) => s.slug),
    );
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

  const allExisting = await db
    .select({ slug: independentSites.slug })
    .from(independentSites);
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
  await createIndependentSiteVersion(
    ownerUserId,
    insertedId,
    "Version initiale",
  );
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
  },
): Promise<IndependentSiteProjectDto> {
  assertNoSecretsInIndependentSite(input);
  assertZeroEcommerceInIndependentSite(input);

  const current = await getIndependentSiteProject(ownerUserId, input.siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const nextTitle = input.title
    ? sanitizeBuilderText(input.title, 160)
    : current.title;
  const nextSiteType = input.siteType ?? current.siteType;
  const nextTheme = input.theme
    ? { ...current.theme, ...input.theme }
    : current.theme;
  const nextPages: IndependentSitePage[] = input.pages
    ? input.pages.map((p, idx) => ({
        ...p,
        title: sanitizeBuilderText(p.title || `Page ${idx + 1}`, 140),
        slug: normalizeIndependentPageSlug(p.slug),
        menuOrder: typeof p.menuOrder === "number" ? p.menuOrder : idx + 1,
        seoTitle: sanitizeBuilderText(
          p.seoTitle || p.title || `Page ${idx + 1}`,
          180,
        ),
        seoDescription: sanitizeBuilderText(p.seoDescription || "", 320),
        socialImageUrl: p.socialImageUrl
          ? sanitizeBuilderImageSrc(p.socialImageUrl)
          : undefined,
        indexable: p.indexable !== false,
        html: sanitizeIndependentHtml(p.html),
        css: sanitizeIndependentCss(p.css),
      }))
    : current.pages;

  if (nextPages.length === 0) {
    throw new Error("INDEPENDENT_SITE_EMPTY_PAGES_FORBIDDEN");
  }

  const nextNavigation =
    input.navigation ?? buildNavigationFromPages(nextPages);
  const nextReusableBlocks = (
    input.reusableBlocks ?? current.reusableBlocks
  ).map((block) => ({
    ...block,
    name: sanitizeBuilderText(block.name, 140),
    category: sanitizeBuilderText(block.category, 80),
    html: sanitizeIndependentHtml(block.html),
  }));
  const now = new Date().toISOString();

  const autoVersionDecision = shouldAutoCreateVersionOnSave(
    current.pages,
    nextPages,
    current.title,
    nextTitle,
  );
  const effectiveVersionLabel =
    input.createVersionLabel ||
    (autoVersionDecision.shouldCreate
      ? autoVersionDecision.autoLabel
      : undefined);

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
    if (effectiveVersionLabel) {
      await createIndependentSiteVersion(
        ownerUserId,
        current.id,
        effectiveVersionLabel,
      );
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
    .where(
      and(
        eq(independentSites.id, current.id),
        eq(independentSites.ownerUserId, ownerUserId),
      ),
    );

  if (effectiveVersionLabel) {
    await createIndependentSiteVersion(
      ownerUserId,
      current.id,
      effectiveVersionLabel,
    );
  }

  const reloaded = await getIndependentSiteProject(ownerUserId, current.id);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function duplicateIndependentSiteProject(
  ownerUserId: number,
  siteId: number,
  newTitle?: string,
): Promise<IndependentSiteProjectDto> {
  const source = await getIndependentSiteProject(ownerUserId, siteId);
  if (!source) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const copyTitle = sanitizeBuilderText(
    newTitle || `${source.title} (copie)`,
    160,
  );
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
  status: IndependentSiteStatus,
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
    .where(
      and(
        eq(independentSites.id, siteId),
        eq(independentSites.ownerUserId, ownerUserId),
      ),
    );

  const reloaded = await getIndependentSiteProject(ownerUserId, siteId);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function publishIndependentSiteProject(
  ownerUserId: number,
  siteId: number,
): Promise<IndependentSiteProjectDto> {
  const current = await getIndependentSiteProject(ownerUserId, siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  assertNoSecretsInIndependentSite(current);
  assertZeroEcommerceInIndependentSite(current);

  if (
    !current.pages.length ||
    !current.pages.some((p) => p.html && p.html.trim().length > 0)
  ) {
    throw new Error("INDEPENDENT_SITE_PUBLISH_EMPTY_CONTENT");
  }

  const qualityCheck = evaluateIndependentSiteQualityAndChecklist({
    title: current.title,
    slug: current.slug,
    siteType: current.siteType,
    status: current.status,
    templateId: current.templateId,
    theme: current.theme,
    navigation: current.navigation,
    pages: current.pages,
  });

  if (!qualityCheck.canPublish) {
    const failedLabels = qualityCheck.checklist
      .filter((c) => c.blocking && !c.passed)
      .map((c) => c.label);
    throw new Error(
      `INDEPENDENT_SITE_PUBLISH_CHECKLIST_BLOCKED: ${failedLabels.join(" | ")}`,
    );
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
    const ver = await createIndependentSiteVersion(
      ownerUserId,
      siteId,
      `Publication du site (${nowIso.slice(0, 10)})`,
    );
    recordIndependentPublicationLog({
      siteId,
      ownerUserId,
      action: "publish",
      versionNumber: ver.versionNumber,
      summary: `Publication validée (${current.pages.length} page(s), score qualité ${qualityCheck.overallScore100}/100) sur /sites/${current.slug}`,
    });
    return JSON.parse(JSON.stringify(updated));
  }

  await db
    .update(independentSites)
    .set({
      status: "published",
      publishedSnapshotJson: JSON.stringify(snapshot),
      publishedAt: new Date(nowIso),
    })
    .where(
      and(
        eq(independentSites.id, siteId),
        eq(independentSites.ownerUserId, ownerUserId),
      ),
    );

  const ver = await createIndependentSiteVersion(
    ownerUserId,
    siteId,
    `Publication du site (${nowIso.slice(0, 10)})`,
  );
  recordIndependentPublicationLog({
    siteId,
    ownerUserId,
    action: "publish",
    versionNumber: ver.versionNumber,
    summary: `Publication validée (${current.pages.length} page(s), score qualité ${qualityCheck.overallScore100}/100) sur /sites/${current.slug}`,
  });
  const reloaded = await getIndependentSiteProject(ownerUserId, siteId);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function createIndependentSiteFormSubmission(input: {
  siteId: number;
  formType?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const item: IndependentSiteFormSubmissionDto = {
    id: nextMemoryFormSubmissionId++, siteId: input.siteId, formType: input.formType?.trim() || "contact",
    name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: input.phone?.trim() || null,
    message: input.message.trim(), payload: input.payload ?? {}, status: "new", createdAt: now, readAt: null,
  };
  const db = await getDb();
  if (!db) {
    memoryFormSubmissions.set(input.siteId, [item, ...(memoryFormSubmissions.get(input.siteId) ?? [])]);
    return item;
  }
  const [result] = await db.insert(independentSiteFormSubmissions).values({
    siteId: input.siteId, formType: item.formType, name: item.name, email: item.email, phone: item.phone,
    message: item.message, payloadJson: JSON.stringify(item.payload), status: item.status,
  });
  return { ...item, id: Number(result.insertId) };
}

export async function listIndependentSiteFormSubmissions(siteId: number, status?: "new" | "read" | "archived") {
  const db = await getDb();
  if (!db) return (memoryFormSubmissions.get(siteId) ?? []).filter((item) => !status || item.status === status);
  const rows = await db.select().from(independentSiteFormSubmissions).where(status ? and(eq(independentSiteFormSubmissions.siteId, siteId), eq(independentSiteFormSubmissions.status, status)) : eq(independentSiteFormSubmissions.siteId, siteId)).orderBy(desc(independentSiteFormSubmissions.createdAt));
  return rows.map((row) => ({ id: row.id, siteId: row.siteId, formType: row.formType, name: row.name, email: row.email, phone: row.phone, message: row.message, payload: safeJsonParse(row.payloadJson, {}), status: row.status, createdAt: new Date(row.createdAt).toISOString(), readAt: row.readAt ? new Date(row.readAt).toISOString() : null }));
}

export async function markIndependentSiteFormSubmissionRead(siteId: number, submissionId: number) {
  const now = new Date();
  const db = await getDb();
  if (!db) {
    const items = memoryFormSubmissions.get(siteId) ?? [];
    const item = items.find((entry) => entry.id === submissionId);
    if (!item) throw new Error("INDEPENDENT_FORM_NOT_FOUND");
    item.status = "read"; item.readAt = now.toISOString(); return item;
  }
  await db.update(independentSiteFormSubmissions).set({ status: "read", readAt: now }).where(and(eq(independentSiteFormSubmissions.id, submissionId), eq(independentSiteFormSubmissions.siteId, siteId)));
  return (await listIndependentSiteFormSubmissions(siteId)).find((item) => item.id === submissionId) ?? null;
}

// ---------------------------------------------------------------------------
// Versions & Historique
// ---------------------------------------------------------------------------

export async function listIndependentSiteVersions(
  ownerUserId: number,
  siteId: number,
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
        eq(independentSiteVersions.ownerUserId, ownerUserId),
      ),
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
  label?: string,
): Promise<IndependentSiteVersionDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const existing = await listIndependentSiteVersions(ownerUserId, siteId);
  const nextVersionNumber =
    existing.length > 0 ? existing[0].versionNumber + 1 : 1;
  const safeLabel = sanitizeBuilderText(
    label || `Point de sauvegarde v${nextVersionNumber}`,
    150,
  );

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
  versionId: number,
): Promise<IndependentSiteProjectDto> {
  const versions = await listIndependentSiteVersions(ownerUserId, siteId);
  const target = versions.find((v) => v.id === versionId);
  if (!target) {
    throw new Error("INDEPENDENT_SITE_VERSION_NOT_FOUND");
  }

  const restored = await saveIndependentSiteProject(ownerUserId, {
    siteId,
    title: target.snapshot.title,
    siteType: target.snapshot.siteType,
    theme: target.snapshot.theme,
    navigation: target.snapshot.navigation,
    pages: target.snapshot.pages,
    reusableBlocks: target.snapshot.reusableBlocks,
    createVersionLabel: `Restauration de v${target.versionNumber} (${target.label})`,
  });

  recordIndependentPublicationLog({
    siteId,
    ownerUserId,
    action: "restore_version",
    versionNumber: target.versionNumber,
    summary: `Version v${target.versionNumber} (« ${target.label} ») restaurée dans l’espace de travail.`,
  });

  return restored;
}

// ---------------------------------------------------------------------------
// Bibliothèque Personnelle de Médias par Projet
// ---------------------------------------------------------------------------

export async function listIndependentSiteMedia(
  ownerUserId: number,
  siteId: number,
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
      and(
        eq(independentSiteMedia.siteId, siteId),
        eq(independentSiteMedia.ownerUserId, ownerUserId),
      ),
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
    transforms: normalizeImageTransforms(
      safeJsonParse(row.transformsJson, DEFAULT_IMAGE_TRANSFORMS),
    ),
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
  },
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
  transforms: Partial<IndependentImageTransforms>,
): Promise<IndependentSiteMediaDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  const normalized = normalizeImageTransforms(transforms);

  const db = await getDb();
  if (!db) {
    const list = memoryMedia.get(siteId) ?? [];
    const index = list.findIndex(
      (m) => m.id === mediaId && m.ownerUserId === ownerUserId,
    );
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
        eq(independentSiteMedia.ownerUserId, ownerUserId),
      ),
    );

  const all = await listIndependentSiteMedia(ownerUserId, siteId);
  const found = all.find((m) => m.id === mediaId);
  if (!found) throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
  return found;
}

export async function deleteIndependentSiteMedia(
  ownerUserId: number,
  siteId: number,
  mediaId: number,
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
      list.filter((m) => !(m.id === mediaId && m.ownerUserId === ownerUserId)),
    );
    return { deleted: true };
  }

  await db
    .delete(independentSiteMedia)
    .where(
      and(
        eq(independentSiteMedia.id, mediaId),
        eq(independentSiteMedia.siteId, siteId),
        eq(independentSiteMedia.ownerUserId, ownerUserId),
      ),
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
  siteId: number,
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
        eq(independentSiteDomains.ownerUserId, ownerUserId),
      ),
    );
  return rows.map(formatDomainDto);
}

export async function addIndependentSiteDomain(
  ownerUserId: number,
  siteId: number,
  rawHostname: string,
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
  domainId: number,
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
  if (
    !txtRecords.some((record) => record.join("") === target.verificationToken)
  ) {
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
      domains.map((d) => (d.id === domainId ? updated : d)),
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
        eq(independentSiteDomains.ownerUserId, ownerUserId),
      ),
    );

  const refreshed = await listIndependentSiteDomains(ownerUserId, siteId);
  const found = refreshed.find((d) => d.id === domainId);
  if (!found) throw new Error("INDEPENDENT_SITE_DOMAIN_NOT_FOUND");
  return found;
}

export async function removeIndependentSiteDomain(
  ownerUserId: number,
  siteId: number,
  domainId: number,
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
      list.filter((d) => !(d.id === domainId && d.ownerUserId === ownerUserId)),
    );
    return { removed: true };
  }

  await db
    .delete(independentSiteDomains)
    .where(
      and(
        eq(independentSiteDomains.id, domainId),
        eq(independentSiteDomains.siteId, siteId),
        eq(independentSiteDomains.ownerUserId, ownerUserId),
      ),
    );
  return { removed: true };
}

/**
 * Crée ou retourne le site de démonstration « Association familiale ATH VAHLOUL »
 * pour l’utilisateur courant, afin de démontrer un site associatif et familial complet sans boutique.
 */
export async function ensureAthVahloulDemoProject(
  ownerUserId: number,
): Promise<IndependentSiteProjectDto> {
  const existing = await listIndependentSiteProjects(ownerUserId);
  const found = existing.find(
    (site) =>
      site.templateId === ATH_VAHLOUL_DEMO_TEMPLATE_ID ||
      site.title.toLowerCase().includes("ath vahloul"),
  );
  if (found) {
    const repaired = repairKnownIndependentInternalLinks(found.pages);
    if (repaired.changes.length > 0) {
      return await saveIndependentSiteProject(ownerUserId, {
        siteId: found.id,
        pages: repaired.pages,
        createVersionLabel: "Réparation des anciens liens internes ATH VAHLOUL",
      });
    }
    return found;
  }

  return await createIndependentSiteProject(ownerUserId, {
    title: "Association familiale ATH VAHLOUL",
    siteType: "familial",
    slug: "association-familiale-ath-vahloul",
    templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  });
}

export async function repairKnownIndependentSiteLinks(
  userId: number,
  siteId: number,
): Promise<{ project: IndependentSiteProjectDto; changes: RepairedInternalLinkChange[] }> {
  const ownerUserId = await resolveIndependentSiteOwnerUserId(userId, siteId, "editor");
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  const repaired = repairKnownIndependentInternalLinks(project.pages);
  if (repaired.changes.length === 0) return { project, changes: [] };
  const saved = await saveIndependentSiteProject(ownerUserId, {
    siteId,
    pages: repaired.pages,
    createVersionLabel: "Réparation manuelle des anciens liens internes",
  });
  return { project: saved, changes: repaired.changes };
}

// ---------------------------------------------------------------------------
// PHASE 2 — Journal de Publication, Dépublication, Renommage & Remplacement Média,
//           Import/Export JSON Contrôlé & Collaboration Contrôlée (Liens d’aperçu privé)
// ---------------------------------------------------------------------------

export interface IndependentPublicationLogEntryDto {
  id: number;
  siteId: number;
  ownerUserId: number;
  action: "publish" | "unpublish" | "restore_version" | "import_json";
  authorLabel: string;
  versionNumber: number | null;
  summary: string;
  createdAt: string;
}

export interface IndependentCollaboratorPreviewShareDto {
  id: number;
  siteId: number;
  ownerUserId: number;
  token: string;
  collaboratorLabel: string;
  collaboratorEmail: string | null;
  permission: "read_only_preview";
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  previewPath: string;
}

const memoryPublicationLogs = new Map<
  number,
  IndependentPublicationLogEntryDto[]
>();
const memoryPreviewShares = new Map<
  number,
  IndependentCollaboratorPreviewShareDto[]
>();
let nextMemoryPubLogId = 12001;
let nextMemoryShareId = 15001;

export function recordIndependentPublicationLog(input: {
  siteId: number;
  ownerUserId: number;
  action: IndependentPublicationLogEntryDto["action"];
  authorLabel?: string;
  versionNumber?: number | null;
  summary: string;
}): IndependentPublicationLogEntryDto {
  const entry: IndependentPublicationLogEntryDto = {
    id: nextMemoryPubLogId++,
    siteId: input.siteId,
    ownerUserId: input.ownerUserId,
    action: input.action,
    authorLabel: sanitizeBuilderText(
      input.authorLabel || `Propriétaire #${input.ownerUserId}`,
      120,
    ),
    versionNumber: input.versionNumber ?? null,
    summary: sanitizeBuilderText(input.summary, 280),
    createdAt: new Date().toISOString(),
  };
  const current = memoryPublicationLogs.get(input.siteId) ?? [];
  memoryPublicationLogs.set(input.siteId, [entry, ...current]);
  return entry;
}

export async function listIndependentPublicationLogs(
  ownerUserId: number,
  siteId: number,
): Promise<IndependentPublicationLogEntryDto[]> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  const logs = memoryPublicationLogs.get(siteId) ?? [];
  if (logs.length === 0 && project.publishedAt) {
    return [
      {
        id: 1,
        siteId,
        ownerUserId,
        action: "publish",
        authorLabel: `Propriétaire #${ownerUserId}`,
        versionNumber: null,
        summary: `Site « ${project.title} » publié sur /sites/${project.slug}`,
        createdAt: project.publishedAt,
      },
    ];
  }
  return [...logs];
}

export async function unpublishIndependentSiteProject(
  ownerUserId: number,
  siteId: number,
  reason?: string,
): Promise<IndependentSiteProjectDto> {
  const current = await getIndependentSiteProject(ownerUserId, siteId);
  if (!current) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const nowIso = new Date().toISOString();
  const db = await getDb();
  if (!db) {
    const updated: IndependentSiteProjectDto = {
      ...current,
      status: "draft",
      publishedSnapshot: null,
      publishedAt: null,
      updatedAt: nowIso,
    };
    memorySites.set(siteId, updated);
    const ver = await createIndependentSiteVersion(
      ownerUserId,
      siteId,
      `Dépublication (${reason ? sanitizeBuilderText(reason, 80) : "retour en brouillon privé"})`,
    );
    recordIndependentPublicationLog({
      siteId,
      ownerUserId,
      action: "unpublish",
      versionNumber: ver.versionNumber,
      summary: `Site dépublié et repassé en brouillon privé (${
        reason
          ? sanitizeBuilderText(reason, 100)
          : "invisible sur /sites/" + current.slug
      }).`,
    });
    return JSON.parse(JSON.stringify(updated));
  }

  await db
    .update(independentSites)
    .set({
      status: "draft",
      publishedSnapshotJson: null,
      publishedAt: null,
    })
    .where(
      and(
        eq(independentSites.id, siteId),
        eq(independentSites.ownerUserId, ownerUserId),
      ),
    );

  const ver = await createIndependentSiteVersion(
    ownerUserId,
    siteId,
    `Dépublication (${reason ? sanitizeBuilderText(reason, 80) : "retour en brouillon privé"})`,
  );
  recordIndependentPublicationLog({
    siteId,
    ownerUserId,
    action: "unpublish",
    versionNumber: ver.versionNumber,
    summary: `Site dépublié et repassé en brouillon privé.`,
  });

  const reloaded = await getIndependentSiteProject(ownerUserId, siteId);
  if (!reloaded) throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  return reloaded;
}

export async function updateIndependentSiteMediaMetadata(
  ownerUserId: number,
  input: {
    siteId: number;
    mediaId: number;
    label?: string;
    altText?: string;
    newUrl?: string;
    replaceInPages?: boolean;
  },
): Promise<{
  media: IndependentSiteMediaDto;
  replacedOccurrencesCount: number;
}> {
  assertNoSecretsInIndependentSite(input);
  const project = await getIndependentSiteProject(ownerUserId, input.siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const allMedia = await listIndependentSiteMedia(ownerUserId, input.siteId);
  const target = allMedia.find((m) => m.id === input.mediaId);
  if (!target) {
    throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
  }

  const nextLabel = input.label
    ? sanitizeBuilderText(input.label, 150)
    : target.label;
  const nextAlt = input.altText
    ? sanitizeBuilderText(input.altText, 220)
    : target.altText;
  const nextUrl = input.newUrl
    ? sanitizeBuilderImageSrc(input.newUrl)
    : target.url;

  let replacedOccurrencesCount = 0;
  if (
    input.replaceInPages &&
    input.newUrl &&
    input.newUrl.trim() !== target.url
  ) {
    const oldUrl = target.url;
    const updatedPages = project.pages.map((page) => {
      let html = page.html || "";
      if (html.includes(oldUrl)) {
        const parts = html.split(oldUrl);
        replacedOccurrencesCount += parts.length - 1;
        html = parts.join(nextUrl);
      }
      return {
        ...page,
        html: sanitizeIndependentHtml(html),
        socialImageUrl:
          page.socialImageUrl === oldUrl ? nextUrl : page.socialImageUrl,
      };
    });
    if (replacedOccurrencesCount > 0) {
      await saveIndependentSiteProject(ownerUserId, {
        siteId: project.id,
        pages: updatedPages,
      });
    }
  }

  const db = await getDb();
  if (!db) {
    const list = memoryMedia.get(input.siteId) ?? [];
    const idx = list.findIndex(
      (m) => m.id === input.mediaId && m.ownerUserId === ownerUserId,
    );
    if (idx === -1) throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
    const updated: IndependentSiteMediaDto = {
      ...list[idx],
      label: nextLabel,
      altText: nextAlt,
      url: nextUrl,
    };
    const nextList = [...list];
    nextList[idx] = updated;
    memoryMedia.set(input.siteId, nextList);
    return {
      media: updated,
      replacedOccurrencesCount,
    };
  }

  await db
    .update(independentSiteMedia)
    .set({
      label: nextLabel,
      altText: nextAlt,
      url: nextUrl,
    })
    .where(
      and(
        eq(independentSiteMedia.id, input.mediaId),
        eq(independentSiteMedia.siteId, input.siteId),
        eq(independentSiteMedia.ownerUserId, ownerUserId),
      ),
    );

  const refreshed = await listIndependentSiteMedia(ownerUserId, input.siteId);
  const found = refreshed.find((m) => m.id === input.mediaId);
  if (!found) throw new Error("INDEPENDENT_SITE_MEDIA_NOT_FOUND");
  return {
    media: found,
    replacedOccurrencesCount,
  };
}

// ---------------------------------------------------------------------------
// Collaboration Contrôlée : Liens d'aperçu privé en lecture seule avec expiration et révocation
// ---------------------------------------------------------------------------

export async function createIndependentCollaboratorPreviewShare(
  ownerUserId: number,
  input: {
    siteId: number;
    collaboratorLabel: string;
    collaboratorEmail?: string | null;
    expiresInHours?: number;
  },
): Promise<IndependentCollaboratorPreviewShareDto> {
  const project = await getIndependentSiteProject(ownerUserId, input.siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }

  const hours = Math.max(1, Math.min(24 * 30, input.expiresInHours ?? 72));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + hours * 3600 * 1000).toISOString();
  const token = `mpreview_${project.id}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  const cleanLabel =
    sanitizeBuilderText(input.collaboratorLabel || "Relecteur invité", 120) ||
    "Relecteur invité";
  const cleanEmail = input.collaboratorEmail
    ? sanitizeBuilderText(input.collaboratorEmail, 160)
    : null;

  const share: IndependentCollaboratorPreviewShareDto = {
    id: nextMemoryShareId++,
    siteId: project.id,
    ownerUserId,
    token,
    collaboratorLabel: cleanLabel,
    collaboratorEmail: cleanEmail,
    permission: "read_only_preview",
    expiresAt,
    revokedAt: null,
    createdAt: now.toISOString(),
    previewPath: `/constructeur-sites/apercu/${project.slug}?previewToken=${encodeURIComponent(token)}`,
  };

  const current = memoryPreviewShares.get(project.id) ?? [];
  memoryPreviewShares.set(project.id, [share, ...current]);
  return share;
}

export async function listIndependentCollaboratorPreviewShares(
  ownerUserId: number,
  siteId: number,
): Promise<IndependentCollaboratorPreviewShareDto[]> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  return [...(memoryPreviewShares.get(siteId) ?? [])];
}

export async function revokeIndependentCollaboratorPreviewShare(
  ownerUserId: number,
  siteId: number,
  shareId: number,
): Promise<IndependentCollaboratorPreviewShareDto> {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  const current = memoryPreviewShares.get(siteId) ?? [];
  const idx = current.findIndex(
    (s) => s.id === shareId && s.ownerUserId === ownerUserId,
  );
  if (idx === -1) {
    throw new Error("INDEPENDENT_SITE_SHARE_NOT_FOUND");
  }
  const updated: IndependentCollaboratorPreviewShareDto = {
    ...current[idx],
    revokedAt: new Date().toISOString(),
  };
  const next = [...current];
  next[idx] = updated;
  memoryPreviewShares.set(siteId, next);
  return updated;
}

export function verifyIndependentCollaboratorPreviewToken(
  siteId: number,
  token: string | null | undefined,
  nowIso = new Date().toISOString(),
): {
  valid: boolean;
  share?: IndependentCollaboratorPreviewShareDto;
  reason?: "missing" | "not_found" | "revoked" | "expired";
} {
  if (!token || !token.trim()) {
    return { valid: false, reason: "missing" };
  }
  const list = memoryPreviewShares.get(siteId) ?? [];
  const found = list.find((s) => s.token === token.trim());
  if (!found) {
    return { valid: false, reason: "not_found" };
  }
  if (found.revokedAt) {
    return { valid: false, share: found, reason: "revoked" };
  }
  if (new Date(found.expiresAt).getTime() <= new Date(nowIso).getTime()) {
    return { valid: false, share: found, reason: "expired" };
  }
  return { valid: true, share: found };
}

export async function exportIndependentSiteProjectJson(
  ownerUserId: number,
  siteId: number,
) {
  const project = await getIndependentSiteProject(ownerUserId, siteId);
  if (!project) {
    throw new Error("INDEPENDENT_SITE_NOT_FOUND");
  }
  return exportIndependentSiteProjectToJson({
    title: project.title,
    slug: project.slug,
    siteType: project.siteType,
    templateId: project.templateId,
    theme: project.theme,
    navigation: project.navigation,
    pages: project.pages,
    reusableBlocks: project.reusableBlocks,
  });
}

export async function importIndependentSiteProjectJson(
  ownerUserId: number,
  input: {
    siteId?: number | null;
    rawJson: string;
    newTitle?: string;
  },
): Promise<IndependentSiteProjectDto> {
  const validation = validateAndSanitizeIndependentSiteImport(input.rawJson);
  if (!validation.valid || !validation.sanitizedPackage) {
    throw new Error(
      `INDEPENDENT_SITE_IMPORT_REJECTED: ${validation.error || "Format invalide"}`,
    );
  }

  const imported = validation.sanitizedPackage.project;
  const targetTitle = sanitizeBuilderText(
    input.newTitle?.trim() || imported.title,
    160,
  );

  if (input.siteId) {
    const existing = await getIndependentSiteProject(ownerUserId, input.siteId);
    if (!existing) {
      throw new Error("INDEPENDENT_SITE_NOT_FOUND");
    }
    const updated = await saveIndependentSiteProject(ownerUserId, {
      siteId: existing.id,
      title: targetTitle,
      siteType: imported.siteType,
      theme: imported.theme,
      navigation: imported.navigation,
      pages: imported.pages,
      reusableBlocks: imported.reusableBlocks,
      createVersionLabel: `Import JSON (${targetTitle})`,
    });
    recordIndependentPublicationLog({
      siteId: existing.id,
      ownerUserId,
      action: "import_json",
      summary: `Import JSON contrôlé appliqué sur le projet (${imported.pages.length} page(s), ${imported.reusableBlocks.length} bloc(s)).`,
    });
    return updated;
  }

  const created = await createIndependentSiteProject(ownerUserId, {
    title: targetTitle,
    siteType: imported.siteType,
    slug: imported.slug,
    templateId: imported.templateId,
  });

  const saved = await saveIndependentSiteProject(ownerUserId, {
    siteId: created.id,
    title: targetTitle,
    siteType: imported.siteType,
    theme: imported.theme,
    navigation: imported.navigation,
    pages: imported.pages,
    reusableBlocks: imported.reusableBlocks,
    createVersionLabel: `Import JSON initial (${targetTitle})`,
  });

  recordIndependentPublicationLog({
    siteId: created.id,
    ownerUserId,
    action: "import_json",
    summary: `Nouveau projet créé depuis un import JSON contrôlé (${imported.pages.length} page(s)).`,
  });

  return saved;
}
