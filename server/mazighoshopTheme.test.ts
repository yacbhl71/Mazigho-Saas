import { describe, expect, it } from "vitest";
import { MAZIGHOSHOP_BLOCKS, MAZIGHOSHOP_CSS, MAZIGHOSHOP_HTML, MAZIGHOSHOP_THEME } from "@/lib/themes/mazighoshopReference/mazighoshopReferenceTemplate";

describe("thème visuel MAZIGHOSHOP", () => {
  it("expose un identifiant dédié et ne réutilise pas un autre thème", () => {
    expect(MAZIGHOSHOP_THEME.id).toBe("mazighoshop-reference");
    expect(MAZIGHOSHOP_THEME.id).not.toBe("clean-beauty-elegance");
    expect(MAZIGHOSHOP_THEME.id).not.toBe("imported-143");
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-theme="mazighoshop-reference"');
  });

  it("découpe les sections visuelles attendues en blocs GrapesJS", () => {
    expect(MAZIGHOSHOP_BLOCKS.length).toBe(11);
    expect(MAZIGHOSHOP_BLOCKS.map((block) => block.id)).toEqual([
      "mazighoshop-announcement",
      "mazighoshop-header",
      "mazighoshop-category",
      "mazighoshop-hero",
      "mazighoshop-categories",
      "mazighoshop-benefits",
      "mazighoshop-stats",
      "mazighoshop-reviews",
      "mazighoshop-universes",
      "mazighoshop-footer",
      "mazighoshop-chat",
    ]);
    expect(MAZIGHOSHOP_BLOCKS.every((block) => block.category === "MazighoShop · Thème visuel")).toBe(true);
    expect(MAZIGHOSHOP_BLOCKS.every((block) => block.icon.includes("<svg"))).toBe(true);
  });

  it("conserve les zones catalogue et un état vide sans données métier", () => {
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-zone="categories"');
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-zone="featured-products"');
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-zone="promotions"');
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-zone="new-products"');
    expect(MAZIGHOSHOP_HTML).toContain('data-mazigho-zone="catalogue"');
    expect(MAZIGHOSHOP_HTML).toContain("Aucun produit disponible");
    expect(MAZIGHOSHOP_HTML).not.toMatch(/api[_-]?key|sk_live|payment[_-]?secret|stock[_-]?id/i);
  });

  it("garde le style isolé, les breakpoints et les visuels éditables", () => {
    expect(MAZIGHOSHOP_CSS).toContain(".mz-page");
    expect(MAZIGHOSHOP_CSS).toContain("@media (max-width: 1100px)");
    expect(MAZIGHOSHOP_CSS).toContain("@media (max-width: 900px)");
    expect(MAZIGHOSHOP_CSS).toContain("@media (max-width: 640px)");
    expect(MAZIGHOSHOP_CSS).not.toMatch(/(^|\n)\s*(body|h1|h2|h3|a|button)\s*\{/);
    expect(MAZIGHOSHOP_HTML).toContain("<svg");
    expect(MAZIGHOSHOP_HTML).toContain("background-image:");
    expect(MAZIGHOSHOP_HTML).toContain("data-mazigho-header=\"true\"");
  });

  it("déporte le JavaScript autonome vers le canvas GrapesJS", () => {
    expect(MAZIGHOSHOP_THEME.canvasScripts.length).toBe(1);
    expect(MAZIGHOSHOP_THEME.canvasScripts[0]).toContain("data-hero-slide");
    expect(MAZIGHOSHOP_HTML).not.toContain("<script");
  });
});
