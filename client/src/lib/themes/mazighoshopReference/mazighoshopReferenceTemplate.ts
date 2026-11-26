import mazighoshopHtmlSource from "./mazighoshopReference.html?raw";
import mazighoshopCss from "./mazighoshopReferenceStyles";

export type MazighoShopBlock = {
  id: string;
  label: string;
  category: string;
  content: string;
  icon: string;
};

export type MazighoShopTheme = {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  blocks: MazighoShopBlock[];
  canvasStyles: string[];
  canvasScripts: string[];
};

const CATEGORY = "MazighoShop · Thème visuel";
const ROOT_MARKER = 'data-mazigho-theme="mazighoshop-reference"';

const blockIcon = (kind: "layout" | "header" | "catalogue" | "footer") => {
  const accent =
    kind === "header"
      ? "#e86f3a"
      : kind === "footer"
        ? "#f1c263"
        : kind === "catalogue"
          ? "#d97706"
          : "#2e1e16";
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="${accent}" stroke-width="1.8"/><path d="M3 9h18" stroke="${accent}" stroke-width="1.8"/><path d="M7 13h4M7 16h7" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
};

const scriptMatch = mazighoshopHtmlSource.match(
  /<script[^>]*>([\s\S]*?)<\/script>/i,
);
const canvasScript = scriptMatch?.[1]?.trim() ?? "";
const sourceWithoutScript = mazighoshopHtmlSource.replace(
  /\s*<script[^>]*>[\s\S]*?<\/script>\s*/i,
  "\n",
);

const withThemeContract = sourceWithoutScript
  .replace('<div class="mz-page"', `<div class="mz-page" ${ROOT_MARKER}`)
  .replace(
    'data-mazigho-announcement="true"',
    'data-mazigho-announcement="true" data-mazigho-zone="promotions"',
  )
  .replace(
    'data-mazigho-category-view="true"',
    'data-mazigho-category-view="true" data-mazigho-zone="new-products"',
  )
  .replace(
    'data-mazigho-products-grid="true"',
    'data-mazigho-products-grid="true" data-mazigho-zone="catalogue"',
  )
  .replace(
    'data-mazigho-categories-section="true"',
    'data-mazigho-categories-section="true" data-mazigho-zone="categories"',
  )
  .replace(
    'data-hero-carousel="true"',
    'data-hero-carousel="true" data-mazigho-zone="featured-products"',
  );

const rootHtml = withThemeContract
  .replace(/^\s*<div class="mz-page"[^>]*>/, (match) => `${match}`)
  .replace(/<\/div>\s*$/, "</div>");

const blockNames: Array<{
  needle: string;
  id: string;
  label: string;
  kind: "layout" | "header" | "catalogue" | "footer";
}> = [
  {
    needle: "BARRE D'ANNONCE",
    id: "mazighoshop-announcement",
    label: "Barre d’annonce promotionnelle",
    kind: "layout",
  },
  {
    needle: "EN-TÊTE PRINCIPAL",
    id: "mazighoshop-header",
    label: "En-tête, méga-menu et compte",
    kind: "header",
  },
  {
    needle: "VUE CATÉGORIE",
    id: "mazighoshop-category",
    label: "Vue catégorie et catalogue vide",
    kind: "catalogue",
  },
  {
    needle: "BANNIÈRE HERO",
    id: "mazighoshop-hero",
    label: "Hero avec carrousel",
    kind: "layout",
  },
  {
    needle: "SÉLECTION DE PRODUITS",
    id: "mazighoshop-categories",
    label: "Sélection et catégories",
    kind: "catalogue",
  },
  {
    needle: "POURQUOI NOUS CHOISIR",
    id: "mazighoshop-benefits",
    label: "Avantages et réassurance",
    kind: "layout",
  },
  {
    needle: "BANDEAU CHIFFRES",
    id: "mazighoshop-stats",
    label: "Bandeau chiffres clés",
    kind: "layout",
  },
  {
    needle: "CE QUE NOS CLIENTS",
    id: "mazighoshop-reviews",
    label: "Avis clients et note",
    kind: "layout",
  },
  {
    needle: "TOUT CE DONT VOUS AVEZ BESOIN",
    id: "mazighoshop-universes",
    label: "Univers de la boutique",
    kind: "layout",
  },
  {
    needle: "FOOTER SOMBRE",
    id: "mazighoshop-footer",
    label: "Footer et newsletter",
    kind: "footer",
  },
  {
    needle: "BOUTON CHAT",
    id: "mazighoshop-chat",
    label: "Bouton de support flottant",
    kind: "layout",
  },
];

