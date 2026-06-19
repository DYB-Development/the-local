import { describe, expect, it } from "vitest";
import { PROCESS_BEGIN_MARKER, PROCESS_END_MARKER, processBlock, processRules } from "../src/process.js";

describe("processRules", () => {
  it("carries the one-time exception rule", () => {
    expect(processRules).toContain("one-time exception");
  });
});

describe("processBlock", () => {
  it("is delimited by the process markers", () => {
    expect(processBlock()).toMatch(
      new RegExp(`^${PROCESS_BEGIN_MARKER}[\\s\\S]*${PROCESS_END_MARKER}$`),
    );
  });
});
