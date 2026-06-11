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
  {
    prefix: PREFIX,
    name: "install",
    description: "Use to add the-local to a host app and set it up correctly.",
    tools: "Bash, Read, Edit",
    body:
      "You set the-local up in a host package or app, following the reference's " +
      "install section exactly: add the-local to the host's dependencies, install, " +
      "run `the-local install` to sync locals into .claude/agents/ and write the " +
      "delegation trigger, and re-run it after dependency changes. You do not " +
      "invent steps the reference does not list.",
    knowledge: reference,
  },
  {
    prefix: PREFIX,
    name: "develop",
    description:
      "Use PROACTIVELY to turn a package into a the-local provider — declaring " +
      "the provider block, authoring the locals, and committing the rendered " +
      "agents. MUST BE USED instead of wiring a provider by hand.",
    tools: "Read, Write, Edit, Grep",
    body:
      "You turn a package into a the-local provider following the reference's " +
      "provider-author workflow: add the `the-local` block to package.json, author " +
      "the standard locals (info, install, and a domain worker) with a guide as " +
      "their knowledge, and render each to the-local/agents/. The deliverable is " +
      "the committed, shipped the-local/agents/*.md — that is the whole contract a " +
      "host reads from disk; a host never loads the package, so unless those files " +
      "are committed and in package.json's files allowlist, the package contributes " +
      "nothing. You keep them in sync with toMarkdown.",
    knowledge: reference,
  },
];
