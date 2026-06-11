import type { Agent } from "./agent.js";
import { reference } from "./reference.js";

// the-local's own locals — the companion that makes the-local its own provider,
// dogfooding the same model every other provider uses. Each agent carries the
// reference verbatim as its knowledge; the rendered files live committed under
// the-local/agents/ and are what a host installs.

const PREFIX = "the-local";

export const companionAgents: Agent[] = [
  {
    prefix: PREFIX,
    name: "info",
    description:
      "Use to learn how the-local works — providers, the committed-.md install " +
      "model, the delegation trigger, and the direct-dependency scope rule.",
    tools: "Read",
    body:
      "You explain how the-local works, answering only from the reference: " +
      "providers ship committed locals, `the-local install` copies them verbatim " +
      "into a host's .claude/agents/, the CLAUDE.md delegation trigger makes the " +
      "host delegate, and only direct dependencies contribute. You make no changes.",
    knowledge: reference,
  },
];
