export function normalizeBuilderHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed || (trimmed.startsWith("/") && !trimmed.startsWith("//")) || trimmed.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "#";
}

export function sanitizeBuilderAlt(value: string) {
  return value.replace(/[<>]/g, "").slice(0, 240);
}

export function isDynamicCatalogueAttributes(attributes: Record<string, unknown> | null | undefined) {
  return attributes?.["data-mazigho-dynamic"] === "catalogue";
}

const LOCAL_DRAFT_PREFIX = "mazigho:visual-builder:draft:";
const LOCAL_DRAFT_MAX_BYTES = 2_000_000;

export function getVisualBuilderLocalDraftKey(scope: { storeId?: number | null; projectId?: number | null }) {
  const owner = scope.storeId ? `store-${scope.storeId}` : scope.projectId ? `project-${scope.projectId}` : "session";
  return `${LOCAL_DRAFT_PREFIX}${owner}`;
}

export function writeVisualBuilderLocalDraft(storage: Pick<Storage, "setItem">, key: string, payload: unknown) {
  try {
    const serialized = JSON.stringify({ version: 1, savedAt: new Date().toISOString(), payload });
    if (serialized.length > LOCAL_DRAFT_MAX_BYTES) return false;
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function readVisualBuilderLocalDraft(storage: Pick<Storage, "getItem">, key: string): { savedAt: string; payload: Record<string, unknown> } | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as { version?: unknown; savedAt?: unknown; payload?: unknown };
    if (record.version !== 1 || typeof record.savedAt !== "string" || !record.payload || typeof record.payload !== "object") return null;
    return { savedAt: record.savedAt, payload: record.payload as Record<string, unknown> };
  } catch {
    return null;
  }
}

export function clearVisualBuilderLocalDraft(storage: Pick<Storage, "removeItem">, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // localStorage may be unavailable in private browsing or restricted iframes.
  }
}

export * from "@shared/visualProjectModes";
