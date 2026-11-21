import { describe, expect, it } from "vitest";
import {
  acceptIndependentSiteInvitation,
  assertIndependentSiteAccess,
  createIndependentSiteProject,
  getIndependentSiteProject,
  inviteIndependentSiteAccess,
  listIndependentSiteProjectsAccessible,
  listIndependentSiteAccess,
  revokeIndependentSiteAccess,
  updateIndependentSiteAccessRole,
} from "./isolatedSiteBuilderDb";

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
});
