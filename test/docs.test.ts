import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { FACETS } from "../src/interface.js";

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

  it("explains what each facet is for", () => {
    const guide = doc("docs/PROVIDERS.md");
    expect(FACETS.filter((facet) => !guide.includes(`### \`${facet}\``))).toEqual([]);
  });
});

describe("the changelog", () => {
  it("documents the package's current version", () => {
    const { version } = JSON.parse(doc("package.json")) as { version: string };
    expect(doc("CHANGELOG.md")).toContain(`## ${version}`);
  });
});
