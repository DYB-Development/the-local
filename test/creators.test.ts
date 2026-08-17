import { describe, expect, it } from "vitest";

import { creatorPrompt } from "../src/creators.js";

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
});
