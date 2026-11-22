import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_BUILDER_HELP_GUIDES,
  INDEPENDENT_BUILDER_LIBRARY_TABS,
  INDEPENDENT_BUILDER_MODULES,
  INDEPENDENT_NAV_AND_FOOTER_PRESETS,
  INDEPENDENT_PAGE_SOCLES,
  INDEPENDENT_PROJECT_MODE_OPTIONS,
  INDEPENDENT_SITE_TEMPLATES,
  INDEPENDENT_SITE_TYPE_OPTIONS,
  RESPONSIVE_DEVICE_PRESETS,
  RESPONSIVE_VIEWPORTS,
} from "../shared/isolatedSiteBuilder";
import { platformProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addIndependentSiteDomain,
  addIndependentSiteMedia,
  createIndependentCollaboratorPreviewShare,
  createIndependentSiteProject,
  createIndependentSiteVersion,
  deleteIndependentSiteMedia,
  duplicateIndependentSiteProject,
  ensureAthVahloulDemoProject,
  exportIndependentSiteProjectJson,
  getIndependentSiteProject,
  getPublicIndependentSiteBySlug,
  importIndependentSiteProjectJson,
  listIndependentCollaboratorPreviewShares,
  listIndependentPublicationLogs,
  listIndependentSiteDomains,
  listIndependentSiteMedia,
  listIndependentSiteProjects,
  listIndependentSiteProjectsAccessible,
  listIndependentSiteAccess,
  resolveIndependentSiteAccess,
  inviteIndependentSiteAccess,
  revokeIndependentSiteAccess,
  updateIndependentSiteAccessRole,
  inspectIndependentSiteInvitation,
  acceptIndependentSiteInvitation,
  assertIndependentSiteAccess,
  resolveIndependentSiteOwnerUserId,
  listIndependentSiteVersions,
  publishIndependentSiteProject,
  repairKnownIndependentSiteLinks,
  removeIndependentSiteDomain,
  restoreIndependentSiteVersion,
  revokeIndependentCollaboratorPreviewShare,
  saveIndependentSiteProject,
  unpublishIndependentSiteProject,
  updateIndependentSiteMediaMetadata,
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
  socialImageUrl: z.string().max(2048).optional(),
  indexable: z.boolean().optional(),
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
      }),
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
  getCatalog: platformProcedure.query(() => ({
    siteTypes: INDEPENDENT_SITE_TYPE_OPTIONS,
    projectModes: INDEPENDENT_PROJECT_MODE_OPTIONS,
    helpGuides: INDEPENDENT_BUILDER_HELP_GUIDES,
    libraryTabs: INDEPENDENT_BUILDER_LIBRARY_TABS,
    viewports: RESPONSIVE_VIEWPORTS,
    devicePresets: RESPONSIVE_DEVICE_PRESETS,
    blocks: INDEPENDENT_BUILDER_BLOCKS,
    modules: INDEPENDENT_BUILDER_MODULES,
    socles: INDEPENDENT_PAGE_SOCLES,
    templates: INDEPENDENT_SITE_TEMPLATES,
    navAndFooterPresets: INDEPENDENT_NAV_AND_FOOTER_PRESETS,
  })),

  getPublicSiteBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(120),
        previewMode: z.boolean().optional(),
        previewToken: z.string().max(200).nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const site = await getPublicIndependentSiteBySlug(input.slug, {
        allowDraftForOwnerUserId:
          input.previewMode !== false ? ctx.user?.id : undefined,
        previewToken:
          input.previewMode !== false ? input.previewToken : undefined,
      });
      if (!site) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Ce site indépendant est introuvable ou n’est pas encore publié.",
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
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return await listIndependentSiteProjectsAccessible(ctx.user.id, input);
    }),

  getProject: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
        const project = await getIndependentSiteProject(
          await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
          input.siteId,
        );
        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Projet de site indépendant introuvable ou accès non autorisé.",
          });
        }
        return project;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        if (
          err instanceof Error &&
          err.message === "INDEPENDENT_SITE_ACCESS_DENIED"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Accès refusé à ce projet de site indépendant.",
          });
        }
        throw err;
      }
    }),

  ensureAthVahloulDemo: platformProcedure.mutation(async ({ ctx }) => {
    return await ensureAthVahloulDemoProject(ctx.user.id);
  }),

  createProject: platformProcedure
    .input(
      z.object({
        title: z.string().min(1).max(160),
        siteType: siteTypeSchema.optional(),
        slug: z.string().max(96).optional(),
        templateId: z.string().max(80).nullable().optional(),
        socleId: z.string().max(80).nullable().optional(),
      }),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
        return await saveIndependentSiteProject(
          await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
          input,
        );
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const msg = err instanceof Error ? err.message : "Erreur de sauvegarde";
        if (msg === "INDEPENDENT_SITE_ACCESS_DENIED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Accès refusé pour la sauvegarde de ce projet.",
          });
        }
        if (msg === "INDEPENDENT_SITE_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Projet introuvable.",
          });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  repairKnownInternalLinks: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
        return await repairKnownIndependentSiteLinks(ctx.user.id, input.siteId);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const msg =
          err instanceof Error
            ? err.message
            : "Impossible de réparer les liens internes.";
        if (msg === "INDEPENDENT_SITE_ACCESS_DENIED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Accès refusé : vous n’avez pas l’autorisation de réparer les liens de ce site.",
          });
        }
        if (msg === "INDEPENDENT_SITE_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Projet de site indépendant introuvable.",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: msg,
        });
      }
    }),

  duplicateProject: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        newTitle: z.string().min(1).max(160).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
        return await duplicateIndependentSiteProject(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "admin",
          ),
          input.siteId,
          input.newTitle,
        );
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Projet à dupliquer introuvable.",
        });
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        status: siteStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
        return await updateIndependentSiteStatus(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "admin",
          ),
          input.siteId,
          input.status,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "Impossible de modifier le statut.",
        });
      }
    }),

  publishSite: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
        return await publishIndependentSiteProject(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "admin",
          ),
          input.siteId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Échec de la publication.",
        });
      }
    }),

  unpublishSite: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        reason: z.string().max(140).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
        return await unpublishIndependentSiteProject(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "admin",
          ),
          input.siteId,
          input.reason,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Échec de la dépublication.",
        });
      }
    }),

  listPublicationLogs: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await listIndependentPublicationLogs(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
      );
    }),

  exportProjectJson: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await exportIndependentSiteProjectJson(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input.siteId,
      );
    }),

  importProjectJson: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive().nullable().optional(),
        rawJson: z.string().min(2).max(2_000_000),
        newTitle: z.string().max(160).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.siteId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Un import doit cibler un site autorisé.",
          });
        }
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
        return await importIndependentSiteProjectJson(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "admin",
          ),
          input,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Import JSON refusé.",
        });
      }
    }),

  listCollaboratorShares: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await listIndependentCollaboratorPreviewShares(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
      );
    }),

  createCollaboratorShare: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        collaboratorLabel: z.string().min(1).max(120),
        collaboratorEmail: z.string().max(160).nullable().optional(),
        expiresInHours: z.number().int().min(1).max(720).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await createIndependentCollaboratorPreviewShare(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input,
      );
    }),

  revokeCollaboratorShare: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        shareId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await revokeIndependentCollaboratorPreviewShare(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
        input.shareId,
      );
    }),

  getAccessRole: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const access = await resolveIndependentSiteAccess(
        ctx.user.id,
        input.siteId,
      );
      if (!access)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès limité à ce site.",
        });
      return { siteId: input.siteId, role: access.role };
    }),
  listAccess: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "owner");
      return listIndependentSiteAccess(ctx.user.id, input.siteId);
    }),
  inviteAccess: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        email: z.string().email(),
        role: z.enum(["admin", "editor"]).optional(),
        expiresInHours: z.number().int().min(1).max(720).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      inviteIndependentSiteAccess(ctx.user.id, input),
    ),
  revokeAccess: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        memberId: z.number().int().positive(),
      }),
    )
    .mutation(({ ctx, input }) =>
      revokeIndependentSiteAccess(ctx.user.id, input.siteId, input.memberId),
    ),
  updateAccessRole: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        memberId: z.number().int().positive(),
        role: z.enum(["admin", "editor"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateIndependentSiteAccessRole(
        ctx.user.id,
        input.siteId,
        input.memberId,
        input.role,
      ),
    ),
  inspectSiteInvitation: publicProcedure
    .input(z.object({ token: z.string().min(1).max(200) }))
    .query(({ ctx, input }) =>
      inspectIndependentSiteInvitation(input.token, ctx.user?.email ?? null),
    ),
  acceptSiteInvitation: protectedProcedure
    .input(z.object({ token: z.string().min(20).max(200) }))
    .mutation(({ ctx, input }) => {
      if (!ctx.user.email)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le compte connecté doit avoir une adresse e-mail.",
        });
      return acceptIndependentSiteInvitation(
        ctx.user.id,
        input.token,
        ctx.user.email,
      );
    }),
  listVersions: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await listIndependentSiteVersions(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
      );
    }),

  createVersion: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        label: z.string().max(150).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await createIndependentSiteVersion(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
        input.label,
      );
    }),

  restoreVersion: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        versionId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "admin");
      return await restoreIndependentSiteVersion(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "admin",
        ),
        input.siteId,
        input.versionId,
      );
    }),

  listMedia: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
      return await listIndependentSiteMedia(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input.siteId,
      );
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
      return await addIndependentSiteMedia(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input,
      );
    }),

  updateMediaMetadata: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        mediaId: z.number().int().positive(),
        label: z.string().min(1).max(160).optional(),
        altText: z.string().min(1).max(240).optional(),
        newUrl: z.string().min(1).optional(),
        replaceInPages: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
      return await updateIndependentSiteMediaMetadata(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input,
      );
    }),

  updateMediaTransforms: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        mediaId: z.number().int().positive(),
        transforms: imageTransformsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
      return await updateIndependentSiteMediaTransforms(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input.siteId,
        input.mediaId,
        input.transforms,
      );
    }),

  deleteMedia: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        mediaId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "editor");
      return await deleteIndependentSiteMedia(
        await resolveIndependentSiteOwnerUserId(ctx.user.id, input.siteId),
        input.siteId,
        input.mediaId,
      );
    }),

  listDomains: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "owner");
      return await listIndependentSiteDomains(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "owner",
        ),
        input.siteId,
      );
    }),

  addDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        hostname: z.string().min(4).max(253),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "owner");
        return await addIndependentSiteDomain(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "owner",
          ),
          input.siteId,
          input.hostname,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "Domaine personnalisé invalide.",
        });
      }
    }),

  verifyDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        domainId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await assertIndependentSiteAccess(ctx.user.id, input.siteId, "owner");
        return await verifyIndependentSiteDomain(
          await resolveIndependentSiteOwnerUserId(
            ctx.user.id,
            input.siteId,
            "owner",
          ),
          input.siteId,
          input.domainId,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error
              ? err.message
              : "Le domaine n’est pas encore vérifié par DNS.",
        });
      }
    }),

  removeDomain: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        domainId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertIndependentSiteAccess(ctx.user.id, input.siteId, "owner");
      return await removeIndependentSiteDomain(
        await resolveIndependentSiteOwnerUserId(
          ctx.user.id,
          input.siteId,
          "owner",
        ),
        input.siteId,
        input.domainId,
      );
    }),
});
