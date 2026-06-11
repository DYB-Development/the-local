import { describe, expect, it } from "vitest";
import { reference } from "../src/reference.js";

// `reference` is the single source of truth embedded verbatim as the knowledge
// of every companion agent. These assertions pin the contract-defining facts so
// the guidance can't silently drift from how the-local actually behaves.

describe("reference", () => {
  it("states the direct-dependency scope rule", () => {
    expect(reference).toContain("Only the host's direct dependencies contribute");
  });
});
