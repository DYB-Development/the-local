import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Agent, agentFilename, toMarkdown } from "./agent.js";

const DEFAULT_AGENTS_DIR = "the-local/agents";

// A provider's plain-data config: the source of truth the-local renders into the
// committed `.md` files a host installs. Authored as `the-local.config.js` (ESM)
// at the package root, so it has no runtime dependency on the-local itself.
export interface ProviderConfig {
  prefix: string;
  scope?: string;
  agentsDir?: string;
  agents: ProviderAgentSpec[];
}

export type ProviderAgentSpec = Omit<Agent, "prefix">;

// Render each config agent to `<packageDir>/<agentsDir>/<prefix>-<name>.md` and
// return the written paths. Pure apart from the writes — the same render used
// for the-local's own companion, generalised to any provider config.
export function renderProvider(config: ProviderConfig, packageDir: string): string[] {
  const agentsDir = join(packageDir, config.agentsDir ?? DEFAULT_AGENTS_DIR);
  mkdirSync(agentsDir, { recursive: true });

  return config.agents.map((spec) => {
    const agent: Agent = { prefix: config.prefix, ...spec };
    const path = join(agentsDir, agentFilename(agent));
    writeFileSync(path, toMarkdown(agent));
    return path;
  });
}
