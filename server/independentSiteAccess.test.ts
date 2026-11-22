import { describe, expect, it } from "vitest";
import {
  acceptIndependentSiteInvitation,
  assertIndependentSiteAccess,
  createIndependentSiteProject,
  getIndependentSiteProject,
  inspectIndependentSiteInvitation,
  inviteIndependentSiteAccess,
  listIndependentSiteProjectsAccessible,
  listIndependentSiteAccess,
  revokeIndependentSiteAccess,
  updateIndependentSiteAccessRole,
} from "./isolatedSiteBuilderDb";
import {
  ATH_VAHLOUL_DEMO_TEMPLATE_ID,
  INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE,
  INDEPENDENT_SITE_ROLE_PRESENTATIONS,
  formatIndependentInvitationErrorMessage,
  formatIndependentInvitationStatusNotice,
  getIndependentSiteRolePresentation,
  sanitizeIndependentAdministrationReturnTo,
  verifyIndependentInternalLinks,
} from "../shared/isolatedSiteBuilder";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { isolatedSiteBuilderRouter } from "./isolatedSiteBuilderRouter";
import type { TrpcContext } from "./_core/context";
import {
  CLIENT_ADMIN_FIRST_LOGIN_STEPS,
  CLIENT_ADMIN_ROLE_MATRIX,
  CLIENT_ADMIN_SPACE_DISTINCTIONS,
  appendClientSectionHtml,
  buildClientPreviewSrcDoc,
  formatClientMemberStatus,
  formatClientStatusSummary,
  readFirstHtmlImage,
  readFirstHtmlTag,
  replaceFirstHtmlImage,
  replaceFirstHtmlTag,
} from "../client/src/pages/site-builder/clientAdminHelpers";
import { BUILDER_GUIDE_CONFIG } from "../client/src/components/site-guides/builderGuideContent";
import {
  CLIENT_GUIDE_CONFIG,
  CLIENT_ISOLATION_NOTICE,
} from "../client/src/components/site-guides/clientGuideContent";

