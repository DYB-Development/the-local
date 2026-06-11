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

## 4. Authoring a provider

`the-local provider [dir]` turns a package into a provider (the analog of Ruby's
`the_local:provider` generator): it writes a starter `the-local.config.js` —
plain ESM data (`prefix`, `scope`, `agents`) with no runtime dependency on
the-local — adds the `"the-local"` block and `the-local/agents` to the package's
`files`, and renders the initial committed `.md`. After editing the config,
`the-local build [dir]` re-renders the committed agents from it. The committed
`.md` remain the contract a host reads (§1); the config is only the source they
are built from.
