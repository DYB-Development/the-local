import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public entry", () => {
  it("no longer re-exports the companion agents", () => {
    expect("companionAgents" in api).toBe(false);
  });

  it("no longer re-exports the reference blob", () => {
    expect("reference" in api).toBe(false);
  });

  it("re-exports the provider-authoring API", () => {
    expect(typeof api.scaffoldProvider).toBe("function");
  });

  it("no longer re-exports the develop-process writer", () => {
    expect("writeProcessDoc" in api).toBe(false);
  });

  it("re-exports the interface manifest reader", () => {
    expect(typeof api.readInterface).toBe("function");
  });

  it("re-exports the creator prompt reader", () => {
    expect(typeof api.creatorPrompt).toBe("function");
  });
});
