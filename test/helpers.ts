import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function tmpDir(prefix = "the-local-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export interface ProviderSpec {
  packageName: string;
  prefix?: string;
  scope?: string | null;
  agentsDir?: string;
  agents?: { name: string; content?: string }[];
  omitAgentsDir?: boolean;
}

export function writeProvider(nodeModulesDir: string, spec: ProviderSpec): void {
  const pkgDir = join(nodeModulesDir, spec.packageName);
  mkdirSync(pkgDir, { recursive: true });
  const prefix = spec.prefix ?? spec.packageName;
  const agentsDir = spec.agentsDir ?? "the-local/agents";
  const manifest = {
    name: spec.packageName,
    version: "0.0.0",
    "the-local": { prefix, scope: spec.scope ?? null, agentsDir },
  };
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify(manifest, null, 2));
  if (spec.omitAgentsDir) return;
  const absAgentsDir = join(pkgDir, agentsDir);
  mkdirSync(absAgentsDir, { recursive: true });
  for (const agent of spec.agents ?? []) {
    writeFileSync(join(absAgentsDir, `${prefix}-${agent.name}.md`), agent.content ?? "stub");
  }
}

export function writeHost(dir: string, deps: string[]): void {
  const dependencies = Object.fromEntries(deps.map((d) => [d, "*"]));
  const manifest = { name: "host-app", version: "0.0.0", dependencies };
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest, null, 2));
}