const markerParts = withThemeContract
  .split(/(?=\s*<!--\s*BLOC:)/i)
  .filter((part) => /<!--\s*BLOC:/i.test(part));
const extractBlockContent = (needle: string) =>
  markerParts
    .find((part) => part.toUpperCase().includes(needle.toUpperCase()))
    ?.trim() ?? "";

export const MAZIGHOSHOP_BLOCKS: MazighoShopBlock[] = blockNames
  .map((definition) => ({
    ...definition,
    content: extractBlockContent(definition.needle),
    category: CATEGORY,
    icon: blockIcon(definition.kind),
  }))
  .filter((block) => block.content.length > 0)
  .map(({ needle: _needle, kind: _kind, ...block }) => block);

export const MAZIGHOSHOP_HTML = rootHtml;
export const MAZIGHOSHOP_CSS = mazighoshopCss;

export const MAZIGHOSHOP_THEME: MazighoShopTheme = {
  id: "mazighoshop-reference",
  name: "MAZIGHOSHOP · Référence visuelle",
  description:
    "Reproduction visuelle isolée de MAZIGHOSHOP : navigation, méga-menu, hero, catégories, réassurance, avis, univers, catalogue vide, newsletter et footer responsive.",
  html: MAZIGHOSHOP_HTML,
  css: MAZIGHOSHOP_CSS,
  blocks: MAZIGHOSHOP_BLOCKS,
  canvasStyles: [MAZIGHOSHOP_CSS],
  canvasScripts: canvasScript ? [canvasScript] : [],
};

export function registerMazighoShopComponents(editor: {
  DomComponents: { addType: (id: string, definition: any) => unknown };
}) {
  editor.DomComponents.addType("mazighoshop-link", {
    isComponent: (el: HTMLElement) =>
      Boolean(el?.matches?.('[data-mazigho-theme="mazighoshop-reference"] a')),
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
  editor.DomComponents.addType("mazighoshop-image", {
    isComponent: (el: HTMLElement) =>
      Boolean(
        el?.matches?.('[data-mazigho-theme="mazighoshop-reference"] img'),
      ),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "src", label: "URL de l’image" },
          { type: "text", name: "alt", label: "Texte alternatif" },
          {
            type: "text",
            name: "data-mazigho-media-role",
            label: "Rôle visuel",
          },
        ],
      },
    },
  });
  editor.DomComponents.addType("mazighoshop-background", {
    isComponent: (el: HTMLElement) =>
      Boolean(
        el?.matches?.(
          '[data-mazigho-theme="mazighoshop-reference"] [style*="background-image"]',
        ),
      ),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "style", label: "Image de fond / style" },
          {
            type: "text",
            name: "data-mazigho-background-image",
            label: "Marqueur image",
          },
        ],
      },
    },
  });
  editor.DomComponents.addType("mazighoshop-catalogue-zone", {
    isComponent: (el: HTMLElement) =>
      Boolean(el?.hasAttribute?.("data-mazigho-zone")),
    model: {
      defaults: {
        traits: [
          { type: "text", name: "data-mazigho-zone", label: "Zone visuelle" },
          {
            type: "text",
            name: "data-mazigho-catalogue-state",
            label: "État catalogue",
          },
        ],
      },
    },
  });
}

export function applyMazighoShopTheme(editor: {
  setComponents: (components: string) => unknown;
  setStyle: (style: string) => unknown;
  BlockManager: {
    add: (
      id: string,
      config: {
        label: string;
        category: string;
        content: string;
        attributes?: Record<string, string>;
      },
    ) => unknown;
    get?: (id: string) => unknown;
  };
}) {
  MAZIGHOSHOP_BLOCKS.forEach((block) => {
    if (!editor.BlockManager.get || !editor.BlockManager.get(block.id)) {
      editor.BlockManager.add(block.id, {
        label: block.label,
        category: block.category,
        content: block.content,
        attributes: { title: block.label, class: "mazighoshop-block" },
      });
    }
  });
  editor.setStyle(MAZIGHOSHOP_CSS);
  editor.setComponents(MAZIGHOSHOP_HTML);
}
