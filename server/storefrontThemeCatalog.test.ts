import { describe, expect, it } from "vitest";
import {
  isPremiumStorefrontTheme,
  premiumStorefrontThemeIds,
  storefrontThemeCatalog,
  storefrontThemeIds,
  storefrontThemeLabels,
} from "../shared/storefrontThemeCatalog";

describe("shared storefront theme catalog", () => {
  it("exposes twenty-eight unique owner-selectable theme identifiers", () => {
    expect(storefrontThemeIds).toHaveLength(28);
    expect(new Set(storefrontThemeIds).size).toBe(28);
    expect(storefrontThemeCatalog.map(theme => theme.id)).toEqual(storefrontThemeIds);
    expect(storefrontThemeIds).toEqual(
      expect.arrayContaining([
        "marketExpress",
        "gallerySignature",
        "studioFlux",
        "glamourNoir",
        "luminaLuxe",
        "nordicMinimal",
        "nebulasTech",
        "botanicaOrganic",
        "artisanBakery",
        "velvetApothecary",
        "apexAthletics",
        "auraJewelry",
      ]),
    );
  });

  it("marks the curated premium themes without removing them from the preview catalog", () => {
    expect(premiumStorefrontThemeIds).toEqual([
      "gallerySignature",
      "studioFlux",
      "glamourNoir",
      "luminaLuxe",
      "nordicMinimal",
      "nebulasTech",
      "botanicaOrganic",
      "artisanBakery",
      "velvetApothecary",
      "apexAthletics",
      "auraJewelry",
    ]);
    expect(premiumStorefrontThemeIds.every(themeId => storefrontThemeIds.includes(themeId))).toBe(true);
    expect(isPremiumStorefrontTheme("glamourNoir")).toBe(true);
    expect(isPremiumStorefrontTheme("luminaLuxe")).toBe(true);
    expect(isPremiumStorefrontTheme("artisanBakery")).toBe(true);
    expect(isPremiumStorefrontTheme("coffee")).toBe(false);
  });

  it("provides complete visual presentation metadata and minPlanTier for every theme", () => {
    for (const theme of storefrontThemeCatalog) {
      expect(theme.label).toBe(storefrontThemeLabels[theme.id]);
      expect(theme.visual).toMatch(/^(?:\/assets\/|https:\/\/files\.manuscdn\.com\/|https:\/\/images\.unsplash\.com\/)/);
      expect(theme.visualAlt.length).toBeGreaterThan(8);
      expect(theme.benefits).toHaveLength(3);
      expect(theme.palette.button).toContain("bg-");
      expect(["free", "basic", "pro", "lifetime"]).toContain(theme.minPlanTier);
    }
  });
});
