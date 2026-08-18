# The cross-language local contract

`the_local` (Ruby gem) and `the-local` (this npm package) install Claude Code
locals into a host app's `.claude/agents/` and `CLAUDE.md`. Their **output is
language-neutral**, so a gem and an npm package install into the same host
identically and without clobbering each other.

This document is the shared contract both implementations conform to. The
canonical write-up lives upstream in
[`the_local#38`](https://github.com/tylercschneider/the_local/issues/38); the
conformance test (`test/conformance.test.ts`) pins the TS output to the bytes
below.

## 1. Agent `.md` format

A provider commits one pre-rendered file per local at
`<prefix>-<name>.md`. The host copies it verbatim into `.claude/agents/`. The
file is YAML frontmatter, then the role body, then the provider's knowledge:

```md
---
name: keystone-scaffold
description: Use PROACTIVELY for UI work.
tools: Read, Write, Edit
---

You build UI.

API docs.
```

- `name` is the qualified name `<prefix>-<name>` — the filename namespace.
- `description` and `tools` are emitted verbatim, one per line.
- A blank line separates the frontmatter, the body, and the knowledge.
- Array knowledge is joined with a blank line (`\n\n`).
- The file ends with a single trailing newline.

## 2. `CLAUDE.md` delegation block

The host writes one marked block into `CLAUDE.md` — the standing rule, read at
the start of every session, that tells the host agent to delegate to its locals:

```md
<!-- the_local:begin -->
## Delegate to your locals

This project has installed expert subagents. Before doing work yourself,
check whether a local owns it and delegate — never work from memory on
something a local covers:

- UI — pages, forms, tables → keystone-* agents

See each agent's description for specifics.
<!-- the_local:end -->
```

- The markers are exactly `<!-- the_local:begin -->` and `<!-- the_local:end -->`
  in both languages, so the two CLIs never clobber each other's block.
- One bullet per provider: `- <scope> → <prefix>-* agents`, or a bare
  `- <prefix>-* agents` when the provider declares no scope.

### Merge rules

- If a marked block already exists, replace it **in place** (re-sync without
  duplicating).
- If `CLAUDE.md` is empty, the block is the whole file.
- Otherwise append the block after the host's existing content, separated by a
  blank line. The host's own content is never touched.

## 3. Direct-dependency scope

Only the host's **direct** dependencies contribute locals; transitive providers
are filtered out. A provider counts as in-scope when it is a direct dependency,
or when it is not an installed package at all (e.g. the host app itself
declaring locals). This mirrors the Ruby `Scope` rule.

"Direct dependency" means a package listed in the host `package.json`'s
`dependencies` **or** `devDependencies` (deduped — a package in both counts
once). `devDependencies` is included because a the-local provider is typically a
build-time tool, matching the Ruby gem's Bundler scope (which includes the
`:development` group). `peerDependencies` and `optionalDependencies` are
**excluded**: a peer dependency is a contract for what the host expects to be
present rather than tooling the host installs, and optional dependencies are not
where a provider belongs.

## 4. Authoring a provider

A provider commits its locals; nothing is rendered at install time. It declares
its public interface in `the-local/interface.json`, writes the three facet locals
from that manifest with `the-local author [dir]`, and verifies the committed
files against it with `the-local check [dir]`. `the-local provider [dir]` (the
analog of Ruby's `the_local:provider` generator) is wiring only: it writes the
`"the-local"` block and adds the agents directory to the package's `files`. The
committed `.md` remain the contract a host reads (§1). See
[`PROVIDERS.md`](./PROVIDERS.md).

### 4.1 The `the-local` declaration block

Discovery finds a provider by its committed `the-local/agents/*.md`: a dependency
that ships them contributes locals, and no declaration is required. The prefix
comes from the filename and the delegation scope line (§2) from the agent file's
`scope:` front matter.

A package may still commit a `"the-local"` block in its `package.json` to
override that. The shape is locked: it must be an object, and every field is
optional with a documented default.

| Field       | Type             | Default                                          |
| ----------- | ---------------- | ------------------------------------------------ |
| `prefix`    | non-empty string | the prefix read from the committed filenames     |
| `scope`     | string or `null` | the `scope:` front matter of a committed agent   |
| `agentsDir` | non-empty string | `the-local/agents`                               |

Front matter wins over the declared `scope`; the declaration is the fallback when
no committed agent carries one. Discovery validates the block and fails with a
clear, package-named error on a non-object declaration or a field of the wrong
type (an empty string is treated as misconfiguration, not a default). A package
that declares the block but ships no committed agents is an error, not a silent
skip.