function makeCaller(user: {
  id: number;
  email: string;
  role?: "admin" | "user";
} | null) {
  const ctx = {
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: user
      ? ({
          id: user.id,
          openId: `test-user-${user.id}`,
          name: `User ${user.id}`,
          email: user.email,
          role: user.role ?? "user",
          accountStatus: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as unknown as TrpcContext["user"])
      : null,
  } as TrpcContext;
  return isolatedSiteBuilderRouter.createCaller(ctx);
}

describe("independent site access isolation", () => {
  it("keeps sites isolated and lets an invited editor access only the assigned site", async () => {
    const siteA = await createIndependentSiteProject(9101, { title: "Site A" });
    const siteB = await createIndependentSiteProject(9202, { title: "Site B" });
    const invitation = await inviteIndependentSiteAccess(9101, {
      siteId: siteA.id,
      email: "editor@example.test",
      role: "editor",
    });
    expect(invitation.developmentOnlyToken).toBeTypeOf("string");
    await expect(
      acceptIndependentSiteInvitation(
        9303,
        invitation.developmentOnlyToken!,
        "wrong@example.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID");
    const accepted = await acceptIndependentSiteInvitation(
      9303,
      invitation.developmentOnlyToken!,
      "EDITOR@example.test",
    );
    expect(accepted).toMatchObject({
      siteId: siteA.id,
      role: "editor",
      status: "active",
    });
    await expect(
      acceptIndependentSiteInvitation(
        9303,
        invitation.developmentOnlyToken!,
        "EDITOR@example.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID");
    expect(await getIndependentSiteProject(9303, siteA.id)).toBeNull();
    await assertIndependentSiteAccess(9303, siteA.id, "editor");
    expect(await listIndependentSiteProjectsAccessible(9303)).toHaveLength(1);
    expect((await listIndependentSiteProjectsAccessible(9303))[0]?.id).toBe(
      siteA.id,
    );
    expect(await getIndependentSiteProject(9202, siteA.id)).toBeNull();
    expect(siteB.id).not.toBe(siteA.id);
  });

  it("allows admin content access but blocks editor publication and owner-only access changes", async () => {
    const site = await createIndependentSiteProject(9404, { title: "Roles" });
    const adminInvite = await inviteIndependentSiteAccess(9404, {
      siteId: site.id,
      email: "admin@example.test",
      role: "admin",
    });
    const admin = await acceptIndependentSiteInvitation(
      9505,
      adminInvite.developmentOnlyToken!,
      "admin@example.test",
    );
    expect(admin.role).toBe("admin");
    const editorInvite = await inviteIndependentSiteAccess(9404, {
      siteId: site.id,
      email: "editor2@example.test",
      role: "editor",
    });
    const editor = await acceptIndependentSiteInvitation(
      9606,
      editorInvite.developmentOnlyToken!,
      "editor2@example.test",
    );
    await expect(
      assertIndependentSiteAccess(9606, site.id, "admin"),
    ).rejects.toThrow();
    await expect(
      inviteIndependentSiteAccess(9606, {
        siteId: site.id,
        email: "blocked@example.test",
      }),
    ).rejects.toThrow();
    await expect(
      assertIndependentSiteAccess(9505, site.id, "admin"),
    ).resolves.toMatchObject({ role: "admin" });
    const members = await listIndependentSiteAccess(9404, site.id);
    const editorMember = members.find((m) => m.userId === 9606)!;
    await revokeIndependentSiteAccess(9404, site.id, editorMember.id);
    await expect(
      assertIndependentSiteAccess(9606, site.id, "editor"),
    ).rejects.toThrow();
    const adminMember = members.find((m) => m.userId === 9505)!;
    await updateIndependentSiteAccessRole(
      9404,
      site.id,
      adminMember.id,
      "editor",
    );
    expect(editor.status).toBe("active");
  });

  it("inspects invitations and reports clear UX diagnostics for valid, mismatched email, already used, revoked, expired, and unknown tokens", async () => {
    const site = await createIndependentSiteProject(9701, {
      title: "Association Villageoise",
    });

    // 1. Unknown token
    const notFound = await inspectIndependentSiteInvitation("unknown-token-1234567890");
    expect(notFound.status).toBe("not_found");
    expect(formatIndependentInvitationStatusNotice(notFound).canAccept).toBe(false);

    // 2. Valid invitation + email match vs mismatch
    const invite = await inviteIndependentSiteAccess(9701, {
      siteId: site.id,
      email: "president@village.test",
      role: "admin",
      expiresInHours: 48,
    });
    expect(invite.invitationPath).toContain("/constructeur-sites/invitation/");

    const validMatching = await inspectIndependentSiteInvitation(
      invite.developmentOnlyToken!,
      "PRESIDENT@village.test",
    );
    expect(validMatching.status).toBe("valid");
    expect(validMatching.siteTitle).toBe("Association Villageoise");
    expect(validMatching.role).toBe("admin");
    expect(validMatching.emailMatchesViewer).toBe(true);
    expect(
      formatIndependentInvitationStatusNotice(
        validMatching,
        "PRESIDENT@village.test",
      ).canAccept,
    ).toBe(true);

    const validMismatched = await inspectIndependentSiteInvitation(
      invite.developmentOnlyToken!,
      "autre@village.test",
    );
    expect(validMismatched.status).toBe("valid");
    expect(validMismatched.emailMatchesViewer).toBe(false);
    expect(
      formatIndependentInvitationStatusNotice(
        validMismatched,
        "autre@village.test",
      ).canAccept,
    ).toBe(false);

    // Accepting with wrong email throws specific code containing INDEPENDENT_SITE_INVITATION_INVALID
    await expect(
      acceptIndependentSiteInvitation(
        9702,
        invite.developmentOnlyToken!,
        "autre@village.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID:EMAIL_MISMATCH");

    expect(
      formatIndependentInvitationErrorMessage(
        new Error("INDEPENDENT_SITE_INVITATION_INVALID:EMAIL_MISMATCH"),
      ),
    ).toContain("adresse e-mail invitée");

    // 3. Accepting with matching email succeeds, and subsequent inspection reports "already_used"
    await acceptIndependentSiteInvitation(
      9702,
      invite.developmentOnlyToken!,
      "president@village.test",
    );
    const afterUse = await inspectIndependentSiteInvitation(
      invite.developmentOnlyToken!,
      "president@village.test",
    );
    expect(afterUse.status).toBe("already_used");
    await expect(
      acceptIndependentSiteInvitation(
        9702,
        invite.developmentOnlyToken!,
        "president@village.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID:ALREADY_USED");

    // 4. Revoked invitation reports "revoked"
    const revocableInvite = await inviteIndependentSiteAccess(9701, {
      siteId: site.id,
      email: "secretaire@village.test",
      role: "editor",
    });
    const members = await listIndependentSiteAccess(9701, site.id);
    const secretaireMember = members.find(
      (m) => m.email === "secretaire@village.test",
    )!;
    await revokeIndependentSiteAccess(9701, site.id, secretaireMember.id);

    const afterRevoke = await inspectIndependentSiteInvitation(
      revocableInvite.developmentOnlyToken!,
      "secretaire@village.test",
    );
    expect(afterRevoke.status).toBe("revoked");
    await expect(
      acceptIndependentSiteInvitation(
        9703,
        revocableInvite.developmentOnlyToken!,
        "secretaire@village.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID:REVOKED");

    // 5. Expired invitation reports "expired"
    const expiredInvite = await inviteIndependentSiteAccess(9701, {
      siteId: site.id,
      email: "tresorier@village.test",
      role: "editor",
      expiresInHours: -1,
    });
    const afterExpiry = await inspectIndependentSiteInvitation(
      expiredInvite.developmentOnlyToken!,
      "tresorier@village.test",
    );
    expect(afterExpiry.status).toBe("expired");
    await expect(
      acceptIndependentSiteInvitation(
        9704,
        expiredInvite.developmentOnlyToken!,
        "tresorier@village.test",
      ),
    ).rejects.toThrow("INDEPENDENT_SITE_INVITATION_INVALID:EXPIRED");
  });

  it("provides non-technical French role presentations and safe returnTo paths without boutique escape", () => {
    expect(getIndependentSiteRolePresentation("owner").shortLabel).toBe(
      "Propriétaire",
    );
    expect(getIndependentSiteRolePresentation("admin").shortLabel).toBe(
      "Administrateur",
    );
    expect(getIndependentSiteRolePresentation("editor").shortLabel).toBe(
      "Éditeur",
    );
    expect(
      INDEPENDENT_SITE_ROLE_PRESENTATIONS.editor.restrictedActions.join(" "),
    ).toContain("publier");
    expect(INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.steps).toHaveLength(4);
    expect(
      INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.ownershipTransferNotice.statusBadge,
    ).toContain("Protégé");

    // returnTo safety: keeps independent site routes and never falls back to /demarrer-boutique
    expect(sanitizeIndependentAdministrationReturnTo(undefined)).toBe(
      "/administration-site",
    );
    expect(
      sanitizeIndependentAdministrationReturnTo("/demarrer-boutique?plan=free"),
    ).toBe("/administration-site");
    expect(
      sanitizeIndependentAdministrationReturnTo(
        "/administration-site?siteSlug=association-familiale-ath-vahloul",
      ),
    ).toBe("/administration-site?siteSlug=association-familiale-ath-vahloul");
    expect(
      sanitizeIndependentAdministrationReturnTo(
        "/constructeur-sites?siteId=1042",
      ),
    ).toBe("/constructeur-sites?siteId=1042");
    expect(
      sanitizeIndependentAdministrationReturnTo(
        "/constructeur-sites?siteSlug=association-familiale-ath-vahloul",
      ),
    ).toBe("/constructeur-sites?siteSlug=association-familiale-ath-vahloul");
    expect(
      sanitizeIndependentAdministrationReturnTo(
        "/constructeur-sites/invitation/token_abc12345678901234567890",
      ),
    ).toBe("/constructeur-sites/invitation/token_abc12345678901234567890");
    expect(
      sanitizeIndependentAdministrationReturnTo(
        "https://mazighoshop.com/boutique",
      ),
    ).toBe("/administration-site");
  });

  it("enforces server-side siteId isolation and minimum editor role on repairKnownInternalLinks", async () => {
    const ownerAId = 9801;
    const ownerBId = 9802;
    const editorAId = 9803;
    const adminAId = 9804;
    const outsiderId = 9805;

    const siteA = await createIndependentSiteProject(ownerAId, {
      title: "Association familiale ATH VAHLOUL",
      siteType: "familial",
      slug: "ath-vahloul-rbac-test",
      templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
    });
    const siteB = await createIndependentSiteProject(ownerBId, {
      title: "Autre Association Privée",
      siteType: "association",
      slug: "autre-association-privee",
      templateId: ATH_VAHLOUL_DEMO_TEMPLATE_ID,
    });

    // Inviter et activer un Éditeur sur siteA uniquement
    const editorInvite = await inviteIndependentSiteAccess(ownerAId, {
      siteId: siteA.id,
      email: "editeur.ath@example.test",
      role: "editor",
    });
    await acceptIndependentSiteInvitation(
      editorAId,
      editorInvite.developmentOnlyToken!,
      "editeur.ath@example.test",
    );

    // Inviter et activer un Admin sur siteA uniquement
    const adminInvite = await inviteIndependentSiteAccess(ownerAId, {
      siteId: siteA.id,
      email: "admin.ath@example.test",
      role: "admin",
    });
    await acceptIndependentSiteInvitation(
      adminAId,
      adminInvite.developmentOnlyToken!,
      "admin.ath@example.test",
    );

    const editorCaller = makeCaller({
      id: editorAId,
      email: "editeur.ath@example.test",
    });
    const adminCaller = makeCaller({
      id: adminAId,
      email: "admin.ath@example.test",
    });
    const outsiderCaller = makeCaller({
      id: outsiderId,
      email: "client.externe@example.test",
    });
    const anonymousCaller = makeCaller(null);

    // 1. Appelant non authentifié -> UNAUTHORIZED
    await expect(
      anonymousCaller.repairKnownInternalLinks({ siteId: siteA.id }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    // 2. Utilisateur externe (client sans accès) -> FORBIDDEN
    await expect(
      outsiderCaller.repairKnownInternalLinks({ siteId: siteA.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      outsiderCaller.getProject({ siteId: siteA.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // 3. Isolation stricte par siteId : l'éditeur de siteA ne peut PAS réparer ni lire siteB -> FORBIDDEN
    await expect(
      editorCaller.repairKnownInternalLinks({ siteId: siteB.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      editorCaller.getProject({ siteId: siteB.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // 4. L'éditeur de siteA PEUT réparer les liens connus de siteA
    expect(verifyIndependentInternalLinks(siteA.pages).brokenLinks).toHaveLength(45);
    const repairedByEditor = await editorCaller.repairKnownInternalLinks({
      siteId: siteA.id,
    });
    expect(repairedByEditor.changes).toHaveLength(45);
    expect(
      verifyIndependentInternalLinks(repairedByEditor.project.pages).brokenLinks,
    ).toHaveLength(0);

    // 5. L'éditeur reste bloqué sur les actions réservées admin/owner (publishSite, listAccess)
    await expect(
      editorCaller.publishSite({ siteId: siteA.id }),
    ).rejects.toThrow();
    await expect(
      editorCaller.listAccess({ siteId: siteA.id }),
    ).rejects.toThrow();

    // 6. L'admin de siteA peut également appeler repairKnownInternalLinks sur siteA (idempotent -> 0 changes)
    const repairedByAdmin = await adminCaller.repairKnownInternalLinks({
      siteId: siteA.id,
    });
    expect(repairedByAdmin.changes).toHaveLength(0);

    // 7. Révocation de l'éditeur -> immédiatement FORBIDDEN sur siteA
    const members = await listIndependentSiteAccess(ownerAId, siteA.id);
    const editorMember = members.find(
      (m) => m.email === "editeur.ath@example.test",
    )!;
    await revokeIndependentSiteAccess(ownerAId, siteA.id, editorMember.id);
    await expect(
      editorCaller.repairKnownInternalLinks({ siteId: siteA.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("provides client admin UX helpers with working image replacement, clear statuses, and 3-role matrix", () => {
    const sampleHtml = `<section class="hero"><h1>Association familiale ATH VAHLOUL</h1><p>Texte initial de présentation.</p><img src="https://cdn.example.ch/photo-1.jpg" alt="Photo 1" /></section>`;

    expect(readFirstHtmlTag(sampleHtml, "h1")).toBe(
      "Association familiale ATH VAHLOUL",
    );
    expect(readFirstHtmlTag(sampleHtml, "p")).toBe(
      "Texte initial de présentation.",
    );
    expect(readFirstHtmlImage(sampleHtml)).toBe(
      "https://cdn.example.ch/photo-1.jpg",
    );

    const updatedH1 = replaceFirstHtmlTag(sampleHtml, "h1", "Bienvenue <ATH>");
    expect(updatedH1).toContain("Bienvenue &lt;ATH&gt;");

    const updatedImg = replaceFirstHtmlImage(
      sampleHtml,
      "https://cdn.example.ch/photo-2.webp",
      "Nouvelle photo",
    );
    expect(readFirstHtmlImage(updatedImg)).toBe(
      "https://cdn.example.ch/photo-2.webp",
    );
    expect(updatedImg).toContain('alt="Nouvelle photo"');

    const withNews = appendClientSectionHtml(sampleHtml, {
      kind: "actualite",
      title: "Assemblée générale",
      body: "Rendez-vous dimanche à 14h.",
    });
    expect(withNews).toContain("Actualité");
    expect(withNews).toContain("Assemblée générale");

    const previewDoc = buildClientPreviewSrcDoc({
      siteTitle: "Association familiale ATH VAHLOUL",
      pageTitle: "Accueil",
      html: withNews,
      css: ".hero { color: #111; }",
    });
    expect(previewDoc).toContain("<!doctype html>");
    expect(previewDoc).toContain("Association familiale ATH VAHLOUL");
    expect(previewDoc).toContain("Assemblée générale");

    expect(formatClientStatusSummary("draft", true, null)).toMatchObject({
      statusLabel: "Brouillon",
      saveStateLabel: "Modifications non enregistrées",
    });
    expect(
      formatClientStatusSummary("draft", false, "2026-06-01T10:00:00.000Z"),
    ).toMatchObject({
      statusLabel: "Brouillon",
      saveStateLabel: "Sauvegardé en brouillon",
    });
    expect(
      formatClientStatusSummary("published", false, "2026-06-01T10:00:00.000Z"),
    ).toMatchObject({
      statusLabel: "Publié",
      saveStateLabel: "Sauvegardé et en ligne",
    });
    expect(formatClientStatusSummary("archived", false, null)).toMatchObject({
      statusLabel: "Archivé",
      saveStateLabel: "Sauvegardé (archivé)",
    });

    expect(formatClientMemberStatus({ status: "active" }).label).toBe(
      "Accès actif",
    );
    expect(formatClientMemberStatus({ status: "invited" }).label).toBe(
      "Invitation en attente",
    );
    expect(formatClientMemberStatus({ status: "blocked" }).label).toBe(
      "Accès révoqué",
    );

    expect(CLIENT_ADMIN_SPACE_DISTINCTIONS).toHaveLength(3);
    expect(CLIENT_ADMIN_FIRST_LOGIN_STEPS).toHaveLength(3);

    expect(CLIENT_ADMIN_ROLE_MATRIX.map((r) => r.role)).toEqual([
      "owner",
      "admin",
      "editor",
    ]);
    for (const role of CLIENT_ADMIN_ROLE_MATRIX) {
      expect(role.canView.length).toBeGreaterThan(0);
      expect(role.canEdit.length).toBeGreaterThan(0);
      expect(role.cannotDo.length).toBeGreaterThan(0);
      expect(role.builderAccessNote.toLowerCase()).toContain("constructeur");
    }
  });

  it("keeps client administration strictly isolated from global builder routes and MAZIGHO boutique chrome", () => {
    const adminPageSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/site-builder/IndependentSiteAdminPage.tsx"),
      "utf8",
    );
    const appSource = readFileSync(
      resolve(process.cwd(), "client/src/App.tsx"),
      "utf8",
    );
    const invitePageSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/site-builder/SiteInvitationPage.tsx"),
      "utf8",
    );

    expect(adminPageSource).not.toContain('href="/constructeur-sites"');
    expect(adminPageSource).not.toContain("/constructeur-sites/apercu/");
    expect(adminPageSource).not.toContain("trpc.visualBuilder");
    expect(adminPageSource).not.toContain("trpc.shopify");
    expect(adminPageSource).not.toContain("trpc.orders");

    // Invitation fallback must redirect to /administration-site, never /constructeur-sites
    expect(invitePageSource).not.toContain(': "/constructeur-sites"');

    // MazighoSurfaceSwitcher must never render on /administration-site, /connexion-administration, or invitation routes
    expect(appSource).toContain('!location.startsWith("/administration-site")');
    expect(appSource).toContain('!location.startsWith("/constructeur-sites/invitation/")');
    expect(appSource).toContain('!location.startsWith("/connexion-administration")');

    // Non-régression Phase 1 : le préfixe /admin ne doit JAMAIS capturer /administration-site sur studio.mazigho.ch
    expect(appSource).not.toContain('isStudioHost && path.startsWith("/admin") && !path.startsWith("/admin/studio")');
    expect(appSource).toContain('isStudioHost && path.startsWith("/admin/") && !path.startsWith("/admin/studio")');
    expect(appSource).not.toContain('if (studioTitle || pathname.startsWith("/admin"))');

    // Non-régression Phase 1 : déconnexion et persistance du site sélectionné dans /administration-site
    expect(adminPageSource).toContain("Se déconnecter");
    expect(adminPageSource).toContain("mazigho:client-admin:selectedSiteId");
    expect(adminPageSource).toContain("window.history.replaceState");

    // Non-régression Phase 2 : le guide client n'importe jamais le guide privé du constructeur
    expect(adminPageSource).not.toContain("builderGuideContent");
    expect(adminPageSource).not.toContain("BUILDER_GUIDE_CONFIG");
  });

  it("delivers strictly separated owner-builder and client-admin guides and verified HD video assets", () => {
    expect(BUILDER_GUIDE_CONFIG.audience).toBe("owner-builder");
    expect(BUILDER_GUIDE_CONFIG.steps).toHaveLength(18);
    expect(BUILDER_GUIDE_CONFIG.video.chapters).toHaveLength(12);

    expect(CLIENT_GUIDE_CONFIG.audience).toBe("client-admin");
    expect(CLIENT_GUIDE_CONFIG.steps).toHaveLength(18);
    expect(CLIENT_GUIDE_CONFIG.video.chapters).toHaveLength(10);

    // Rappel obligatoire d'isolation dans le guide client
    expect(CLIENT_GUIDE_CONFIG.isolationNotice).toBe(
      "Vous administrez uniquement le site qui vous a été attribué. Vous n’avez pas accès au constructeur global, aux autres sites, à la boutique MAZIGHO ni aux données internes de MAZIGHO.",
    );
    expect(CLIENT_ISOLATION_NOTICE).toBe(CLIENT_GUIDE_CONFIG.isolationNotice);

    // Aucun lien vers le constructeur global ou la boutique dans le contenu du guide client
    const serializedClientGuide = JSON.stringify(CLIENT_GUIDE_CONFIG);
    expect(serializedClientGuide).not.toContain("/constructeur-sites");
    expect(serializedClientGuide).not.toContain("/demarrer-boutique");
    expect(serializedClientGuide).not.toContain("mazighoshop");

    // Vérification des 6 livrables médias réels dans client/public/guides/
    const expectedFiles = [
      "client/public/guides/video-constructeur-mazigho.mp4",
      "client/public/guides/video-constructeur-mazigho.vtt",
      "client/public/guides/poster-constructeur.png",
      "client/public/guides/video-administration-client.mp4",
      "client/public/guides/video-administration-client.vtt",
      "client/public/guides/poster-client.png",
    ];
    for (const relPath of expectedFiles) {
      const stats = statSync(resolve(process.cwd(), relPath));
      expect(stats.size).toBeGreaterThan(1000);
    }
  });
});
