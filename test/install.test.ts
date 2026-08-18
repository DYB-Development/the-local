import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installLocals } from "../src/installer.js";
import { BEGIN_MARKER } from "../src/trigger.js";
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

function hostShippingLocals(name: string): string {
  const dir = tmpDir();
  mkdirSync(join(dir, "the-local/agents"), { recursive: true });
  writeFileSync(join(dir, "the-local/agents/app-review.md"), "SHIPPED BY THE HOST");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name,
      version: "0.0.0",
      "the-local": { prefix: "app", scope: null, agentsDir: "the-local/agents" },
    }),
  );
  return dir;
}

function attemptInstall(dir: string): void {
  try {
    installLocals(dir);
  } catch {
    return;
  }
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

  it("installs the host's own locals, which no dependency ships", () => {
    const dir = hostShippingLocals("my_app");

    installLocals(dir);

    expect(readFileSync(join(dir, ".claude/agents/app-review.md"), "utf8")).toBe(
      "SHIPPED BY THE HOST",
    );
  });

  it("refuses a host directory that does not exist", () => {
    const missing = join(tmpDir(), "typo");

    expect(() => installLocals(missing)).toThrowError(/the-local:/);
  });

  it("leaves a host directory that does not exist uncreated", () => {
    const missing = join(tmpDir(), "typo");

    attemptInstall(missing);

    expect(existsSync(missing)).toBe(false);
  });

  it("names the directory that holds no package manifest", () => {
    const dir = tmpDir();

    expect(() => installLocals(dir)).toThrowError(`the-local: no package.json in ${dir}`);
  });

  it("writes nothing into a directory that holds no package manifest", () => {
    const dir = tmpDir();

    attemptInstall(dir);

    expect(readdirSync(dir)).toEqual([]);
  });

  it("writes the delegation block for a host with no provider dependencies", () => {
    const dir = host([]);

    installLocals(dir);

    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain(BEGIN_MARKER);
  });

  it("skips the host's own locals when the host is the-local's own repository", () => {
    const dir = hostShippingLocals("the-local");

    installLocals(dir);

    expect(existsSync(join(dir, ".claude/agents/app-review.md"))).toBe(false);
  });
});
