import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const INTERFACE_FILE = join("the-local", "interface.json");

const FACETS = ["info", "install", "develop"] as const;

export type Facet = (typeof FACETS)[number];

export interface InterfaceDeclaration {
  scope: string | null;
  entryPoints: Record<Facet, string[]>;
  sources: string[];
}

type RawDeclaration = Partial<Record<Facet, string[]>> & {
  scope?: string | null;
  sources?: string[];
};

function parse(body: string): RawDeclaration {
  try {
    return JSON.parse(body) as RawDeclaration;
  } catch {
    throw new Error(`the-local: ${INTERFACE_FILE} is not valid JSON.`);
  }
}

function entryPoints(declaration: RawDeclaration): Record<Facet, string[]> {
  return Object.fromEntries(
    FACETS.map((facet) => [facet, declaration[facet] ?? []]),
  ) as Record<Facet, string[]>;
}

export function readInterface(packageDir: string): InterfaceDeclaration {
  const path = join(packageDir, INTERFACE_FILE);
  const declaration: RawDeclaration = existsSync(path)
    ? parse(readFileSync(path, "utf8"))
    : {};
  return {
    scope: declaration.scope ?? null,
    entryPoints: entryPoints(declaration),
    sources: declaration.sources ?? [],
  };
}
