import { readFileSync } from "node:fs";
import { join } from "node:path";

export const INTERFACE_FILE = join("the-local", "interface.json");

export interface InterfaceDeclaration {
  scope: string | null;
}

export function readInterface(packageDir: string): InterfaceDeclaration {
  const declaration = JSON.parse(readFileSync(join(packageDir, INTERFACE_FILE), "utf8")) as {
    scope?: string | null;
  };
  return { scope: declaration.scope ?? null };
}
