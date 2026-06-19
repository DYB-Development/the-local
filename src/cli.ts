#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import { installLocals } from "./installer.js";
import { buildProvider, scaffoldProvider } from "./provider.js";

const COMMANDS = new Set(["install", "refresh"]);

const HELP = `the-local — install companion agents declared by your dependencies

Usage: the-local [command] [options]

Commands:
  install            Install agents into the host (default)
  refresh            Re-install agents into the host
  provider [dir]     Scaffold the current package as a provider
  build [dir]        Re-render a provider's agents from its config

Options:
  --dir <path>       Target a host directory other than the current one
  -h, --help         Show this help
  -v, --version      Show the installed version
`;

// Resolved relative to the module so it works from both `src` and built `dist`,
// each of which sits one directory below the package root.
function packageVersion(): string {
  const manifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
  return (JSON.parse(readFileSync(manifestPath, "utf8")) as { version: string }).version;
}

// Pulls an optional `--dir <path>` out of argv, returning the resolved host
// directory (default `cwd`) alongside the remaining positional arguments.
function parseHostDir(argv: string[], cwd: string): { hostDir: string; rest: string[] } {
  const index = argv.indexOf("--dir");
  if (index === -1) return { hostDir: cwd, rest: argv };
  const hostDir = argv[index + 1];
  if (hostDir === undefined) throw new Error("the-local: --dir requires a path argument");
  return { hostDir, rest: [...argv.slice(0, index), ...argv.slice(index + 2)] };
}

export function run(argv: string[], cwd: string): number {
  const { hostDir, rest } = parseHostDir(argv, cwd);
  const command = rest[0] ?? "install";
  if (!COMMANDS.has(command)) {
    process.stderr.write(
      `the-local: unknown command "${command}" (expected install, refresh, provider, or build)\n`,
    );
    return 1;
  }

  let result;
  try {
    result = installLocals(hostDir);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
  const { providers, agents } = result;
  for (const provider of providers) {
    process.stdout.write(
      `the-local:   ${provider.packageName} (${provider.prefix}): ${provider.agentFiles.length} agent(s)\n`,
    );
  }
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
  if (command === "--version" || command === "-v") {
    process.stdout.write(`the-local ${packageVersion()}\n`);
    return 0;
  }
  if (command === "--help" || command === "-h") {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === "provider") {
    const { config, created } = scaffoldProvider(target ?? cwd);
    process.stdout.write(
      created
        ? `the-local: scaffolded provider "${config.prefix}" — edit the-local.config.js, then run the-local build.\n`
        : `the-local: the-local.config.js already exists; run the-local build to re-render.\n`,
    );
    return 0;
  }
  if (command === "build") {
    const written = await buildProvider(target ?? cwd);
    process.stdout.write(`the-local: rendered ${written.length} agent(s).\n`);
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
