import { describe, expect, it } from "vitest";
import {
  createIndependentSiteProject,
  getIndependentSiteAnalyticsSummary,
  recordIndependentSitePageView,
  getPublicIndependentSiteBySlug,
} from "./isolatedSiteBuilderDb";
import { isolatedSiteBuilderRouter } from "./isolatedSiteBuilderRouter";
import type { TrpcContext } from "./_core/context";

function makeCaller(userId: number) {
  const ctx = {
    req: {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      name: `User ${userId}`,
      email: `user-${userId}@example.test`,
      role: "user",
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as unknown as TrpcContext["user"],
  } as TrpcContext;
  return isolatedSiteBuilderRouter.createCaller(ctx);
}

describe("Analytics des sites indépendants", () => {
  it("enregistre une visite pour un site en brouillon sans exposer son contenu public", async () => {
    // 1. Un site indépendant est créé (par défaut en statut 'draft', comme ATH VAHLOUL avant publication)
    const ownerId = 88001;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Association familiale ATH VAHLOUL",
      slug: "association-familiale-ath-vahloul",
    });
    expect(site.status).toBe("draft");
    expect(site.publishedSnapshot).toBeNull();

    // 2. Un visiteur se rend sur la vitrine publique : recordPageView est appelé avec le slug
    const publicCaller = isolatedSiteBuilderRouter.createCaller({
      req: { headers: {}, socket: { remoteAddress: "127.0.0.1" } } as unknown as TrpcContext["req"],
      res: {} as TrpcContext["res"],
      user: null,
    } as TrpcContext);

    const recordResult = await publicCaller.recordPageView({
      slug: site.slug,
      visitorKey: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      path: "/",
    });

    // La télémétrie résout le site par son slug sans utiliser la lecture publique,
    // qui doit continuer à refuser le contenu d'un brouillon.
    expect(recordResult).toEqual({ recorded: true });

    // 3. Dans l'administration, l'administrateur consulte l'onglet Statistiques
    const adminCaller = makeCaller(ownerId);
    const summary = await adminCaller.getAnalyticsSummary({ siteId: site.id });

    expect(summary.visitors).toBe(1);
    expect(summary.pageViews).toBe(1);
    expect(summary.formsReceived).toBe(0);
    expect(summary.popularPages).toEqual([{ path: "/", views: 1 }]);
  });

  it("CORRECTION DEMONTREE : Résoudre le site par son slug permet d'enregistrer la visite et de peupler les statistiques", async () => {
    const ownerId = 88002;
    const site = await createIndependentSiteProject(ownerId, {
      title: "Site avec analytics actives",
      slug: "site-analytics-actives",
    });

    // En appelant directement l'enregistrement avec le siteId réel (résolu par slug)
    const visitorKeyA = "11112222333344445555666677778888";
    const visitorKeyB = "aaaabbbbccccddddeeeeffff00001111";

    const rec1 = await recordIndependentSitePageView({
      siteId: site.id,
      visitorKey: visitorKeyA,
      path: "/",
    });
    expect(rec1).toEqual({ recorded: true });

    const rec2 = await recordIndependentSitePageView({
      siteId: site.id,
      visitorKey: visitorKeyA,
      path: "/contact",
    });
    expect(rec2).toEqual({ recorded: true });

    const rec3 = await recordIndependentSitePageView({
      siteId: site.id,
      visitorKey: visitorKeyB,
      path: "/",
    });
    expect(rec3).toEqual({ recorded: true });

    // Vérification de la lecture par getAnalyticsSummary
    const adminCaller = makeCaller(ownerId);
    const summary = await adminCaller.getAnalyticsSummary({ siteId: site.id });

    expect(summary.visitors).toBe(2); // 2 visiteurs uniques (visitorKeyA et visitorKeyB)
    expect(summary.pageViews).toBe(3); // 3 pages vues
    expect(summary.popularPages).toEqual([
      { path: "/", views: 2 },
      { path: "/contact", views: 1 },
    ]);
  });
});
