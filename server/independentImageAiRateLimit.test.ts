import { describe, expect, it, beforeEach } from "vitest";
import {
  consumeIndependentImageAiRateLimit,
  resetIndependentImageAiRateLimitForTests,
} from "./independentImageAiRateLimit";

describe("independent image AI rate limit", () => {
  beforeEach(() => resetIndependentImageAiRateLimitForTests());

  it("autorise trois générations puis bloque la quatrième dans la même fenêtre", () => {
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 1_000).allowed).toBe(true);
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 1_001).allowed).toBe(true);
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 1_002).allowed).toBe(true);
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 1_003)).toMatchObject({ allowed: false });
  });

  it("isole les sites et réinitialise la fenêtre", () => {
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 1_000).allowed).toBe(true);
    expect(consumeIndependentImageAiRateLimit("site:2:user:2", 1_000).allowed).toBe(true);
    expect(consumeIndependentImageAiRateLimit("site:1:user:2", 61_000).allowed).toBe(true);
  });
});
