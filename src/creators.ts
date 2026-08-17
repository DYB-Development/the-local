import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Facet } from "./interface.js";

export function creatorPrompt(facet: Facet): string {
  const path = fileURLToPath(new URL(`../creators/${facet}.md`, import.meta.url));
  return readFileSync(path, "utf8");
}
