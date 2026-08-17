import { describe, expect, it } from "vitest";

import { creatorPrompt, creatorPromptPath } from "../src/creators.js";

describe("creator prompt location", () => {
  it("stays outside the agents directory a host installs from", () => {
    expect(creatorPromptPath("info")).not.toContain("the-local/agents");
  });
});

describe("install creator", () => {
  it("writes the install local to the provider's agents directory", () => {
    expect(creatorPrompt("install")).toContain("the-local/agents/<prefix>-install.md");
  });

  it("takes its assignment from the interface manifest", () => {
    expect(creatorPrompt("install")).toContain("Read `the-local/interface.json` first");
  });

  it("verifies against the declared sources", () => {
    expect(creatorPrompt("install")).toContain("Read the files under `sources`");
  });

  it("fixes the tools line the install local gets", () => {
    expect(creatorPrompt("install")).toContain("tools: Bash, Read, Edit");
  });

  it("fixes the body sections the install local gets", () => {
    expect(creatorPrompt("install")).toContain("## How to use it");
  });

  it("cuts everything that is not a step", () => {
    expect(creatorPrompt("install")).toContain("Cut every sentence that is not a step");
  });

  it("checks every declared entry point made it in", () => {
    expect(creatorPrompt("install")).toContain("## Before you finish");
  });
});

describe("develop creator", () => {
  it("writes the develop local to the provider's agents directory", () => {
    expect(creatorPrompt("develop")).toContain("the-local/agents/<prefix>-develop.md");
  });

  it("takes its assignment from the interface manifest", () => {
    expect(creatorPrompt("develop")).toContain("Read `the-local/interface.json` first");
  });

  it("verifies against the declared sources", () => {
    expect(creatorPrompt("develop")).toContain("Read the files under `sources`");
  });

  it("fixes the tools line the develop local gets", () => {
    expect(creatorPrompt("develop")).toContain("tools: Read, Write, Edit, Grep");
  });

  it("fixes the body sections the develop local gets", () => {
    expect(creatorPrompt("develop")).toContain("## How to use it");
  });

  it("cuts everything that is not a step", () => {
    expect(creatorPrompt("develop")).toContain("Cut every sentence that is not a step");
  });

  it("checks every declared entry point made it in", () => {
    expect(creatorPrompt("develop")).toContain("## Before you finish");
  });
});

describe("info creator", () => {
  it("writes the info local to the provider's agents directory", () => {
    expect(creatorPrompt("info")).toContain("the-local/agents/<prefix>-info.md");
  });

  it("takes its assignment from the interface manifest", () => {
    expect(creatorPrompt("info")).toContain("Read `the-local/interface.json` first");
  });

  it("verifies against the declared sources", () => {
    expect(creatorPrompt("info")).toContain("Read the files under `sources`");
  });

  it("fixes the tools line the info local gets", () => {
    expect(creatorPrompt("info")).toContain("tools: Read\n");
  });

  it("fixes the body sections the info local gets", () => {
    expect(creatorPrompt("info")).toContain("## How to use it");
  });

  it("cuts everything that is not a fact the reader needs", () => {
    expect(creatorPrompt("info")).toContain("Cut every sentence that is not a fact");
  });

  it("checks no other facet's entry points leaked in", () => {
    expect(creatorPrompt("info")).toContain("## Before you finish");
  });
});
