import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards the publishability of the package: these assertions pin the
// package.json fields npm relies on when `the-local` is published and run via
// `npx`. See issue #2.

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as Record<string, unknown>;

describe("package publishability", () => {
  it("is not marked private", () => {
    expect(pkg.private).toBeUndefined();
  });
});
