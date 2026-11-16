export function normalizeBuilderHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "#";
}

export function sanitizeBuilderAlt(value: string) {
  return value.replace(/[<>]/g, "").slice(0, 240);
}

export function isDynamicCatalogueAttributes(attributes: Record<string, unknown> | null | undefined) {
  return attributes?.["data-mazigho-dynamic"] === "catalogue";
}
