import { describe, expect, it } from "vitest";
import { SHARED_BUILDER_CONNECTION_STATES, getSharedBuilderConnectionSummary } from "../shared/builderConnectionStates";

describe("builderConnectionStates", () => {
  it("expose les six interfaces avec un état explicite non connecté", () => {
    expect(SHARED_BUILDER_CONNECTION_STATES).toHaveLength(6);
    expect(new Set(SHARED_BUILDER_CONNECTION_STATES.map((state) => state.id)).size).toBe(6);
    expect(SHARED_BUILDER_CONNECTION_STATES.every((state) => ["Non connecté", "À configurer"].includes(state.status))).toBe(true);
  });

  it("calcule le résumé affiché dans les deux constructeurs", () => {
    expect(getSharedBuilderConnectionSummary()).toEqual({ total: 6, notConnected: 1, toConfigure: 5 });
  });
});
