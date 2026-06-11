import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toMarkdown } from "../src/agent.js";
import { prefixFromName, renderProvider } from "../src/provider.js";
import { tmpDir } from "./helpers.js";

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
