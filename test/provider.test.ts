import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toMarkdown } from "../src/agent.js";
import { prefixFromName, renderProvider, scaffoldProvider } from "../src/provider.js";
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

// renderProvider turns a provider's plain-data config into the committed `.md`
// files a host installs — the same render the-local uses for its own companion,
// generalised to any package.

describe("renderProvider", () => {
  it("renders each config agent to a committed file under the-local/agents", () => {
    const dir = tmpDir();
    const config = {
      prefix: "core",
      agents: [
        { name: "info", description: "D", tools: "Read", body: "B", knowledge: "K" },
      ],
    };

    renderProvider(config, dir);

    expect(readFileSync(join(dir, "the-local/agents/core-info.md"), "utf8")).toBe(
      toMarkdown({ prefix: "core", name: "info", description: "D", tools: "Read", body: "B", knowledge: "K" }),
    );
  });
});

describe("scaffoldProvider", () => {
  it("writes a starter the-local.config.js using the derived prefix", () => {
    const dir = newPackage();
    scaffoldProvider(dir);
    expect(readFileSync(join(dir, "the-local.config.js"), "utf8")).toContain('"prefix": "core"');
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

  it("renders the starter agents to committed files", () => {
    const dir = newPackage();
    const { config } = scaffoldProvider(dir);
    const info = config.agents.find((a) => a.name === "info");
    expect(readFileSync(join(dir, "the-local/agents/core-info.md"), "utf8")).toBe(
      toMarkdown({ prefix: config.prefix, ...info! }),
    );
  });
});
