import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_SITE_TEMPLATES,
  INDEPENDENT_SITE_TYPE_OPTIONS,
  RESPONSIVE_VIEWPORTS,
} from "../shared/isolatedSiteBuilder";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addIndependentSiteDomain,
  addIndependentSiteMedia,
  createIndependentSiteProject,
  createIndependentSiteVersion,
  deleteIndependentSiteMedia,
  duplicateIndependentSiteProject,
  ensureAthVahloulDemoProject,
  getIndependentSiteProject,
  getPublicIndependentSiteBySlug,
  listIndependentSiteDomains,
  listIndependentSiteMedia,
  listIndependentSiteProjects,
  listIndependentSiteVersions,
  publishIndependentSiteProject,
  removeIndependentSiteDomain,
  restoreIndependentSiteVersion,
  saveIndependentSiteProject,
  updateIndependentSiteMediaTransforms,
  updateIndependentSiteStatus,
  verifyIndependentSiteDomain,
} from "./isolatedSiteBuilderDb";

const siteTypeSchema = z.enum([
  "vitrine",
  "association",
  "familial",
  "professionnel",
  "personnel",
  "evenementiel",
  "institutionnel",
  "services",
]);

const siteStatusSchema = z.enum(["draft", "published", "archived"]);

const pageSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(120),
  parentPageId: z.string().max(80).nullable(),
  showInMenu: z.boolean(),
  menuOrder: z.number().int().min(0).max(500),
  visibility: z.enum(["public", "members", "private"]),
  seoTitle: z.string().max(180),
  seoDescription: z.string().max(320),
  html: z.string(),
  css: z.string(),
  gjsProjectData: z.record(z.string(), z.unknown()).optional(),
});

const menuItemSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(240),
  pageId: z.string().max(80).optional(),
  children: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(120),
        href: z.string().min(1).max(240),
        pageId: z.string().max(80).optional(),
      })
    )
    .optional(),
});

const themeSchema = z.object({
  primaryColor: z.string().min(3).max(32),
  accentColor: z.string().min(3).max(32),
  backgroundColor: z.string().min(3).max(32),
  headingFont: z.string().min(2).max(120),
  bodyFont: z.string().min(2).max(120),
});

const reusableBlockSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(140),
  category: z.string().min(1).max(80),
  html: z.string().min(1),
  createdAt: z.string(),
});

const imageTransformsSchema = z.object({
  rotationDeg: z.number().min(-180).max(180).optional(),
  skewXDeg: z.number().min(-45).max(45).optional(),
  skewYDeg: z.number().min(-45).max(45).optional(),
  flipHorizontal: z.boolean().optional(),
  flipVertical: z.boolean().optional(),
  scalePercent: z.number().min(25).max(250).optional(),
  offsetX: z.number().min(-400).max(400).optional(),
  offsetY: z.number().min(-400).max(400).optional(),
  widthPx: z.number().nullable().optional(),
  heightPx: z.number().nullable().optional(),
  borderRadiusPx: z.number().min(0).max(999).optional(),
  objectFit: z.enum(["cover", "contain", "fill"]).optional(),
});

export const isolatedSiteBuilderRouter = router({
  getCatalog: publicProcedure.query(() => ({
    siteTypes: INDEPENDENT_SITE_TYPE_OPTIONS,
    libraryTabs: INDEPENDENT_BUILDER_LIBRARY_TABS,
    viewports: RESPONSIVE_VIEWPORTS,
    blocks: INDEPENDENT_BUILDER_BLOCKS,
    modules: INDEPENDENT_BUILDER_MODULES,
    socles: INDEPENDENT_PAGE_SOCLES,
    templates: INDEPENDENT_SITE_TEMPLATES,
  })),

  getPublicSiteBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(120) }))
    .query(async ({ ctx, input }) => {
      const site = await getPublicIndependentSiteBySlug(input.slug, {
        allowDraftForOwnerUserId: ctx.user?.id,
      });
      if (!site) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ce site indépendant est introuvable ou n’est pas encore publié.",
        });
      }
      return site;
    }),

  listProjects: protectedProcedure
    .input(
      z
        .object({
          status: siteStatusSchema.optional(),
          siteType: siteTypeSchema.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await listIndependentSiteProjects(ctx.user.id, input);
    }),

  getProject: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const project = await getIndependentSiteProject(ctx.user.id, input.siteId);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Projet de site indépendant introuvable ou accès non autorisé.",
        });
      }
      return project;
    }),

  ensureAthVahloulDemo: protectedProcedure.mutation(async ({ ctx }) => {
    return await ensureAthVahloulDemoProject(ctx.user.id);
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(160),
        siteType: siteTypeSchema.optional(),
        slug: z.string().max(96).optional(),
        templateId: z.string().max(80).nullable().optional(),
        socleId: z.string().max(80).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createIndependentSiteProject(ctx.user.id, input);
    }),

  saveProject: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        title: z.string().min(1).max(160).optional(),
        siteType: siteTypeSchema.optional(),
        theme: themeSchema.optional(),
        navigation: z.array(menuItemSchema).optional(),
        pages: z.array(pageSchema).optional(),
        reusableBlocks: z.array(reusableBlockSchema).optional(),
        createVersionLabel: z.string().max(150).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await saveIndependentSiteProject(ctx.user.id, input);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur de sauvegarde";
        if (msg === "INDEPENDENT_SITE_NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Projet introuvable." });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  duplicateProject: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        newTitle: z.string().min(1).max(160).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await duplicateIndependentSiteProject(ctx.user.id, input.siteId, input.newTitle);
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Projet à dupliquer introuvable." });
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        status: siteStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateIndependentSiteStatus(ctx.user.id, input.siteId, input.status);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Impossible de modifier le statut.",
        });
      }
    }),

  publishSite: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await publishIndependentSiteProject(ctx.user.id, input.siteId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Échec de la publication.",
        });
      }
    }),

  listVersions: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return await listIndependentSiteVersions(ctx.user.id, input.siteId);
    }),

  createVersion: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        label: z.string().max(150).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createIndependentSiteVersion(ctx.user.id, input.siteId, input.label);
    }),

  restoreVersion: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        versionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await restoreIndependentSiteVersion(ctx.user.id, input.siteId, input.versionId);
    }),

  listMedia: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return await listIndependentSiteMedia(ctx.user.id, input.siteId);
    }),

  addMedia: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        label: z.string().min(1).max(160),
        altText: z.string().min(1).max(240),
        url: z.string().min(1),
        mimeType: z.string().max(64).optional(),
        transforms: imageTransformsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await addIndependentSiteMedia(ctx.user.id, input);
    }),

  updateMediaTransforms: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        mediaId: z.number().int().positive(),
        transforms: imageTransformsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await updateIndependentSiteMediaTransforms(
        ctx.user.id,
        input.siteId,
        input.mediaId,
        input.transforms
      );
    }),

  deleteMedia: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        mediaId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await deleteIndependentSiteMedia(ctx.user.id, input.siteId, input.mediaId);
    }),

  listDomains: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return await listIndependentSiteDomains(ctx.user.id, input.siteId);
    }),

  addDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        hostname: z.string().min(4).max(253),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await addIndependentSiteDomain(ctx.user.id, input.siteId, input.hostname);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Domaine personnalisé invalide.",
        });
      }
    }),

  verifyDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        domainId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await verifyIndependentSiteDomain(ctx.user.id, input.siteId, input.domainId);
    }),

  removeDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        domainId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await removeIndependentSiteDomain(ctx.user.id, input.siteId, input.domainId);
    }),
});
