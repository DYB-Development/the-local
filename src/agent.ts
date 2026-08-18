export interface Agent {
  prefix: string;
  name: string;
  description: string;
  tools: string;
  scope?: string;
  body: string;
  knowledge?: string | string[];
}

export function qualifiedName(agent: Pick<Agent, "prefix" | "name">): string {
  return `${agent.prefix}-${agent.name}`;
}

export function agentFilename(agent: Pick<Agent, "prefix" | "name">): string {
  return `${qualifiedName(agent)}.md`;
}

export function toMarkdown(agent: Agent): string {
  const knowledge = Array.isArray(agent.knowledge)
    ? agent.knowledge.join("\n\n")
    : (agent.knowledge ?? "");

  return [
    "---",
    `name: ${qualifiedName(agent)}`,
    `description: ${agent.description}`,
    `tools: ${agent.tools}`,
    `scope: ${agent.scope ?? ""}`,
    "---",
    "",
    agent.body,
    "",
    knowledge,
    "",
  ].join("\n");
}

export function scopeFromFrontMatter(content: string): string | null {
  return /^scope:[ \t]*(.*)$/m.exec(content)?.[1] ?? null;
}
