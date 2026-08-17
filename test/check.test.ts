import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProvider } from "../src/check.js";
import { tmpDir } from "./helpers.js";

interface PackageSpec {
  name?: string;
  declaration?: Record<string, unknown>;
  locals?: Record<string, string>;
}

function writePackage(spec: PackageSpec): string {
  const dir = tmpDir();
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: spec.name ?? "keystone", version: "0.0.0" }),
  );
  mkdirSync(join(dir, "the-local", "agents"), { recursive: true });
  if (spec.declaration) {
    writeFileSync(join(dir, "the-local", "interface.json"), JSON.stringify(spec.declaration));
  }
  for (const [facet, content] of Object.entries(spec.locals ?? {})) {
    writeFileSync(join(dir, "the-local", "agents", `${spec.name ?? "keystone"}-${facet}.md`), content);
  }
  return dir;
}

interface LocalSpec {
  scope?: string;
  entryPoints?: string[];
}

function local(spec: LocalSpec = {}): string {
  const bullets = (spec.entryPoints ?? []).map((entryPoint) => `- \`${entryPoint}\``).join("\n");
  return [
    "---",
    "name: keystone-info",
    "description: what keystone owns",
    "tools: Read",
    `scope: ${spec.scope ?? "Keystone UI components"}`,
    "---",
    "",
    "## What",
    "",
    "## Interface",
    "",
    bullets,
    "",
    "## How to use it",
    "",
    "## Conventions",
    "",
  ].join("\n");
}

describe("checkProvider format", () => {
  it("reports a missing front-matter key, naming the file", () => {
    const dir = writePackage({ locals: { info: local().replace("tools: Read\n", "") } });
    expect(checkProvider(dir)).toContain("keystone-info.md: missing key: tools");
  });

  it("reports a missing section, naming the file", () => {
    const dir = writePackage({ locals: { info: local().replace("## Conventions\n", "") } });
    expect(checkProvider(dir)).toContain("keystone-info.md: missing section: ## Conventions");
  });
});

describe("checkProvider scope", () => {
  it("reports a local whose scope differs from the manifest", () => {
    const dir = writePackage({
      declaration: { scope: "Keystone UI components" },
      locals: { info: local({ scope: "something else" }) },
    });
    expect(checkProvider(dir)).toContain("keystone-info.md: scope does not match the manifest");
  });

  it("reports disagreeing scope lines when the manifest declares no scope", () => {
    const dir = writePackage({
      locals: { info: local({ scope: "one thing" }), install: local({ scope: "another thing" }) },
    });
    expect(checkProvider(dir)).toContain("the locals' scope lines disagree");
  });
});
