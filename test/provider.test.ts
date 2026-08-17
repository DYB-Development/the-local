import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prefixFromName, scaffoldProvider } from "../src/provider.js";
import { tmpDir } from "./helpers.js";

function newPackage(name = "@event-engine/core"): string {
  const dir = tmpDir();
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version: "0.0.0" }, null, 2));
  return dir;
}

function readPackage(dir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
}

describe("prefixFromName", () => {
  it("drops the npm scope so @event-engine/core becomes core", () => {
    expect(prefixFromName("@event-engine/core")).toBe("core");
  });
});

describe("scaffoldProvider", () => {
  it("writes no the-local.config.js", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    expect(existsSync(join(dir, "the-local.config.js"))).toBe(false);
  });

  it("declares the the-local provider block in package.json", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    expect(readPackage(dir)["the-local"]).toMatchObject({
      prefix: "core",
      agentsDir: "the-local/agents",
    });
  });

  it("adds the agents dir to the files allowlist so it publishes", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    expect(readPackage(dir).files).toContain("the-local/agents");
  });

  it("preserves an authored scope on a second run", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    const manifest = readPackage(dir);
    (manifest["the-local"] as Record<string, unknown>).scope = "Event sourcing — aggregates";
    writeFileSync(join(dir, "package.json"), JSON.stringify(manifest, null, 2));

    scaffoldProvider(dir);

    expect((readPackage(dir)["the-local"] as Record<string, unknown>).scope).toBe(
      "Event sourcing — aggregates",
    );
  });

  it("renders no agents", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    expect(existsSync(join(dir, "the-local/agents/core-info.md"))).toBe(false);
  });
});
