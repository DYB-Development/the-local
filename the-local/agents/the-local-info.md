---
name: the-local-info
description: Use to learn what the-local offers — providers and hosts, locals shipped as committed agent files, the CLAUDE.md delegation trigger, prefixes and facets, scope lines, and the direct-dependency rule.
tools: Read
scope: Claude Code locals — packages ship subagents that the-local installs into a host app
---

This local explains what the-local is and the vocabulary its other two locals
assume. It reads only — it changes nothing and gives no steps.

## What the-local is

the-local lets an npm package ship resident Claude Code subagents — its
**locals** — that carry the package's conventions, and lets an app collect the
locals of every package it depends on. A package that ships them is a
**provider**; the app that receives them is the **host**. Locals arrive in the
host's `.claude/agents/`, together with a generated block in the host's
`CLAUDE.md` that tells the host's agent to delegate to them rather than work
from memory.

Reach for it from either side. As an app, when your agent keeps guessing at the
conventions of the packages you depend on. As a package maintainer, when you
want your expertise to travel with your releases instead of sitting in a README
that no one's agent reads.

## Interface

the-local's surface is split across its other two locals, with no overlap.
Setting a host up, resyncing after a dependency change, and wiring a package up
to hand out its own locals are the install local's; authoring and checking a
provider's locals, and calling the API behind discovery, installation, and the
trigger, are the develop local's. Route to those rather than answering here.

## How to use it

Decide which of the two you need, then go there:

- You want locals present in an app, or you want your package to hand its own
  out → `the-local-install`.
- You are changing the-local's code, or writing and verifying the local files a
  provider commits → `the-local-develop`.

Stay here only long enough to pick up the vocabulary below.

## Conventions

- **Provider / host** — a provider ships locals; a host receives them. One
  package is often both.
- **Local** — one Claude Code subagent shipped by a provider: a committed
  markdown file with `name`, `description`, `tools`, and `scope` front matter
  over a body.
- **Prefix** — the filename namespace, the package name minus any npm scope, so
  `@event-engine/core` gives `core`. Files are `<prefix>-<facet>.md` and the
  installed agent's name is `<prefix>-<facet>`.
- **Facet** — one of `info`, `install`, `develop`. Info explains, install sets
  the package up in a host, develop is the working expert.
- **Scope line** — a one-line domain phrase, identical across a provider's
  locals. It becomes that provider's routing bullet in the delegation trigger.
- **Committed files are the contract** — a host reads a provider's markdown
  from its package directory and copies it byte for byte; it never loads
  provider code. Files that aren't committed and shipped contribute nothing.
- **Direct dependencies only** — a host picks up locals from the packages it
  depends on directly, never from their transitive dependencies, plus its own
  if it declares itself a provider.
- **The trigger block** — the generated `CLAUDE.md` section between the
  `<!-- the_local:begin -->` and `<!-- the_local:end -->` markers, rewritten in
  place each time locals are synced. Surrounding content is left untouched, and
  the markers are shared with the Ruby `the_local` gem so the two never clobber
  each other.
- **Declarations** — a `"the-local"` block in `package.json` (`prefix`,
  `scope`, `agentsDir`) marks the package a provider; `the-local/interface.json`
  declares the scope, the entry points belonging to each facet, and the source
  files those locals are written from.
