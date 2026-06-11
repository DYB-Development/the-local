import { existsSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { isEntrypoint, run } from "../src/cli.js";
import { tmpDir, writeHost, writeProvider } from "./helpers.js";

describe("isEntrypoint", () => {
  it("matches when the module is invoked through a symlinked bin", () => {
    const dir = tmpDir();
    const real = join(dir, "cli.js");
    const link = join(dir, "the-local");
    writeFileSync(real, "");
    symlinkSync(real, link);
    const moduleUrl = pathToFileURL(realpathSync(real)).href;
    expect(isEntrypoint(moduleUrl, link)).toBe(true);
  });
});

describe("cli run", () => {
  it("returns a non-zero code for an unknown command", () => {
    expect(run(["bogus"], tmpDir())).toBe(1);
  });

  it("installs a host's locals and returns zero", () => {
    const dir = tmpDir();
    writeHost(dir, ["keystone_ui"]);
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold", content: "AGENT" }],
    });

    expect(run(["install"], dir)).toBe(0);
    expect(readFileSync(join(dir, ".claude/agents/keystone-scaffold.md"), "utf8")).toBe("AGENT");
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(true);
  });
});
