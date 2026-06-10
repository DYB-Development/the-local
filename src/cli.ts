#!/usr/bin/env node
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

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  process.exit(run(process.argv.slice(2), process.cwd()));
}
