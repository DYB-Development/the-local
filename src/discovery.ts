import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDeclaration } from "./manifest.js";
import { allowedProviders } from "./scope.js";

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

function prefixFromAgentFiles(agentFiles: string[]): string | null {
  for (const file of agentFiles) {
    const name = basename(file, ".md");
    const separator = name.lastIndexOf("-");
    if (separator > 0) return name.slice(0, separator);
  }
  return null;
}

function providerFrom(packageDir: string, packageName: string): DiscoveredProvider | null {
  const manifest = readManifest(join(packageDir, "package.json"));
  if (!manifest) return null;

  const declared = manifest["the-local"] !== undefined;
  const declaration = parseDeclaration(manifest["the-local"] ?? {}, packageName);
  const agentsDir = join(packageDir, declaration.agentsDir);
  if (!existsSync(agentsDir)) {
    if (!declared) return null;
    throw new Error(
      `the-local: ${packageName} declares the-local locals but ships no committed agents at ` +
        `${declaration.agentsDir}. Build and commit them in ${packageName}.`,
    );
  }

  const agentFiles = readdirSync(agentsDir)
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => join(agentsDir, entry));
  if (!declared && agentFiles.length === 0) return null;

  return {
    packageName,
    prefix: declaration.prefix ?? prefixFromAgentFiles(agentFiles) ?? packageName,
    scope: declaration.scope,
    agentFiles,
  };
}

function ownPackageName(): string | undefined {
  return readManifest(fileURLToPath(new URL("../package.json", import.meta.url)))?.name;
}

function hostProvider(hostDir: string): DiscoveredProvider | null {
  const name = readManifest(join(hostDir, "package.json"))?.name;
  if (name === undefined || name === ownPackageName()) return null;
  return providerFrom(hostDir, name);
}

export function discoverProviders(hostDir: string): DiscoveredProvider[] {
  const dependencies = directDependencies(hostDir);
  const installed: string[] = [];
  const candidates: DiscoveredProvider[] = [];

  for (const dependency of dependencies) {
    const packageDir = resolvePackageDir(hostDir, dependency);
    if (!packageDir) continue;
    installed.push(dependency);
    const provider = providerFrom(packageDir, dependency);
    if (provider) candidates.push(provider);
  }

  const host = hostProvider(hostDir);
  if (host) candidates.push(host);

  const allowed = new Set(
    allowedProviders({
      providerNames: candidates.map((provider) => provider.packageName),
      directDependencies: dependencies,
      installedPackages: installed,
    }),
  );
  return candidates.filter((provider) => allowed.has(provider.packageName));
}
