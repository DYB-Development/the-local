const DEFAULT_AGENTS_DIR = "the-local/agents";

// A provider's validated `the-local` declaration, with documented defaults
// applied. This is the locked shape of the `package.json` `"the-local"` block.
export interface Declaration {
  prefix: string;
  scope: string | null;
  agentsDir: string;
}

// Validate and normalise a package's raw `"the-local"` field into a
// `Declaration`, applying the documented defaults. `fallbackPrefix` is the
// install name used when the declaration omits an explicit prefix.
export function parseDeclaration(raw: unknown, fallbackPrefix: string): Declaration {
  const declaration = raw as { prefix?: string; scope?: string | null; agentsDir?: string };
  return {
    prefix: declaration.prefix ?? fallbackPrefix,
    scope: declaration.scope ?? null,
    agentsDir: declaration.agentsDir ?? DEFAULT_AGENTS_DIR,
  };
}
