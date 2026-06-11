#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { installLocals } from "./installer.js";

const COMMANDS = new Set(["install", "refresh"]);

export function run(argv: string[], hostDir: string): number {
  const command = argv[0] ?? "install";
  if (!COMMANDS.has(command)) {
    process.stderr.write(`the-local: unknown command "${command}" (expected install or refresh)\n`);
    return 1;
  }

  const { providers, agents } = installLocals(hostDir);
  process.stdout.write(
    `the-local: installed ${agents.length} agent(s) from ${providers.length} provider(s).\n`,
  );
  return 0;
}

// Node sets `import.meta.url` to the module's real path, but leaves
// `process.argv[1]` as the symlink npm creates in `node_modules/.bin`. Resolve
// the symlink before comparing so the CLI still runs when invoked via `npx`.
export function isEntrypoint(moduleUrl: string, invokedPath: string | undefined): boolean {
  if (!invokedPath) return false;
  return moduleUrl === pathToFileURL(realpathSync(invokedPath)).href;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(run(process.argv.slice(2), process.cwd()));
}
