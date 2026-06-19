import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseDeclaration } from "./manifest.js";

export interface DiscoveredProvider {
  packageName: string;
  prefix: string;
  scope: string | null;
  agentFiles: string[];
}

interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  "the-local"?: { prefix?: string; scope?: string | null; agentsDir?: string };
}

function readManifest(packageJsonPath: string): PackageManifest | null {
  if (!existsSync(packageJsonPath)) return null;
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageManifest;
}

export function directDependencies(hostDir: string): string[] {
  const manifest = readManifest(join(hostDir, "package.json"));
  // Scope mirrors the Ruby gem's Bundler direct deps (which include the
  // :development group): runtime `dependencies` plus build-time
  // `devDependencies`. peer/optional are deliberately excluded — they are not
  // packages the host installs as its own direct tooling.
  return [
    ...new Set([
      ...Object.keys(manifest?.dependencies ?? {}),
      ...Object.keys(manifest?.devDependencies ?? {}),
    ]),
  ];
}

// Walk up the ancestor `node_modules` chain to locate a dependency. pnpm/yarn/
// npm workspaces hoist a host package's direct dependency up to the workspace
// root's `node_modules`, so a direct dep is not always in the host's own
// `node_modules`. This mirrors the effect Bundler's flat resolution gives the
// Ruby gem for free.
function resolvePackageDir(hostDir: string, dependency: string): string | null {
  let current = hostDir;
  for (;;) {
    const candidate = join(current, "node_modules", dependency);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function discoverProviders(hostDir: string): DiscoveredProvider[] {
  const providers: DiscoveredProvider[] = [];

  for (const dependency of directDependencies(hostDir)) {
    const packageDir = resolvePackageDir(hostDir, dependency);
    if (!packageDir) continue;
    const manifest = readManifest(join(packageDir, "package.json"));
    if (!manifest || manifest["the-local"] === undefined) continue;

    const declaration = parseDeclaration(manifest["the-local"], dependency);
    const agentsDir = join(packageDir, declaration.agentsDir);
    if (!existsSync(agentsDir)) {
      throw new Error(
        `the-local: ${dependency} declares the-local locals but ships no committed agents at ` +
          `${declaration.agentsDir}. Build and commit them in ${dependency}.`,
      );
    }

    const agentFiles = readdirSync(agentsDir)
      .filter((entry) => entry.endsWith(".md"))
      .sort()
      .map((entry) => join(agentsDir, entry));

    providers.push({
      packageName: dependency,
      prefix: declaration.prefix,
      scope: declaration.scope,
      agentFiles,
    });
  }

  return providers;
}
