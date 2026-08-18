import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

  it("lists the check command", async () => {
    const stdout = captureStdout();
    await main(["--help"], tmpDir());
    stdout.restore();
    expect(stdout.output()).toContain("check");
  });

  it("lists the author command", async () => {
    const stdout = captureStdout();
    await main(["--help"], tmpDir());
    stdout.restore();
    expect(stdout.output()).toContain("author");
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

  it("returns a non-zero code when no path follows the flag", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["install", "--dir"], tmpDir());
    stderr.mockRestore();

    expect(code).toBe(1);
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

  it("returns a non-zero code when the target directory is not a package", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["provider"], tmpDir());
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("names the directory that holds no package manifest", async () => {
    const dir = tmpDir();
    let message = "";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      message += String(chunk);
      return true;
    });
    await main(["provider"], dir);
    stderr.mockRestore();

    expect(message).toContain(`the-local: no package.json in ${dir}`);
  });
});

function writeCheckablePackage(dir: string): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "keystone", version: "0.0.0" }));
  mkdirSync(join(dir, "the-local", "agents"), { recursive: true });
  writeFileSync(
    join(dir, "the-local", "agents", "keystone-info.md"),
    [
      "---",
      "name: keystone-info",
      "description: what keystone owns",
      "tools: Read",
      "scope: Keystone UI components",
      "---",
      "",
      "## What",
      "## Interface",
      "## How to use it",
      "## Conventions",
      "",
    ].join("\n"),
  );
}

describe("check command", () => {
  it("returns zero when the provider's locals hold the format", async () => {
    const dir = tmpDir();
    writeCheckablePackage(dir);

    const stdout = captureStdout();
    const code = await main(["check"], dir);
    stdout.restore();

    expect(code).toBe(0);
  });

  it("prints a success line when the provider's locals hold the format", async () => {
    const dir = tmpDir();
    writeCheckablePackage(dir);

    const stdout = captureStdout();
    await main(["check"], dir);
    stdout.restore();

    expect(stdout.output()).toContain("the-local: locals hold the format");
  });

  it("returns a non-zero code when a local is malformed", async () => {
    const dir = tmpDir();
    writeCheckablePackage(dir);
    writeFileSync(join(dir, "the-local", "agents", "keystone-info.md"), "## What\n");

    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const stdout = captureStdout();
    const code = await main(["check"], dir);
    stdout.restore();
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("names each problem it found", async () => {
    const dir = tmpDir();
    writeCheckablePackage(dir);
    writeFileSync(join(dir, "the-local", "agents", "keystone-info.md"), "## What\n");

    let message = "";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      message += String(chunk);
      return true;
    });
    const stdout = captureStdout();
    await main(["check"], dir);
    stdout.restore();
    stderr.mockRestore();

    expect(message).toContain("keystone-info.md: missing key: name");
  });

  it("returns a non-zero code when the package declares an interface but ships no locals", async () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "keystone", version: "0.0.0" }));
    mkdirSync(join(dir, "the-local"), { recursive: true });
    writeFileSync(
      join(dir, "the-local", "interface.json"),
      JSON.stringify({ scope: "Keystone UI components" }),
    );

    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const stdout = captureStdout();
    const code = await main(["check"], dir);
    stdout.restore();
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("returns a non-zero code when the target directory is not a package", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["check"], tmpDir());
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("names the directory that holds no package manifest", async () => {
    const dir = tmpDir();
    let message = "";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      message += String(chunk);
      return true;
    });
    await main(["check"], dir);
    stderr.mockRestore();

    expect(message).toContain(`the-local: no package.json in ${dir}`);
  });

  it("checks the given directory instead of cwd", async () => {
    const packageDir = tmpDir();
    writeCheckablePackage(packageDir);

    const stdout = captureStdout();
    const code = await main(["check", packageDir], tmpDir());
    stdout.restore();

    expect(code).toBe(0);
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

function writeAuthorablePackage(dir: string): void {
  mkdirSync(join(dir, "the-local"), { recursive: true });
  writeFileSync(join(dir, "the-local", "interface.json"), JSON.stringify({ sources: [] }));
}

describe("author command", () => {
  it("returns zero after authoring the provider's locals", async () => {
    const dir = tmpDir();
    writeAuthorablePackage(dir);

    const stdout = captureStdout();
    const code = await main(["author"], dir, () => undefined);
    stdout.restore();

    expect(code).toBe(0);
  });

  it("tells the author to review the locals and check them", async () => {
    const dir = tmpDir();
    writeAuthorablePackage(dir);

    const stdout = captureStdout();
    await main(["author"], dir, () => undefined);
    stdout.restore();

    expect(stdout.output()).toContain("review the-local/agents/ and run `the-local check`");
  });

  it("returns a non-zero code when the interface is not declared", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["author"], tmpDir(), () => undefined);
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("tells the author to declare the interface first", async () => {
    let message = "";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      message += String(chunk);
      return true;
    });
    await main(["author"], tmpDir(), () => undefined);
    stderr.mockRestore();

    expect(message).toContain("declare this package's public interface");
  });

  it("returns a non-zero code when a creator run fails", async () => {
    const dir = tmpDir();
    writeAuthorablePackage(dir);
    const failing = (): never => {
      throw new Error("the-local: the creator run failed");
    };

    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await main(["author"], dir, failing);
    stderr.mockRestore();

    expect(code).toBe(1);
  });

  it("authors the given directory instead of cwd", async () => {
    const packageDir = tmpDir();
    writeAuthorablePackage(packageDir);
    const directories: string[] = [];

    const stdout = captureStdout();
    await main(["author", packageDir], tmpDir(), (_prompt, dir) => directories.push(dir));
    stdout.restore();

    expect(directories).toEqual([packageDir, packageDir, packageDir]);
  });
});
