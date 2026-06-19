import { describe, expect, it } from "vitest";
import { parseDeclaration } from "../src/manifest.js";

describe("parseDeclaration", () => {
  it("returns the declared prefix", () => {
    expect(parseDeclaration({ prefix: "keystone" }, "keystone_ui").prefix).toBe("keystone");
  });
});
