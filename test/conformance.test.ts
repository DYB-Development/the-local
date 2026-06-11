import { describe, expect, it } from "vitest";
import { toMarkdown } from "../src/agent.js";
import { delegationRule } from "../src/trigger.js";

// Golden fixtures captured verbatim from the Ruby gem (the_local) so the TS port
// stays byte-identical. See docs/contract.md and the_local#38.

const AGENT_MARKDOWN = `---
name: keystone-scaffold
description: Use PROACTIVELY for UI work.
tools: Read, Write, Edit
---

You build UI.

API docs.
`;

const DELEGATION_RULE = `<!-- the_local:begin -->
## Delegate to your locals

This project has installed expert subagents. Before doing work yourself,
check whether a local owns it and delegate — never work from memory on
something a local covers:

- UI — pages, forms, tables → keystone-* agents

See each agent's description for specifics.
<!-- the_local:end -->`;

describe("contract conformance", () => {
  it("renders the agent .md byte-for-byte as the Ruby gem does", () => {
    expect(
      toMarkdown({
        prefix: "keystone",
        name: "scaffold",
        description: "Use PROACTIVELY for UI work.",
        tools: "Read, Write, Edit",
        body: "You build UI.",
        knowledge: "API docs.",
      }),
    ).toBe(AGENT_MARKDOWN);
  });

  it("renders the CLAUDE.md delegation block byte-for-byte as the Ruby gem does", () => {
    expect(delegationRule([{ prefix: "keystone", scope: "UI — pages, forms, tables" }])).toBe(
      DELEGATION_RULE,
    );
  });
});
