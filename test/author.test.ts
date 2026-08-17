import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { authorProvider } from "../src/author.js";
import { creatorPrompt } from "../src/creators.js";
import { tmpDir } from "./helpers.js";

function writeAuthorablePackage(dir: string): void {
  mkdirSync(join(dir, "the-local"), { recursive: true });
  writeFileSync(join(dir, "the-local", "interface.json"), JSON.stringify({ sources: [] }));
}

describe("authoring without a declared interface", () => {
  it("refuses to run", () => {
    expect(() => authorProvider(tmpDir(), () => undefined)).toThrow(
      "declare this package's public interface",
    );
  });
});

describe("authoring a provider's locals", () => {
  it("feeds the creator prompts in the order info, install, develop", () => {
    const dir = tmpDir();
    writeAuthorablePackage(dir);
    const prompts: string[] = [];

    authorProvider(dir, (prompt) => prompts.push(prompt));

    expect(prompts).toEqual((["info", "install", "develop"] as const).map(creatorPrompt));
  });
});
