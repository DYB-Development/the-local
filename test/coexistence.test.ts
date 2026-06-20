import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeTrigger } from "../src/installer.js";
import { tmpDir } from "./helpers.js";

// Cross-language seam (the_local#38 open question #4): a polyglot host's
// CLAUDE.md carries blocks authored by both the Ruby `the_local` gem and the TS
// `the-local` package. Each tool owns one marker pair and must leave the other
// pair — and any prose between them — byte-for-byte intact. The blocks below
// stand in for gem-authored content the TS renderer would never reproduce, so a
// surviving byte proves isolation rather than a coincidental re-render. The
// `the_local:begin` marker is deliberately NOT a substring of
// `the_local:process:begin`, so neither merge regex can swallow the other block.

const GEM_PROCESS_BLOCK = `<!-- the_local:process:begin -->
GEM-AUTHORED PROCESS RULES — the npm package must not touch this.
<!-- the_local:process:end -->`;

function seed(dir: string, contents: string): string {
  const path = join(dir, "CLAUDE.md");
  writeFileSync(path, contents);
  return path;
}

describe("cross-language marker coexistence", () => {
  it("rewrites the delegation block without touching a gem process block", () => {
    const dir = tmpDir();
    const path = seed(dir, `${GEM_PROCESS_BLOCK}\n`);
    writeTrigger(dir, [{ prefix: "keystone", scope: "UI" }]);
    expect(readFileSync(path, "utf8")).toContain(GEM_PROCESS_BLOCK);
  });
});
