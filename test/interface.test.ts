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
});
