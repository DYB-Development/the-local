import { describe, expect, it } from "vitest";
import { companionAgents } from "../src/companion.js";
import { reference } from "../src/reference.js";

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
});
