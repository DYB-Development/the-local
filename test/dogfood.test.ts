import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkProvider } from "../src/check.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

describe("the-local's own locals", () => {
  it("satisfies the check it asks every provider to pass", () => {
    expect(checkProvider(packageRoot)).toEqual([]);
  });
});
