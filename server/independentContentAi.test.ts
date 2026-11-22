import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIndependentSiteProject, getIndependentSiteProject } from "./isolatedSiteBuilderDb";
import { isolatedSiteBuilderRouter } from "./isolatedSiteBuilderRouter";
import type { TrpcContext } from "./_core/context";
import {
  consumeIndependentContentAiRateLimit,
  resetIndependentContentAiRateLimitForTests,
} from "./independentContentAiRateLimit";

const { invokeLLMMock, listLLMModelsMock } = vi.hoisted(() => ({
  invokeLLMMock: vi.fn(),
  listLLMModelsMock: vi.fn(),
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: invokeLLMMock,
  listLLMModels: listLLMModelsMock,
}));

function makeCaller(userId: number) {
  const ctx = {
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id: userId,
      openId: `independent-test-${userId}`,
      name: "Test editor",
      email: `editor-${userId}@example.test`,
      role: "user",
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as unknown as TrpcContext["user"],
  } as TrpcContext;
  return isolatedSiteBuilderRouter.createCaller(ctx);
}

describe("Assistant IA de contenu indépendant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIndependentContentAiRateLimitForTests();
    listLLMModelsMock.mockResolvedValue({ data: [{ id: "gemini-3.5-flash-lite" }] });
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: "Une proposition claire pour votre association." } }],
    });
  });

  it("génère une suggestion pour un membre editor autorisé sans sauvegarder le projet", async () => {
    const ownerId = 71201;
    const site = await createIndependentSiteProject(ownerId, { title: "Site éditorial IA" });
    const before = await getIndependentSiteProject(ownerId, site.id);
    const result = await makeCaller(ownerId).generateContentSuggestion({
      siteId: site.id,
      kind: "heading",
      instruction: "Rendre le titre plus accueillant",
      currentText: "Bienvenue",
      pageTitle: "Accueil",
      siteTitle: "Site éditorial IA",
    });
    expect(result.text).toBe("Une proposition claire pour votre association.");
    expect(result.model).toBe("gemini-3.5-flash-lite");
    expect(await getIndependentSiteProject(ownerId, site.id)).toEqual(before);
    expect(invokeLLMMock).toHaveBeenCalledOnce();
  });

  it("refuse un site différent ou non autorisé avant tout appel IA", async () => {
    const site = await createIndependentSiteProject(71202, { title: "Site privé" });
    await expect(makeCaller(79999).generateContentSuggestion({
      siteId: site.id,
      kind: "intro",
      instruction: "Réécrire le texte",
      currentText: "Texte",
      pageTitle: "Accueil",
      siteTitle: "Site privé",
    })).rejects.toThrow("INDEPENDENT_SITE_ACCESS_DENIED");
    expect(invokeLLMMock).not.toHaveBeenCalled();
  });

  it("nettoie la sortie et respecte la longueur maximale SEO", async () => {
    const ownerId = 71203;
    const site = await createIndependentSiteProject(ownerId, { title: "SEO" });
    invokeLLMMock.mockResolvedValueOnce({
      choices: [{ message: { content: `<script>alert(1)</script>${" mot".repeat(200)}` } }],
    });
    const result = await makeCaller(ownerId).generateContentSuggestion({
      siteId: site.id,
      kind: "seoDescription",
      instruction: "Créer une description SEO",
      currentText: "",
      pageTitle: "Accueil",
      siteTitle: "SEO",
    });
    expect(result.text).not.toContain("<script");
    expect(result.text.length).toBeLessThanOrEqual(320);
  });

  it("refuse une sortie vide ou invalide", async () => {
    const ownerId = 71204;
    const site = await createIndependentSiteProject(ownerId, { title: "Sortie invalide" });
    invokeLLMMock.mockResolvedValueOnce({ choices: [{ message: { content: "   " } }] });
    await expect(makeCaller(ownerId).generateContentSuggestion({
      siteId: site.id,
      kind: "intro",
      instruction: "Proposer un texte",
      currentText: "",
      pageTitle: "Accueil",
      siteTitle: "Sortie invalide",
    })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
  });

  it("bloque après huit requêtes dans la même fenêtre", () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(consumeIndependentContentAiRateLimit("rate-test", 1000)).toMatchObject({ allowed: true });
    }
    expect(consumeIndependentContentAiRateLimit("rate-test", 1000)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(consumeIndependentContentAiRateLimit("rate-test", 61_000)).toMatchObject({ allowed: true });
  });
});
