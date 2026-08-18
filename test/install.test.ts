import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installLocals } from "../src/installer.js";
import { tmpDir, writeHost, writeProvider } from "./helpers.js";

const PROCESS_BEGIN_MARKER = "<!-- the_local:process:begin -->";

const EXISTING_PROCESS_BLOCK = `<!-- the_local:process:begin -->
RULES A PREVIOUS VERSION WROTE — the installer no longer owns this.
<!-- the_local:process:end -->`;

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

  it("does not create a develop_process_rules.md in the host", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });

    installLocals(dir);

    expect(existsSync(join(dir, "develop_process_rules.md"))).toBe(false);
  });

  it("does not write a process block into CLAUDE.md", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });

    installLocals(dir);

    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).not.toContain(PROCESS_BEGIN_MARKER);
  });

  it("leaves a process block already present in CLAUDE.md untouched", () => {
    const dir = host(["keystone_ui"]);
    writeProvider(nodeModules(dir), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });
    writeFileSync(join(dir, "CLAUDE.md"), `${EXISTING_PROCESS_BLOCK}\n`);

    installLocals(dir);

    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain(EXISTING_PROCESS_BLOCK);
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
