import imported143Html from "./imported143.html?raw";
import imported143Css from "./imported143.scoped.css?raw";

export type Imported143Block = {
  id: string;
  label: string;
  category: string;
  content: string;
  attributes: { title: string; class: string };
};

const icon = (kind: "layout" | "header" | "footer") => {
  const accent = kind === "header" ? "#d82519" : kind === "footer" ? "#8d636e" : "#7d1d26";
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="${accent}" stroke-width="1.8"/><path d="M3 9h18" stroke="${accent}" stroke-width="1.8"/><path d="M7 13h4M7 16h7" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
};

function extract(selector: "section"): string[];
function extract(selector: "header" | "footer"): string;
function extract(selector: "header" | "footer" | "section"): string | string[] {
  const pattern = selector === "section" ? /<section\b[\s\S]*?<\/section>/gi : new RegExp(`<${selector}\\b[\\s\S]*?<\\/${selector}>`, "i");
  return selector === "section" ? imported143Html.match(pattern) ?? [] : imported143Html.match(pattern)?.[0] ?? "";
}

const titleFromSection = (html: string, fallback: string) => {
  const className = html.match(/class="([^"]+)"/)?.[1] ?? "";
  const heading = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  return heading || className.replace(/-/g, " ") || fallback;
};

const sectionBlocks = extract("section").map((content, index) => ({
  id: `imported-143-section-${index + 1}`,
  label: `Section importée · ${titleFromSection(content, `Section ${index + 1}`)}`,
  category: "Thèmes importés",
  content,
  attributes: { title: `Section importée ${index + 1}`, class: "imported-143-block" },
}));

export const IMPORTED_143_BLOCKS: Imported143Block[] = [
  { id: "imported-143-header", label: "En-tête et navigation", category: "Thèmes importés", content: extract("header"), attributes: { title: "En-tête importé", class: "imported-143-block" } },
  ...sectionBlocks,
  { id: "imported-143-footer", label: "Pied de page", category: "Thèmes importés", content: extract("footer"), attributes: { title: "Pied de page importé", class: "imported-143-block" } },
].filter(block => block.content.trim()).map((block, index) => ({ ...block, attributes: { ...block.attributes, "data-imported-block-index": String(index + 1) } }));

const withEditorRoot = imported143Html.replace(/^\s*/, "").replace(/<div class="page-143">/, `<div class="page-143" data-mazigho-theme="imported-143" data-mazigho-zone="editorial-site">`);

export const IMPORTED_143_THEME = {
  id: "imported-143",
  name: "Thème importé · Site éditorial",
  description: "Thème éditorial importé depuis une maquette HTML/CSS, avec navigation responsive et sections de contenu non marchand.",
  html: withEditorRoot,
  css: imported143Css,
  blocks: IMPORTED_143_BLOCKS,
  canvasStyles: [imported143Css],
  canvasScripts: [] as string[],
};

export function registerImported143Components(editor: { DomComponents: { addType: (id: string, definition: any) => unknown } }) {
  editor.DomComponents.addType("imported-143-link", {
    isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="imported-143"] a')),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "href", label: "Destination du lien" },
          { type: "text", name: "aria-label", label: "Libellé accessible" },
          { type: "checkbox", name: "target", label: "Nouvel onglet" },
        ],
      },
    },
  });
  editor.DomComponents.addType("imported-143-image", {
    isComponent: (el: HTMLElement) => Boolean(el?.matches?.('[data-mazigho-theme="imported-143"] img')),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "src", label: "URL de l’image" },
          { type: "text", name: "alt", label: "Texte alternatif" },
        ],
      },
    },
  });
  editor.DomComponents.addType("mazigho-catalog-reference", {
    isComponent: (el: HTMLElement) => Boolean(el?.hasAttribute?.("data-mazigho-product")),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "data-product-id", label: "Référence produit" },
          { type: "text", name: "data-product-zone", label: "Zone catalogue" },
        ],
      },
    },
  });
}

export function getImported143BlockIcon(blockId: string) {
  return blockId.includes("header") ? icon("header") : blockId.includes("footer") ? icon("footer") : icon("layout");
}
