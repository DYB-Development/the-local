import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_AGENTS_DIR = "the-local/agents";

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

export function discoverProviders(hostDir: string): DiscoveredProvider[] {
  const nodeModulesDir = join(hostDir, "node_modules");
  const providers: DiscoveredProvider[] = [];

  for (const dependency of directDependencies(hostDir)) {
    const packageDir = join(nodeModulesDir, dependency);
    const manifest = readManifest(join(packageDir, "package.json"));
    const declaration = manifest?.["the-local"];
    if (!manifest || !declaration) continue;

    const prefix = declaration.prefix ?? dependency;
    const agentsDir = join(packageDir, declaration.agentsDir ?? DEFAULT_AGENTS_DIR);
    if (!existsSync(agentsDir)) {
      throw new Error(
        `the-local: ${dependency} declares the-local locals but ships no committed agents at ` +
          `${declaration.agentsDir ?? DEFAULT_AGENTS_DIR}. Build and commit them in ${dependency}.`,
      );
    }

    const agentFiles = readdirSync(agentsDir)
      .filter((entry) => entry.endsWith(".md"))
      .sort()
      .map((entry) => join(agentsDir, entry));

    providers.push({ packageName: dependency, prefix, scope: declaration.scope ?? null, agentFiles });
  }

  return providers;
}
