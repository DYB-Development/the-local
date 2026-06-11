import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

// The package's public entry must re-export the companion so consumers (and the
// build:agents generator's contract) can reach it without deep imports.

describe("public entry", () => {
  it("re-exports the three companion agents", () => {
    expect(api.companionAgents).toHaveLength(3);
  });
});
