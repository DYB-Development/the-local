import { describe, expect, it } from "vitest";
import { processRules } from "../src/process.js";

describe("processRules", () => {
  it("carries the one-time exception rule", () => {
    expect(processRules).toContain("one-time exception");
  });
});
