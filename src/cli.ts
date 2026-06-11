#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { installLocals } from "./installer.js";
import { scaffoldProvider } from "./provider.js";

const COMMANDS = new Set(["install", "refresh"]);

export function run(argv: string[], hostDir: string): number {
  const command = argv[0] ?? "install";
  if (!COMMANDS.has(command)) {
    process.stderr.write(
      `the-local: unknown command "${command}" (expected install, refresh, provider, or build)\n`,
    );
    return 1;
  }

  const { providers, agents } = installLocals(hostDir);
  process.stdout.write(
    `the-local: installed ${agents.length} agent(s) from ${providers.length} provider(s).\n`,
  );
  return 0;
}

// Dispatches every command. The provider-authoring commands run from a package
// directory; install/refresh fall through to `run`. Async because `build` loads
// the provider's config by dynamic import.
export async function main(argv: string[], cwd: string): Promise<number> {
  const [command, target] = argv;
  if (command === "provider") {
    const { config, created } = scaffoldProvider(target ?? cwd);
    process.stdout.write(
      created
        ? `the-local: scaffolded provider "${config.prefix}" — edit the-local.config.js, then run the-local build.\n`
        : `the-local: the-local.config.js already exists; run the-local build to re-render.\n`,
    );
    return 0;
  }
  return run(argv, cwd);
}

// Node sets `import.meta.url` to the module's real path, but leaves
// `process.argv[1]` as the symlink npm creates in `node_modules/.bin`. Resolve
// the symlink before comparing so the CLI still runs when invoked via `npx`.
export function isEntrypoint(moduleUrl: string, invokedPath: string | undefined): boolean {
  if (!invokedPath) return false;
  return moduleUrl === pathToFileURL(realpathSync(invokedPath)).href;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  void main(process.argv.slice(2), process.cwd()).then((code) => process.exit(code));
}
