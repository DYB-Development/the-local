import { describe, expect, it } from "vitest";
import { type Agent, agentFilename, scopeFromFrontMatter, toMarkdown } from "../src/agent.js";

function build(overrides: Partial<Agent> = {}): Agent {
  return {
    prefix: "keystone",
    name: "scaffold",
    description: "Use PROACTIVELY for UI work.",
    tools: "Read, Write, Edit",
    scope: "UI — pages, forms, tables",
    body: "You build UI.",
    knowledge: "API docs.",
    ...overrides,
  };
}

describe("agent", () => {
  it("namespaces the agent filename under its prefix", () => {
    expect(agentFilename(build())).toBe("keystone-scaffold.md");
  });

  it("opens the markdown with YAML frontmatter", () => {
    expect(toMarkdown(build())).toMatch(
      /^---\nname: keystone-scaffold\ndescription: Use PROACTIVELY for UI work\.\ntools: Read, Write, Edit\nscope: UI — pages, forms, tables\n---\n/,
    );
  });

  it("leaves the scope value empty when the agent has none", () => {
    expect(toMarkdown(build({ scope: undefined }))).toContain("tools: Read, Write, Edit\nscope: \n");
  });

  it("includes the role body after the frontmatter", () => {
    expect(toMarkdown(build({ body: "You build UI from helpers." }))).toContain(
      "You build UI from helpers.",
    );
  });

  it("appends string knowledge", () => {
    expect(toMarkdown(build({ knowledge: "THE-API-REFERENCE" }))).toContain("THE-API-REFERENCE");
  });

  it("joins array knowledge with a blank line", () => {
    expect(toMarkdown(build({ knowledge: ["REFERENCE-BLOB", "RECIPES-BLOB"] }))).toContain(
      "REFERENCE-BLOB\n\nRECIPES-BLOB",
    );
  });
});

describe("scopeFromFrontMatter", () => {
  it("reads the scope declared in the front matter", () => {
    expect(scopeFromFrontMatter(toMarkdown(build()))).toBe("UI — pages, forms, tables");
  });
});
