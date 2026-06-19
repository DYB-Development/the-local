import { describe, expect, it } from "vitest";
import { parseDeclaration } from "../src/manifest.js";

describe("parseDeclaration", () => {
  it("returns the declared prefix", () => {
    expect(parseDeclaration({ prefix: "keystone" }, "keystone_ui").prefix).toBe("keystone");
  });

  it("rejects a non-object declaration", () => {
    expect(() => parseDeclaration("keystone", "keystone_ui")).toThrow(
      /the-local: keystone_ui has a "the-local" declaration that is not an object/,
    );
  });

  it("rejects a non-string prefix", () => {
    expect(() => parseDeclaration({ prefix: 7 }, "keystone_ui")).toThrow(
      /the-local: keystone_ui "the-local"\.prefix must be a non-empty string/,
    );
  });

  it("rejects an empty agentsDir", () => {
    expect(() => parseDeclaration({ agentsDir: "" }, "keystone_ui")).toThrow(
      /the-local: keystone_ui "the-local"\.agentsDir must be a non-empty string/,
    );
  });
});
