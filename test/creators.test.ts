import { describe, expect, it } from "vitest";

import { creatorPrompt } from "../src/creators.js";

describe("install creator", () => {
  it("writes the install local to the provider's agents directory", () => {
    expect(creatorPrompt("install")).toContain("the-local/agents/<prefix>-install.md");
  });
});
