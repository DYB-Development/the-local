import { existsSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { isEntrypoint, main, run } from "../src/cli.js";
import { tmpDir, writeHost, writeProvider } from "./helpers.js";

function captureStdout(): { output: () => string; restore: () => void } {
  let buffer = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    buffer += String(chunk);
    return true;
  });
  return { output: () => buffer, restore: () => spy.mockRestore() };
}

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

describe("--version", () => {
  it("prints the package version", async () => {
    const stdout = captureStdout();
    await main(["--version"], tmpDir());
    stdout.restore();
    const version = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8")).version;
    expect(stdout.output()).toContain(version);
  });
});

describe("--help", () => {
  it("lists the available commands", async () => {
    const stdout = captureStdout();
    await main(["--help"], tmpDir());
    stdout.restore();
    expect(stdout.output()).toContain("install");
  });
});

describe("--dir", () => {
  it("installs into the given host directory instead of cwd", async () => {
    const host = tmpDir();
    writeHost(host, ["keystone_ui"]);
    writeProvider(join(host, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold", content: "AGENT" }],
    });

    await main(["install", "--dir", host], tmpDir());

    expect(existsSync(join(host, ".claude/agents/keystone-scaffold.md"))).toBe(true);
  });
});

describe("provider command", () => {
  it("scaffolds the current package as a provider", async () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@event-engine/store", version: "0.0.0" }));
    await main(["provider"], dir);
    expect(existsSync(join(dir, "the-local.config.js"))).toBe(true);
  });
});

describe("build command", () => {
  it("re-renders a provider's agents from its config", async () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@event-engine/store", version: "0.0.0" }));
    const agent = { name: "info", description: "D", tools: "Read", body: "B", knowledge: "K" };
    writeFileSync(
      join(dir, "the-local.config.js"),
      `export default ${JSON.stringify({ prefix: "store", agents: [agent] })};\n`,
    );

    await main(["build"], dir);

    expect(existsSync(join(dir, "the-local/agents/store-info.md"))).toBe(true);
  });
});
