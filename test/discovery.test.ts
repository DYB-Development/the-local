import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { directDependencies, discoverProviders } from "../src/discovery.js";
import { tmpDir, writeProvider } from "./helpers.js";

function writeManifest(dir: string, manifest: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
}

function agentFile(scope: string): string {
  return ["---", "name: keystone-scaffold", `scope: ${scope}`, "---", "", "You build UI.", ""].join(
    "\n",
  );
}

function writeUndeclaredProvider(hostDir: string, packageName: string, agentFiles: string[]): void {
  const pkgDir = join(hostDir, "node_modules", packageName);
  const agentsDir = join(pkgDir, "the-local", "agents");
  mkdirSync(agentsDir, { recursive: true });
  writeManifest(pkgDir, { name: packageName });
  for (const file of agentFiles) writeFileSync(join(agentsDir, file), "stub");
}

describe("directDependencies", () => {
  it("includes devDependencies", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", devDependencies: { keystone_ui: "*" } });
    expect(directDependencies(dir)).toContain("keystone_ui");
  });

  it("lists a package in both groups once", () => {
    const dir = tmpDir();
    writeManifest(dir, {
      name: "host",
      dependencies: { keystone_ui: "*" },
      devDependencies: { keystone_ui: "*" },
    });
    expect(directDependencies(dir)).toEqual(["keystone_ui"]);
  });
});

describe("discoverProviders", () => {
  it("rejects a provider whose the-local declaration is not an object", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    const pkgDir = join(dir, "node_modules", "keystone_ui");
    mkdirSync(pkgDir, { recursive: true });
    writeManifest(pkgDir, { name: "keystone_ui", "the-local": "keystone" });
    expect(() => discoverProviders(dir)).toThrow(
      /the-local: keystone_ui has a "the-local" declaration that is not an object/,
    );
  });

  it("discovers a provider declared only in devDependencies", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", devDependencies: { keystone_ui: "*" } });
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });
    expect(discoverProviders(dir).map((p) => p.packageName)).toEqual(["keystone_ui"]);
  });

  it("resolves a direct dependency hoisted to an ancestor node_modules", () => {
    const root = tmpDir();
    const hostDir = join(root, "packages", "app");
    mkdirSync(hostDir, { recursive: true });
    writeManifest(hostDir, { name: "app", dependencies: { keystone_ui: "*" } });
    writeProvider(join(root, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold" }],
    });
    expect(discoverProviders(hostDir).map((p) => p.packageName)).toEqual(["keystone_ui"]);
  });

  it("discovers a dependency that ships agent files without a the-local declaration", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeUndeclaredProvider(dir, "keystone_ui", ["keystone-develop.md"]);
    expect(discoverProviders(dir).map((p) => p.packageName)).toEqual(["keystone_ui"]);
  });

  it("derives the prefix from the agent filename when there is no declaration", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeUndeclaredProvider(dir, "keystone_ui", ["keystone-develop.md"]);
    expect(discoverProviders(dir).map((p) => p.prefix)).toEqual(["keystone"]);
  });

  it("skips a dependency whose undeclared agents directory holds no agent files", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeUndeclaredProvider(dir, "keystone_ui", []);
    expect(discoverProviders(dir)).toEqual([]);
  });

  it("prefers a declared prefix over the one derived from the filename", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeUndeclaredProvider(dir, "keystone_ui", ["keystone-develop.md"]);
    writeManifest(join(dir, "node_modules", "keystone_ui"), {
      name: "keystone_ui",
      "the-local": { prefix: "custom" },
    });
    expect(discoverProviders(dir).map((p) => p.prefix)).toEqual(["custom"]);
  });

  it("reads agents from a declared agentsDir instead of the default location", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agentsDir: "shipped/agents",
      agents: [{ name: "scaffold" }],
    });
    expect(discoverProviders(dir).flatMap((p) => p.agentFiles.map((f) => basename(f)))).toEqual([
      "keystone-scaffold.md",
    ]);
  });

  it("takes the provider scope from its agent front matter", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold", content: agentFile("UI — pages, forms, tables") }],
    });
    expect(discoverProviders(dir).map((p) => p.scope)).toEqual(["UI — pages, forms, tables"]);
  });

  it("uses the first agent that declares a scope as the representative", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [
        { name: "a-unscoped", content: "---\nname: keystone-a-unscoped\nscope:\n---\n" },
        { name: "b-scoped", content: agentFile("UI — pages, forms, tables") },
        { name: "c-scoped", content: agentFile("Something else") },
      ],
    });
    expect(discoverProviders(dir).map((p) => p.scope)).toEqual(["UI — pages, forms, tables"]);
  });

  it("falls back to the package.json scope when no agent declares one", () => {
    const dir = tmpDir();
    writeManifest(dir, { name: "host", dependencies: { keystone_ui: "*" } });
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      scope: "Declared in the manifest",
      agents: [{ name: "scaffold" }],
    });
    expect(discoverProviders(dir).map((p) => p.scope)).toEqual(["Declared in the manifest"]);
  });
});
