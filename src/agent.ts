export interface Agent {
  prefix: string;
  name: string;
  description: string;
  tools: string;
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
    "---",
    "",
    agent.body,
    "",
    knowledge,
    "",
  ].join("\n");
}
