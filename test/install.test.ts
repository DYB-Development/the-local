import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installLocals } from "../src/installer.js";
import { tmpDir, writeHost, writeProvider } from "./helpers.js";

function host(deps: string[]): string {
  const dir = tmpDir();
  writeHost(dir, deps);
  return dir;
}

function nodeModules(dir: string): string {
  return join(dir, "node_modules");
}

describe("installLocals", () => {
  it("copies the committed agent file verbatim", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold", content: "SHIPPED BY THE PACKAGE" }],
    });

    installLocals(dir);

    expect(readFileSync(join(dir, ".claude/agents/keystone-scaffold.md"), "utf8")).toBe(
      "SHIPPED BY THE PACKAGE",
    );
  });

  it("skips providers outside the host's direct dependencies", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });
    writeProvider(nodeModules(dir), {
      packageName: "some_transitive_pkg",
      agents: [{ name: "helper" }],
    });

    installLocals(dir);

    expect(existsSync(join(dir, ".claude/agents/some_transitive_pkg-helper.md"))).toBe(false);
  });

  it("raises an actionable error when a provider ships no committed agents", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      omitAgentsDir: true,
    });

    expect(() => installLocals(dir)).toThrowError(/keystone_ui/);
  });

  it("writes every allowed agent", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }, { name: "review" }],
    });

    installLocals(dir);

    expect(readdirSync(join(dir, ".claude/agents")).sort()).toEqual([
      "keystone-review.md",
      "keystone-scaffold.md",
    ]);
  });
});
