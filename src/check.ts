import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Facet, type InterfaceDeclaration, readInterface } from "./interface.js";
import { prefixFromName } from "./provider.js";

const FRONT_MATTER_KEYS = ["name", "description", "tools", "scope"];

const SECTIONS = ["## What", "## Interface", "## How to use it", "## Conventions"];

const FACETS = ["info", "install", "develop"] as const;

interface Local {
  facet: Facet;
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
    facet,
    filename: `${prefix}-${facet}.md`,
    path: join(packageDir, "the-local", "agents", `${prefix}-${facet}.md`),
  }))
    .filter((local) => existsSync(local.path))
    .map(({ facet, filename, path }) => ({
      facet,
      filename,
      markdown: readFileSync(path, "utf8"),
    }));
}

function frontMatterScope(markdown: string): string | null {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!block) return null;
  const scope = /^scope:[ \t]*(.*)$/m.exec(block[1] ?? "");
  return scope?.[1]?.trim() ?? null;
}

function formatProblems(locals: Local[]): string[] {
  return locals.flatMap((local) =>
    [...missingKeys(local.markdown), ...missingSections(local.markdown)].map(
      (problem) => `${local.filename}: ${problem}`,
    ),
  );
}

function disagreementProblems(locals: Local[]): string[] {
  const scopes = new Set(
    locals.map((local) => frontMatterScope(local.markdown)).filter((scope) => scope !== null),
  );
  return scopes.size > 1 ? ["the locals' scope lines disagree"] : [];
}

function scopeProblems(locals: Local[], declaredScope: string | null): string[] {
  if (declaredScope === null) return disagreementProblems(locals);
  return locals
    .filter((local) => frontMatterScope(local.markdown) !== declaredScope)
    .map((local) => `${local.filename}: scope does not match the manifest`);
}

function sectionLines(markdown: string, heading: string): string[] {
  const lines = markdown.split("\n");
  const start = lines.indexOf(heading);
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return end === -1 ? rest : rest.slice(0, end);
}

function documented(local: Local): string[] {
  return sectionLines(local.markdown, "## Interface")
    .map((line) => /^\s*-\s+`([^`]+)`/.exec(line)?.[1])
    .filter((span) => span !== undefined);
}

function undocumented(local: Local, declared: InterfaceDeclaration): string[] {
  const spans = documented(local);
  return declared.entryPoints[local.facet]
    .filter((entryPoint) => !spans.some((span) => span.includes(entryPoint)))
    .map((entryPoint) => `${local.filename}: undocumented entry point: ${entryPoint}`);
}

function declaringFacet(span: string, declared: InterfaceDeclaration): Facet | undefined {
  return FACETS.find((facet) =>
    declared.entryPoints[facet].some((entryPoint) => span.includes(entryPoint)),
  );
}

function misdocumented(local: Local, declared: InterfaceDeclaration): string[] {
  return documented(local)
    .filter((span) => declaringFacet(span, declared) !== local.facet)
    .map(
      (span) =>
        `${local.filename}: entry point declared for ${declaringFacet(span, declared)}: ${span}`,
    );
}

function interfaceProblems(locals: Local[], declared: InterfaceDeclaration): string[] {
  return locals.flatMap((local) => [
    ...undocumented(local, declared),
    ...misdocumented(local, declared),
  ]);
}

export function checkProvider(packageDir: string): string[] {
  const locals = existingLocals(packageDir);
  const declared = readInterface(packageDir);
  return [
    ...formatProblems(locals),
    ...scopeProblems(locals, declared.scope),
    ...interfaceProblems(locals, declared),
  ];
}
