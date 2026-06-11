import { describe, expect, it } from "vitest";
import { toMarkdown } from "../src/agent.js";

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
});
