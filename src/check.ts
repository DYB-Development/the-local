import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readInterface } from "./interface.js";
import { prefixFromName } from "./provider.js";

const FRONT_MATTER_KEYS = ["name", "description", "tools", "scope"];

const SECTIONS = ["## What", "## Interface", "## How to use it", "## Conventions"];

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

function missingSections(markdown: string): string[] {
  return SECTIONS.filter((section) => !markdown.includes(section)).map(
    (section) => `missing section: ${section}`,
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

function frontMatterScope(markdown: string): string | null {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!block) return null;
  const scope = /^scope:[ \t]*(.*)$/m.exec(block[1]);
  return scope ? scope[1].trim() : null;
}

function formatProblems(locals: Local[]): string[] {
  return locals.flatMap((local) =>
    [...missingKeys(local.markdown), ...missingSections(local.markdown)].map(
      (problem) => `${local.filename}: ${problem}`,
    ),
  );
}

function scopeProblems(locals: Local[], declaredScope: string | null): string[] {
  if (declaredScope === null) return [];
  return locals
    .filter((local) => frontMatterScope(local.markdown) !== declaredScope)
    .map((local) => `${local.filename}: scope does not match the manifest`);
}

export function checkProvider(packageDir: string): string[] {
  const locals = existingLocals(packageDir);
  const declared = readInterface(packageDir);
  return [...formatProblems(locals), ...scopeProblems(locals, declared.scope)];
}
