import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { directDependencies, discoverProviders } from "../src/discovery.js";
import { tmpDir, writeProvider } from "./helpers.js";

function writeManifest(dir: string, manifest: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
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
});
