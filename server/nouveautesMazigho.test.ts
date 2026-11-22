import { describe, expect, it } from "vitest";
import {
  INDEPENDENT_BUILDER_BLOCKS,
  INDEPENDENT_PAGE_SOCLES,
  assertNoSecretsInIndependentSite,
  assertZeroEcommerceInIndependentSite,
} from "../shared/isolatedSiteBuilder";
import {
  createIndependentSiteFormSubmission,
  createIndependentSiteProject,
} from "./isolatedSiteBuilderDb";
import { isolatedSiteBuilderRouter } from "./isolatedSiteBuilderRouter";
import type { TrpcContext } from "./_core/context";

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
          openId: `nouveautes-user-${user.id}`,
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

describe("Nouveautés MAZIGHO — analytics, inbox & composed blocks", () => {
  it("records page views for draft sites and returns 7-day dailyViews + lastRecordedAt", async () => {
    const ownerId = 98101;
    const draftSite = await createIndependentSiteProject(ownerId, {
      title: "Site Association Brouillon Test",
    });
    expect(draftSite.status).toBe("draft");

    const publicCaller = makeCaller(null);
    const ownerCaller = makeCaller({
      id: ownerId,
      email: "owner-draft@example.test",
      role: "user",
    });

    const record1 = await publicCaller.recordPageView({
      slug: draftSite.slug,
      path: "/",
      visitorKey: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    });
    expect(record1.recorded).toBe(true);

    const record2 = await publicCaller.recordPageView({
      slug: draftSite.slug,
      path: "/actualites",
      visitorKey: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    });
    expect(record2.recorded).toBe(true);

    const record3 = await publicCaller.recordPageView({
      slug: draftSite.slug,
      path: "/",
      visitorKey: "0102030405060708090a0b0c0d0e0f10",
    });
    expect(record3.recorded).toBe(true);

    const summary = await ownerCaller.getAnalyticsSummary({ siteId: draftSite.id });
    expect(summary.visitors).toBe(2);
    expect(summary.pageViews).toBe(3);
    expect(summary.dailyViews).toHaveLength(7);
    expect(summary.dailyViews[6]?.views).toBe(3);
    expect(summary.lastRecordedAt).toBeTypeOf("string");
    expect(summary.popularPages[0]).toEqual({ path: "/", views: 2 });
  });

  it("updates form submission status (read / archived / restored) with strict site isolation", async () => {
    const ownerA = 98201;
    const ownerB = 98202;
    const siteA = await createIndependentSiteProject(ownerA, {
      title: "Association Inbox A",
    });
    const siteB = await createIndependentSiteProject(ownerB, {
      title: "Association Inbox B",
    });

    const created = await createIndependentSiteFormSubmission({
      siteId: siteA.id,
      formType: "contact",
      name: "Samira K.",
      email: "samira@example.test",
      message: "Bonjour, comment rejoindre la prochaine rencontre annuelle ?",
    });
    expect(created.status).toBe("new");

    const callerA = makeCaller({
      id: ownerA,
      email: "owner-a@example.test",
      role: "user",
    });
    const callerB = makeCaller({
      id: ownerB,
      email: "owner-b@example.test",
      role: "user",
    });

    // Cross-site update from another owner must be rejected
    await expect(
      callerB.updateFormSubmissionStatus({
        siteId: siteA.id,
        submissionId: created.id,
        status: "archived",
      }),
    ).rejects.toThrow();

    // Same-site status transitions work cleanly
    const markedRead = await callerA.updateFormSubmissionStatus({
      siteId: siteA.id,
      submissionId: created.id,
      status: "read",
    });
    expect(markedRead.status).toBe("read");

    const archived = await callerA.updateFormSubmissionStatus({
      siteId: siteA.id,
      submissionId: created.id,
      status: "archived",
    });
    expect(archived.status).toBe("archived");

    const restored = await callerA.updateFormSubmissionStatus({
      siteId: siteA.id,
      submissionId: created.id,
      status: "read",
    });
    expect(restored.status).toBe("read");

    // Cross-site siteB submission lookup must fail
    await expect(
      callerB.updateFormSubmissionStatus({
        siteId: siteB.id,
        submissionId: created.id,
        status: "archived",
      }),
    ).rejects.toThrow();
  });

  it("includes the 4 new composed zero-ecommerce sections without breaking existing socles", () => {
    const expectedIds = [
      "section-trombinoscope-bureau",
      "section-chronologie-histoire",
      "section-galerie-evenements",
      "section-adhesion-dons",
    ];

    for (const id of expectedIds) {
      const block = INDEPENDENT_BUILDER_BLOCKS.find((item) => item.id === id);
      expect(block, `Missing block ${id}`).toBeDefined();
      expect(() => assertZeroEcommerceInIndependentSite(block)).not.toThrow();
      expect(() => assertNoSecretsInIndependentSite(block)).not.toThrow();
    }

    // Ensure every pre-existing page socle still renders valid HTML
    expect(INDEPENDENT_PAGE_SOCLES.length).toBeGreaterThan(0);
    for (const socle of INDEPENDENT_PAGE_SOCLES) {
      expect(socle.html.length).toBeGreaterThan(50);
    }
  });
});
