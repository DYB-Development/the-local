import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type Agent, agentFilename, toMarkdown } from "../src/agent.js";
import { companionAgents } from "../src/companion.js";
import { reference } from "../src/reference.js";

function committed(agent: Agent): string {
  return readFileSync(
    fileURLToPath(new URL(`../the-local/agents/${agentFilename(agent)}`, import.meta.url)),
    "utf8",
  );
}

// the-local is its own provider: it ships three companion locals so any host
// that depends on the-local gains experts that explain, install, and extend it.
// Each agent embeds the reference verbatim as its knowledge.

function agent(name: string) {
  return companionAgents.find((candidate) => candidate.name === name);
}

function wiring(name: string) {
  const found = agent(name);
  return found && {
    prefix: found.prefix,
    name: found.name,
    tools: found.tools,
    knowledge: found.knowledge,
  };
}

describe("companion agents", () => {
  it("offers a read-only info explainer", () => {
    expect(wiring("info")).toEqual({
      prefix: "the-local",
      name: "info",
      tools: "Read",
      knowledge: reference,
    });
  });

  it("offers an install agent that can edit the host", () => {
    expect(wiring("install")).toEqual({
      prefix: "the-local",
      name: "install",
      tools: "Bash, Read, Edit",
      knowledge: reference,
    });
  });

  it("offers a develop agent that authors providers", () => {
    expect(wiring("develop")).toEqual({
      prefix: "the-local",
      name: "develop",
      tools: "Read, Write, Edit, Grep",
      knowledge: reference,
    });
  });
});

describe("committed companion files", () => {
  it("renders the-local-info.md from its agent", () => {
    const info = agent("info") as Agent;
    expect(committed(info)).toBe(toMarkdown(info));
  });

  it("renders the-local-install.md from its agent", () => {
    const install = agent("install") as Agent;
    expect(committed(install)).toBe(toMarkdown(install));
  });

  it("renders the-local-develop.md from its agent", () => {
    const develop = agent("develop") as Agent;
    expect(committed(develop)).toBe(toMarkdown(develop));
  });
});
