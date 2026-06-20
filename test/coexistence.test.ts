import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeTrigger } from "../src/installer.js";
import { writeProcessDoc } from "../src/process.js";
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

const GEM_DELEGATION_BLOCK = `<!-- the_local:begin -->
GEM-AUTHORED DELEGATION — rails_local owns Ruby work.
<!-- the_local:end -->`;

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

  it("writes the process block without touching a gem delegation block", () => {
    const dir = tmpDir();
    const path = seed(dir, `${GEM_DELEGATION_BLOCK}\n`);
    writeProcessDoc(dir);
    expect(readFileSync(path, "utf8")).toContain(GEM_DELEGATION_BLOCK);
  });

  it("preserves host prose between both managed regions when both writers run", () => {
    const dir = tmpDir();
    const prose = "## House rules\n\nHand-written notes the host owns.";
    const path = seed(dir, `${GEM_DELEGATION_BLOCK}\n\n${prose}\n\n${GEM_PROCESS_BLOCK}\n`);
    writeTrigger(dir, [{ prefix: "keystone", scope: "UI" }]);
    writeProcessDoc(dir);
    expect(readFileSync(path, "utf8")).toContain(prose);
  });
});
