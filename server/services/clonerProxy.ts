import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

type CloneJobRecord = { userId: number; createdAt: number };
type CloneResponse = { job_id: string; status: string };

const ownedJobs = new Map<string, CloneJobRecord>();
const JOB_TTL_MS = 15 * 60 * 1000;

function serviceUrl() {
  const value = ENV.clonerServiceUrl.trim().replace(/\/$/, "");
  if (!value) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Service de clonage indisponible : CLONER_SERVICE_URL n’est pas configurée." });
  return value;
}

function headers() {
  const result: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (ENV.clonerApiKey) result["x-cloner-api-key"] = ENV.clonerApiKey;
  return result;
}

async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${serviceUrl()}${path}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) }, signal: controller.signal });
    const text = await response.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      throw new TRPCError({ code: response.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY", message: data?.detail || data?.error || `Le service de clonage a répondu HTTP ${response.status}.` });
    }
    return data;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const message = error instanceof Error && error.name === "AbortError" ? "Le service de clonage n’a pas répondu à temps." : "Service de clonage indisponible.";
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message });
  } finally {
    clearTimeout(timer);
  }
}

function cleanupJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [jobId, record] of Array.from(ownedJobs.entries())) if (record.createdAt < cutoff) ownedJobs.delete(jobId);
}

export function getClonerStatus() {
  return { enabled: ENV.clonerEnabled, configured: Boolean(ENV.clonerServiceUrl.trim()), serviceUrl: ENV.clonerServiceUrl.trim() ? "configured" : "missing" };
}

export async function startClone(userId: number, input: { url: string; projectName?: string; force?: boolean; shopifyPassword?: string }) {
  if (!ENV.clonerEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "L’import par clonage est désactivé dans cet environnement." });
  cleanupJobs();
  let source: URL;
  try { source = new URL(input.url); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "L’URL du site est invalide." }); }
  if (!["http:", "https:"].includes(source.protocol)) throw new TRPCError({ code: "BAD_REQUEST", message: "Seules les URL HTTP et HTTPS sont acceptées." });
  const data = await request("/clone", { method: "POST", body: JSON.stringify({ url: source.toString(), mazigho_user_id: String(userId), mazigho_project_name: input.projectName?.trim() || source.hostname, force: Boolean(input.force), shopify_password: input.shopifyPassword?.trim() || undefined }) }) as CloneResponse;
  if (!data?.job_id) throw new TRPCError({ code: "BAD_GATEWAY", message: "Le service de clonage n’a pas fourni d’identifiant de job." });
  ownedJobs.set(data.job_id, { userId, createdAt: Date.now() });
  return { jobId: data.job_id, status: data.status || "queued" };
}

export async function getCloneStatus(userId: number, jobId: string) {
  cleanupJobs();
  const record = ownedJobs.get(jobId);
  if (!record || record.userId !== userId) throw new TRPCError({ code: "NOT_FOUND", message: "Job de clonage introuvable." });
  const data = await request(`/clone/${encodeURIComponent(jobId)}`);
  return {
    jobId,
    status: data?.status || "unknown",
    progress: Number(data?.progress || 0),
    platformDetected: data?.platform_detected || null,
    productsCount: Number(data?.products_count || 0),
    variantsCount: Number(data?.variants_count || data?.import_summary?.variants_imported || 0),
    imagesCount: Number(data?.images_count || data?.import_summary?.images_imported || 0),
    pagesCount: Number(data?.pages_count || 0),
    message: data?.message || null,
    error: data?.error || null,
    projectUrl: data?.mazigho_project_url || null,
    warnings: [...(data?.warnings || []), ...(data?.robots_warning ? [data.robots_warning] : []), ...(data?.import_summary?.warnings || [])].filter((value, index, values) => typeof value === "string" && values.indexOf(value) === index),
  };
}
