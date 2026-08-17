import { existsSync } from "node:fs";
import { join } from "node:path";

import { INTERFACE_FILE } from "./interface.js";

export type CreatorRunner = (prompt: string, dir: string) => void;

function requireDeclaredInterface(packageDir: string): void {
  if (existsSync(join(packageDir, INTERFACE_FILE))) return;
  throw new Error(
    `the-local: declare this package's public interface in ${INTERFACE_FILE} before authoring its locals`,
  );
}

export function authorProvider(packageDir: string, runner: CreatorRunner): void {
  requireDeclaredInterface(packageDir);
  runner("", packageDir);
}
