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

  it("names only the surviving commands when one is unknown", () => {
    let message = "";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      message += String(chunk);
      return true;
    });
    run(["bogus"], tmpDir());
    stderr.mockRestore();

    expect(message).toContain("expected install, refresh, or provider");
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

  it("no longer lists the build command", async () => {
    const stdout = captureStdout();
    await main(["--help"], tmpDir());
    stdout.restore();
    expect(stdout.output()).not.toContain("build");
  });
});

describe("discovery errors", () => {
  it("returns a non-zero code instead of throwing", () => {
    const dir = tmpDir();
    writeHost(dir, ["keystone_ui"]);
    writeProvider(join(dir, "node_modules"), { packageName: "keystone_ui", omitAgentsDir: true });

    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = run(["install"], dir);
    stderr.mockRestore();

    expect(code).toBe(1);
  });
});

describe("install output", () => {
  it("names each provider it installed agents from", () => {
    const dir = tmpDir();
    writeHost(dir, ["keystone_ui"]);
    writeProvider(join(dir, "node_modules"), {
      packageName: "keystone_ui",
      prefix: "keystone",
      agents: [{ name: "scaffold", content: "AGENT" }],
    });

    const stdout = captureStdout();
    run(["install"], dir);
    stdout.restore();

    expect(stdout.output()).toContain("keystone_ui");
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
  it("wires the current package up as a provider without writing a config", async () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@event-engine/store", version: "0.0.0" }));
    const stdout = captureStdout();
    await main(["provider"], dir);
    stdout.restore();
    expect(existsSync(join(dir, "the-local.config.js"))).toBe(false);
  });
});

describe("build command", () => {
  it("is rejected as an unknown command", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["build"], tmpDir());
    stderr.mockRestore();

    expect(code).toBe(1);
  });
});
