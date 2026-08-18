import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { type DiscoveredProvider, discoverProviders } from "./discovery.js";
import { type ProviderTrigger, delegationRule, mergeTrigger } from "./trigger.js";

const AGENTS_DIR = ".claude/agents";

export function installAgents(hostDir: string, providers: DiscoveredProvider[]): string[] {
  const destination = join(hostDir, AGENTS_DIR);
  mkdirSync(destination, { recursive: true });

  const written: string[] = [];
  for (const provider of providers) {
    for (const source of provider.agentFiles) {
      const target = join(destination, basename(source));
      copyFileSync(source, target);
      written.push(target);
    }
  }
  return written;
}

export function writeTrigger(
  hostDir: string,
  providers: ProviderTrigger[],
  filename = "CLAUDE.md",
): void {
  const path = join(hostDir, filename);
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const merged = mergeTrigger(existing, delegationRule(providers));
  writeFileSync(path, `${merged.replace(/\s*$/, "")}\n`);
}

export interface InstallResult {
  providers: DiscoveredProvider[];
  agents: string[];
}

function requireHost(hostDir: string): void {
  if (!existsSync(hostDir)) {
    throw new Error(`the-local: no such directory: ${hostDir}`);
  }
  if (!existsSync(join(hostDir, "package.json"))) {
    throw new Error(
      `the-local: no package.json in ${hostDir}; run this from your application's root directory`,
    );
  }
}

export function installLocals(hostDir: string): InstallResult {
  requireHost(hostDir);
  const providers = discoverProviders(hostDir);
  const agents = installAgents(hostDir, providers);
  writeTrigger(hostDir, providers);
  return { providers, agents };
}
