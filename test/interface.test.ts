import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readInterface } from "../src/interface.js";
import { tmpDir } from "./helpers.js";

function writeInterface(packageDir: string, body: string): void {
  mkdirSync(join(packageDir, "the-local"), { recursive: true });
  writeFileSync(join(packageDir, "the-local", "interface.json"), body);
}

describe("readInterface", () => {
  it("reads the declared scope", () => {
    const dir = tmpDir();
    writeInterface(dir, JSON.stringify({ scope: "Keystone UI components" }));
    expect(readInterface(dir).scope).toBe("Keystone UI components");
  });

  it("reads the entry points declared for a facet", () => {
    const dir = tmpDir();
    writeInterface(dir, JSON.stringify({ install: ["npx keystone init"] }));
    expect(readInterface(dir).entryPoints.install).toEqual(["npx keystone init"]);
  });

  it("reads an undeclared facet as an empty list", () => {
    const dir = tmpDir();
    writeInterface(dir, JSON.stringify({ install: ["npx keystone init"] }));
    expect(readInterface(dir).entryPoints.info).toEqual([]);
  });

  it("reads the declared sources", () => {
    const dir = tmpDir();
    writeInterface(dir, JSON.stringify({ sources: ["src/cli.ts"] }));
    expect(readInterface(dir).sources).toEqual(["src/cli.ts"]);
  });

  it("reads a missing manifest as an empty declaration", () => {
    expect(readInterface(tmpDir())).toEqual({
      scope: null,
      entryPoints: { info: [], install: [], develop: [] },
      sources: [],
    });
  });

  it("rejects a manifest that is not valid JSON", () => {
    const dir = tmpDir();
    writeInterface(dir, "scope: not json");
    expect(() => readInterface(dir)).toThrow(
      /the-local: the-local\/interface\.json is not valid JSON/,
    );
  });

  it("rejects a manifest that is not an object", () => {
    const dir = tmpDir();
    writeInterface(dir, JSON.stringify(["npx keystone init"]));
    expect(() => readInterface(dir)).toThrow(
      /the-local: the-local\/interface\.json is not an object/,
    );
  });
});
