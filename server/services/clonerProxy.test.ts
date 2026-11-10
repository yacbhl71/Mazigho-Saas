import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import { getCloneStatus, getClonerStatus, startClone } from "./clonerProxy";

describe("clonerProxy", () => {
  const original = { enabled: ENV.clonerEnabled, url: ENV.clonerServiceUrl, key: ENV.clonerApiKey };
  afterEach(() => {
    ENV.clonerEnabled = original.enabled;
    ENV.clonerServiceUrl = original.url;
    ENV.clonerApiKey = original.key;
    vi.unstubAllGlobals();
  });

  it("expose une configuration inactive sans bloquer le Studio", () => {
    ENV.clonerEnabled = false;
    ENV.clonerServiceUrl = "";
    expect(getClonerStatus()).toEqual({ enabled: false, configured: false, serviceUrl: "missing" });
  });

  it("lance un job et refuse son suivi depuis un autre utilisateur", async () => {
    ENV.clonerEnabled = true;
    ENV.clonerServiceUrl = "http://cloner.test";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ job_id: "11111111-1111-4111-8111-111111111111", status: "queued" }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed", progress: 100, products_count: 2, variants_count: 3, images_count: 4, pages_count: 1, warnings: ["robots.txt"] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const started = await startClone(7, { url: "https://example.com", projectName: "Demo" });
    expect(started.jobId).toBe("11111111-1111-4111-8111-111111111111");
    expect(fetchMock).toHaveBeenCalledWith("http://cloner.test/clone", expect.objectContaining({ method: "POST" }));
    const status = await getCloneStatus(7, started.jobId);
    expect(status.variantsCount).toBe(3);
    expect(status.imagesCount).toBe(4);
    expect(status.warnings).toEqual(["robots.txt"]);
    await expect(getCloneStatus(8, started.jobId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
