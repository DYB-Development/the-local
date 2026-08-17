import { readFileSync } from "node:fs";
import { join } from "node:path";

export const INTERFACE_FILE = join("the-local", "interface.json");

const FACETS = ["info", "install", "develop"] as const;

export type Facet = (typeof FACETS)[number];

export interface InterfaceDeclaration {
  scope: string | null;
  entryPoints: Record<Facet, string[]>;
}

type RawDeclaration = Partial<Record<Facet, string[]>> & { scope?: string | null };

function entryPoints(declaration: RawDeclaration): Record<Facet, string[]> {
  return Object.fromEntries(
    FACETS.map((facet) => [facet, declaration[facet] ?? []]),
  ) as Record<Facet, string[]>;
}

export function readInterface(packageDir: string): InterfaceDeclaration {
  const declaration = JSON.parse(
    readFileSync(join(packageDir, INTERFACE_FILE), "utf8"),
  ) as RawDeclaration;
  return { scope: declaration.scope ?? null, entryPoints: entryPoints(declaration) };
}
