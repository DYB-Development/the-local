import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards the publishability of the package: these assertions pin the
// package.json fields npm relies on when `the-local` is published and run via
// `npx`. See issue #2.

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as Record<string, unknown>;

describe("package publishability", () => {
  it("is not marked private", () => {
    expect(pkg.private).toBeUndefined();
  });

  it("ships the built output, README, and the committed companion agents", () => {
    expect(pkg.files).toEqual(["dist", "README.md", "the-local/agents"]);
  });

  it("resolves its main entry to the built output", () => {
    expect(pkg.main).toBe("dist/index.js");
  });

  it("exposes its public entry as built types and JS", () => {
    expect(pkg.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      },
    });
  });

  it("rebuilds the dist before publishing", () => {
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.prepublishOnly).toBe("pnpm build");
  });
});

const publishWorkflow = readFileSync(
  fileURLToPath(new URL("../.github/workflows/publish.yml", import.meta.url)),
  "utf8",
);

describe("release workflow", () => {
  it("releases on version tags", () => {
    expect(publishWorkflow).toContain("tags:\n      - \"v*\"");
  });
});

const releasingDoc = readFileSync(
  fileURLToPath(new URL("../docs/RELEASING.md", import.meta.url)),
  "utf8",
);

describe("version policy", () => {
  it("documents semantic versioning", () => {
    expect(releasingDoc).toContain("Semantic Versioning");
  });
});

describe("self-provider declaration", () => {
  it("declares the-local as its own the-local provider", () => {
    expect(pkg["the-local"]).toEqual({
      prefix: "the-local",
      scope: "Claude Code locals — packages ship subagents that the-local installs into a host app",
      agentsDir: "the-local/agents",
    });
  });
});
