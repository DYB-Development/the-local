import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_AGENTS_DIR = "the-local/agents";

// The agent filename namespace defaults to the package name with any npm scope
// dropped: `@event-engine/core` -> `core`.
export function prefixFromName(packageName: string): string {
  return packageName.replace(/^@[^/]+\//, "");
}

type PackageManifest = Record<string, unknown> & { name: string };

function readPackageManifest(packageDir: string): PackageManifest {
  const manifestPath = join(packageDir, "package.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `the-local: no package.json in ${packageDir}; run this from the package's root directory`,
    );
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
}

export function scaffoldProvider(packageDir: string): { prefix: string } {
  const manifestPath = join(packageDir, "package.json");
  const manifest = readPackageManifest(packageDir);

  const declaration = (manifest["the-local"] ?? {}) as { prefix?: string; agentsDir?: string };
  const prefix = declaration.prefix ?? prefixFromName(manifest.name);
  const agentsDir = declaration.agentsDir ?? DEFAULT_AGENTS_DIR;
  manifest["the-local"] = { ...declaration, prefix, agentsDir };

  const files = Array.isArray(manifest.files) ? (manifest.files as string[]) : [];
  if (!files.includes(agentsDir)) files.push(agentsDir);
  manifest.files = files;

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { prefix };
}
