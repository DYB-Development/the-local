import { describe, expect, it } from "vitest";

import { authorProvider } from "../src/author.js";
import { tmpDir } from "./helpers.js";

describe("authoring without a declared interface", () => {
  it("refuses to run", () => {
    expect(() => authorProvider(tmpDir(), () => undefined)).toThrow(
      "declare this package's public interface",
    );
  });
});
