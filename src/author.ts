import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { creatorPrompt } from "./creators.js";
import { FACETS, INTERFACE_FILE } from "./interface.js";

export type CreatorRunner = (prompt: string, dir: string) => void;

const CLAUDE_ARGS = [
  "-p",
  "--allowedTools",
  "Read,Grep,Write",
  "--permission-mode",
  "acceptEdits",
  "--",
];

export function claudeCommand(prompt: string): string[] {
  return ["claude", ...CLAUDE_ARGS, prompt];
}

export const runClaude: CreatorRunner = (prompt, dir) => {
  try {
    execFileSync("claude", [...CLAUDE_ARGS, prompt], { cwd: dir, stdio: "inherit" });
  } catch {
    throw new Error(
      `the-local: the creator run failed in ${dir} (is the \`claude\` CLI installed?)`,
    );
  }
};

function requireDeclaredInterface(packageDir: string): void {
  if (existsSync(join(packageDir, INTERFACE_FILE))) return;
  throw new Error(
    `the-local: declare this package's public interface in ${INTERFACE_FILE} before authoring its locals`,
  );
}

export function authorProvider(packageDir: string, runner: CreatorRunner): void {
  requireDeclaredInterface(packageDir);
  for (const facet of FACETS) runner(creatorPrompt(facet), packageDir);
}
