import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BEGIN_MARKER, delegationRule, mergeTrigger } from "../src/trigger.js";
import { writeTrigger } from "../src/installer.js";
import { tmpDir } from "./helpers.js";

const keystone = { prefix: "keystone", scope: "UI — pages, forms, tables" };

describe("delegationRule", () => {
  it("lists a delegation bullet per provider", () => {
    expect(delegationRule([keystone])).toContain("- UI — pages, forms, tables → keystone-* agents");
  });

  it("renders a bare bullet when a provider has no scope", () => {
    expect(delegationRule([{ prefix: "keystone", scope: null }])).toContain("- keystone-* agents");
  });
});

describe("writeTrigger", () => {
  it("creates CLAUDE.md with the rule when absent", () => {
    const dir = tmpDir();
    writeTrigger(dir, [keystone]);
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toBe(`${delegationRule([keystone])}\n`);
  });

  it("is idempotent across reruns", () => {
    const dir = tmpDir();
    writeTrigger(dir, [keystone]);
    writeTrigger(dir, [keystone]);
    const occurrences = readFileSync(join(dir, "CLAUDE.md"), "utf8").split(BEGIN_MARKER).length - 1;
    expect(occurrences).toBe(1);
  });

  it("leaves CLAUDE.md byte-for-byte identical on rerun", () => {
    const dir = tmpDir();
    writeTrigger(dir, [keystone]);
    const afterFirst = readFileSync(join(dir, "CLAUDE.md"), "utf8");
    writeTrigger(dir, [keystone]);
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toBe(afterFirst);
  });

  it("preserves existing CLAUDE.md content", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "CLAUDE.md"), "# My App\n\nHouse rules.\n");
    writeTrigger(dir, [keystone]);
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toMatch(/^# My App\n\nHouse rules\./);
  });
});

describe("mergeTrigger", () => {
  it("replaces an existing marked section in place", () => {
    const first = mergeTrigger("", delegationRule([keystone]));
    const second = mergeTrigger(first, delegationRule([{ prefix: "keystone", scope: "new scope" }]));
    expect(second.split(BEGIN_MARKER).length - 1).toBe(1);
    expect(second).toContain("new scope");
  });
});
