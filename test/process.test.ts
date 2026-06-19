import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROCESS_BEGIN_MARKER,
  PROCESS_END_MARKER,
  RULES_FILENAME,
  processBlock,
  processRules,
  writeProcessDoc,
} from "../src/process.js";
import { tmpDir } from "./helpers.js";

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

describe("writeProcessDoc", () => {
  it("writes the standalone rules file", () => {
    const dir = tmpDir();
    writeProcessDoc(dir);
    expect(readFileSync(join(dir, RULES_FILENAME), "utf8")).toBe(`${processRules}\n`);
  });
});
