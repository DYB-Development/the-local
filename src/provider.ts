import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Agent, agentFilename, toMarkdown } from "./agent.js";

const DEFAULT_AGENTS_DIR = "the-local/agents";

// The agent filename namespace defaults to the package name with any npm scope
// dropped: `@event-engine/core` -> `core`.
export function prefixFromName(packageName: string): string {
  return packageName.replace(/^@[^/]+\//, "");
}

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

const CONFIG_FILE = "the-local.config.js";

// The starter config a freshly-scaffolded provider gets: the standard interface
// of a read-only `info` explainer and a `develop` domain worker, with TODO
// placeholders the author fills in. Mirrors the Ruby provider generator.
export function starterConfig(packageName: string): ProviderConfig {
  const prefix = prefixFromName(packageName);
  const knowledge = `## ${prefix}\n\nTODO: document ${packageName} — what it does, how to use it, the conventions to enforce.`;
  return {
    prefix,
    scope: `TODO: one-line phrase describing ${packageName}'s domain`,
    agents: [
      {
        name: "info",
        description: `Use to learn what ${packageName} offers and how to use it.`,
        tools: "Read",
        body: `You explain ${packageName}, answering only from the reference. You make no changes.`,
        knowledge,
      },
      {
        name: "develop",
        description: `Use PROACTIVELY for work involving ${packageName}.`,
        tools: "Read, Write, Edit, Grep",
        body: `You do work involving ${packageName}, following the reference's conventions exactly.`,
        knowledge,
      },
    ],
  };
}

// Scaffold the provider side into a package: write a starter config (without
// clobbering an authored one). Later cycles wire package.json and render.
export function scaffoldProvider(packageDir: string): { config: ProviderConfig } {
  const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as {
    name: string;
  };
  const config = starterConfig(manifest.name);

  const configPath = join(packageDir, CONFIG_FILE);
  if (!existsSync(configPath)) {
    writeFileSync(configPath, `export default ${JSON.stringify(config, null, 2)};\n`);
  }

  return { config };
}
