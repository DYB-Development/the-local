import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

export function scaffoldProvider(packageDir: string): { prefix: string } {
  const manifestPath = join(packageDir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown> & {
    name: string;
  };

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
