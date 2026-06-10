import { describe, expect, it } from "vitest";
import { allowedProviders } from "../src/scope.js";

describe("scope", () => {
  it("includes a direct-dependency provider", () => {
    expect(
      allowedProviders({
        providerNames: ["keystone_ui"],
        directDependencies: ["keystone_ui"],
        installedPackages: ["keystone_ui"],
      }),
    ).toEqual(["keystone_ui"]);
  });

  it("excludes a transitive provider", () => {
    expect(
      allowedProviders({
        providerNames: ["transitive_pkg"],
        directDependencies: ["keystone_ui"],
        installedPackages: ["keystone_ui", "transitive_pkg"],
      }),
    ).toEqual([]);
  });

  it("includes the app itself, a provider that is not an installed package", () => {
    expect(
      allowedProviders({
        providerNames: ["my_app"],
        directDependencies: ["keystone_ui"],
        installedPackages: ["keystone_ui"],
      }),
    ).toEqual(["my_app"]);
  });
});
