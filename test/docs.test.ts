import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function doc(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), "utf8");
}

describe("README", () => {
  it("points at the provider guide", () => {
    expect(doc("README.md")).toContain("docs/PROVIDERS.md");
  });
});

describe("the provider guide", () => {
  it("documents the interface manifest", () => {
    expect(doc("docs/PROVIDERS.md")).toContain("the-local/interface.json");
  });
});
