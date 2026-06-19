const DEFAULT_AGENTS_DIR = "the-local/agents";

// A provider's validated `the-local` declaration, with documented defaults
// applied. This is the locked shape of the `package.json` `"the-local"` block.
export interface Declaration {
  prefix: string;
  scope: string | null;
  agentsDir: string;
}

// An optional declaration field, when present, must be a non-empty string;
// otherwise the provider is misconfigured. Absent (`undefined`) is fine — the
// caller applies the documented default.
function requireNonEmptyString(value: unknown, field: string, packageName: string): void {
  if (value === undefined) return;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`the-local: ${packageName} "the-local".${field} must be a non-empty string.`);
  }
}

// Validate and normalise a package's raw `"the-local"` field into a
// `Declaration`, applying the documented defaults. `fallbackPrefix` is the
// install name used when the declaration omits an explicit prefix.
export function parseDeclaration(raw: unknown, fallbackPrefix: string): Declaration {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(
      `the-local: ${fallbackPrefix} has a "the-local" declaration that is not an object.`,
    );
  }
  const declaration = raw as { prefix?: string; scope?: string | null; agentsDir?: string };
  requireNonEmptyString(declaration.prefix, "prefix", fallbackPrefix);
  return {
    prefix: declaration.prefix ?? fallbackPrefix,
    scope: declaration.scope ?? null,
    agentsDir: declaration.agentsDir ?? DEFAULT_AGENTS_DIR,
  };
}
