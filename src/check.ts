import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prefixFromName } from "./provider.js";

const FRONT_MATTER_KEYS = ["name", "description", "tools", "scope"];

const FACETS = ["info", "install", "develop"] as const;

interface Local {
  filename: string;
  markdown: string;
}

function missingKeys(markdown: string): string[] {
  return FRONT_MATTER_KEYS.filter((key) => !new RegExp(`^${key}:`, "m").test(markdown)).map(
    (key) => `missing key: ${key}`,
  );
}

function prefixOf(packageDir: string): string {
  const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as {
    name: string;
  };
  return prefixFromName(manifest.name);
}

function existingLocals(packageDir: string): Local[] {
  const prefix = prefixOf(packageDir);
  return FACETS.map((facet) => ({
    filename: `${prefix}-${facet}.md`,
    path: join(packageDir, "the-local", "agents", `${prefix}-${facet}.md`),
  }))
    .filter((local) => existsSync(local.path))
    .map((local) => ({ filename: local.filename, markdown: readFileSync(local.path, "utf8") }));
}

export function checkProvider(packageDir: string): string[] {
  return existingLocals(packageDir).flatMap((local) =>
    missingKeys(local.markdown).map((problem) => `${local.filename}: ${problem}`),
  );
}
