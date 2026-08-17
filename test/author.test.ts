import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { authorProvider, claudeCommand, runClaude } from "../src/author.js";
import { creatorPrompt } from "../src/creators.js";
import { tmpDir } from "./helpers.js";

function writeAuthorablePackage(dir: string): void {
  mkdirSync(join(dir, "the-local"), { recursive: true });
  writeFileSync(join(dir, "the-local", "interface.json"), JSON.stringify({ sources: [] }));
}

function runsBeforeFailure(): number {
  const dir = tmpDir();
  writeAuthorablePackage(dir);
  let runs = 0;
  try {
    authorProvider(dir, () => {
      runs += 1;
      throw new Error("the creator run failed");
    });
  } catch {
    return runs;
  }
  return runs;
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

  it("runs every creator in the provider directory", () => {
    const dir = tmpDir();
    writeAuthorablePackage(dir);
    const directories: string[] = [];

    authorProvider(dir, (_prompt, runDir) => directories.push(runDir));

    expect(directories).toEqual([dir, dir, dir]);
  });

  it("stops at the first failed run", () => {
    expect(runsBeforeFailure()).toBe(1);
  });
});

describe("the claude invocation", () => {
  it("passes the prompt to a headless run that may read, grep, and write", () => {
    expect(claudeCommand("AUTHOR")).toEqual([
      "claude",
      "-p",
      "--allowedTools",
      "Read,Grep,Write",
      "--permission-mode",
      "acceptEdits",
      "--",
      "AUTHOR",
    ]);
  });
});

describe("a failed creator run", () => {
  it("names the directory and the CLI the author needs", () => {
    expect(() => runClaude("AUTHOR", join(tmpDir(), "missing"))).toThrow(
      "is the `claude` CLI installed?",
    );
  });
});
