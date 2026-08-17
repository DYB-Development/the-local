import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Facet } from "./interface.js";

export function creatorPromptPath(facet: Facet): string {
  return fileURLToPath(new URL(`../creators/${facet}.md`, import.meta.url));
}

export function creatorPrompt(facet: Facet): string {
  return readFileSync(creatorPromptPath(facet), "utf8");
}
