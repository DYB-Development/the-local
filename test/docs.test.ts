import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { toMarkdown } from "../src/agent.js";
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

describe("the contract doc", () => {
  it("no longer documents the develop-process block install stopped writing", () => {
    expect(doc("docs/contract.md")).not.toContain("the_local:process");
  });

  it("no longer documents the removed config-file renderer", () => {
    expect(doc("docs/contract.md")).not.toContain("the-local.config.js");
  });

  it("states that discovery needs no package.json declaration", () => {
    expect(doc("docs/contract.md")).toContain("no declaration is required");
  });

  it("shows the agent front matter the renderer emits", () => {
    expect(doc("docs/contract.md")).toContain(
      toMarkdown({
        prefix: "keystone",
        name: "scaffold",
        description: "Use PROACTIVELY for UI work.",
        tools: "Read, Write, Edit",
        body: "You build UI.",
        knowledge: "API docs.",
      }),
    );
  });
});
