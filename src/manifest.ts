const DEFAULT_AGENTS_DIR = "the-local/agents";

// A provider's validated `the-local` declaration. This is the locked shape of
// the `package.json` `"the-local"` block.
export interface Declaration {
  prefix: string | null;
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
// `Declaration`. Fields the declaration omits are left unset for the caller to
// resolve, except `agentsDir`, whose default is documented here.
export function parseDeclaration(raw: unknown, packageName: string): Declaration {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(
      `the-local: ${packageName} has a "the-local" declaration that is not an object.`,
    );
  }
  const declaration = raw as { prefix?: string; scope?: string | null; agentsDir?: string };
  requireNonEmptyString(declaration.prefix, "prefix", packageName);
  requireNonEmptyString(declaration.agentsDir, "agentsDir", packageName);
  if (
    declaration.scope !== undefined &&
    declaration.scope !== null &&
    typeof declaration.scope !== "string"
  ) {
    throw new Error(`the-local: ${packageName} "the-local".scope must be a string or null.`);
  }
  return {
    prefix: declaration.prefix ?? null,
    scope: declaration.scope ?? null,
    agentsDir: declaration.agentsDir ?? DEFAULT_AGENTS_DIR,
  };
}
