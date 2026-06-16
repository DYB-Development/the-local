import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { directDependencies } from "../src/discovery.js";
import { tmpDir } from "./helpers.js";

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
