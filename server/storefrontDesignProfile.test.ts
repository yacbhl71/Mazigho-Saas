import { describe, expect, it } from "vitest";
import { defaultDesignProfile, normalizeDesignProfile } from "./db";

describe("normalizeDesignProfile", () => {
  it("préserve une légende visuelle finale volontairement vide", () => {
    const profile = normalizeDesignProfile({
      ...defaultDesignProfile,
      closingVisualText: "",
      closingImageUrl: "https://example.com/rituels-packaging.webp",
    });

    expect(profile.closingVisualText).toBe("");
    expect(profile.closingImageUrl).toBe("https://example.com/rituels-packaging.webp");
  });

  it("préserve une légende d’image narrative volontairement vide", () => {
    const profile = normalizeDesignProfile({
      ...defaultDesignProfile,
      storyVisualEyebrow: "",
      storyVisualTitle: "",
    });

    expect(profile.storyVisualEyebrow).toBe("");
    expect(profile.storyVisualTitle).toBe("");
  });

  it("normalise les 5 nouveaux formats de blocs libres Visual Builder 2.0 et les options Mobile-First", () => {
    const profile = normalizeDesignProfile({
      ...defaultDesignProfile,
      textBanners: [
        {
          id: "block-products",
          title: "Sélection du moment",
          eyebrow: "Catalogue",
          text: "Nos meilleures pièces",
          buttonLabel: "Voir tout",
          buttonUrl: "/boutique",
          imageUrl: "",
          imageAlt: "",
          layout: "productGrid",
          theme: "light",
          productIds: [12, 34, 56],
          visibilityDevice: "desktop",
          imageFocalPoint: "top",
          enabled: true,
        },
        {
          id: "block-faq",
          title: "Questions fréquentes",
          eyebrow: "Aide",
          text: "",
          buttonLabel: "",
          buttonUrl: "",
          imageUrl: "",
          imageAlt: "",
          layout: "faqAccordion",
          theme: "soft",
          faqItems: [
            { id: "faq-1", question: "Délais ?", answer: "Expédié sous 24/48h." },
          ],
          visibilityDevice: "mobile",
          enabled: true,
        },
        {
          id: "block-stats",
          title: "En chiffres",
          eyebrow: "Preuve",
          text: "",
          buttonLabel: "",
          buttonUrl: "",
          imageUrl: "",
          imageAlt: "",
          layout: "statsCounter",
          theme: "dark",
          statItems: [
            { id: "st-1", value: "98%", label: "Clients ravis" },
            { id: "st-2", value: "24h", label: "Préparation" },
          ],
          enabled: true,
        },
      ],
    });

    expect(profile.textBanners).toHaveLength(3);
    expect(profile.textBanners[0]?.layout).toBe("productGrid");
    expect(profile.textBanners[0]?.productIds).toEqual([12, 34, 56]);
    expect(profile.textBanners[0]?.visibilityDevice).toBe("desktop");
    expect(profile.textBanners[0]?.imageFocalPoint).toBe("top");
    expect(profile.textBanners[1]?.layout).toBe("faqAccordion");
    expect(profile.textBanners[1]?.faqItems).toEqual([
      { id: "faq-1", question: "Délais ?", answer: "Expédié sous 24/48h." },
    ]);
    expect(profile.textBanners[2]?.layout).toBe("statsCounter");
    expect(profile.textBanners[2]?.statItems).toHaveLength(2);
  });
});

