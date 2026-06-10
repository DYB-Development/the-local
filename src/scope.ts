export interface ScopeInput {
  providerNames: string[];
  directDependencies: string[];
  installedPackages: string[];
}

export function allowedProviders(input: ScopeInput): string[] {
  const { providerNames, directDependencies, installedPackages } = input;
  return [...new Set(providerNames)].filter(
    (name) => directDependencies.includes(name) || !installedPackages.includes(name),
  );
}
