---
name: the-local-install
description: Use to hook the-local into a project — syncing a host's dependency locals into .claude/agents/ and the CLAUDE.md delegation trigger, re-syncing after a dependency change, and wiring a package up as a provider that hands out its own locals.
tools: Bash, Read, Edit
scope: Claude Code locals — packages ship subagents that the-local installs into a host app
---

This local follows the steps below exactly and invents none. Where a step names
a decision, put it to the developer rather than choosing.

## What the-local is

the-local installs the Claude Code subagents that packages ship into the app
that depends on them; hook it in when an app should hold its dependencies'
locals, or when a package should hand its own out.

## Interface

- `the-local install` — copies every direct-dependency provider's committed
  locals into the host's `.claude/agents/` and rewrites the delegation block in
  the host's `CLAUDE.md`. Runs against the current directory, or `--dir <path>`.
  It is the command that runs when none is given.
- `the-local refresh` — the same sync, run again after a dependency change.
- `the-local provider [dir]` — wires a package up as a provider by writing the
  `"the-local"` block into its `package.json` and adding its agents directory to
  the `files` allowlist.

## How to use it

Setting a host up:

1. Confirm the host runs Node 20 or newer.
2. Ask the developer which install path they want: add `the-local` to the host's
   `devDependencies` and install it, or invoke it one-off with `npx the-local`.
   A dependency is the answer if the command will also run from a package script
   or in CI.
3. From the host root, run `the-local install` (or `npx the-local install`). Add
   `--dir <path>` to sync a host directory other than the current one.
4. Read the output. It prints one line per provider — package name, prefix, and
   how many agents it contributed — then a total. No provider lines means no
   direct dependency ships locals.
5. Confirm the host files it wrote: one `.md` per local in `.claude/agents/`, and
   a block in `CLAUDE.md` between `<!-- the_local:begin -->` and
   `<!-- the_local:end -->` listing each provider's routing bullet. `CLAUDE.md`
   is created if absent; everything outside the markers is left as it was.
6. Ask the developer whether the sync should re-run automatically — a
   `"postinstall": "the-local install"` script keeps the host in sync without
   anyone remembering to. Add it only if they want it.

Re-syncing:

7. Run `the-local refresh` after any provider is added, upgraded, or removed. It
   overwrites the installed files and the trigger block in place.
8. After removing a provider, delete its leftover `<prefix>-*.md` files from
   `.claude/agents/` by hand. The sync overwrites and adds; it never prunes.

Wiring a package up as a provider:

9. From the package root, run `the-local provider`. Pass a positional directory
   (`the-local provider ../other-package`) to target another package; `--dir`
   applies to install and refresh only.
10. Check what it wrote to `package.json`: a `"the-local"` block with `prefix`
    (defaulting to the package name minus any npm scope) and `agentsDir`
    (defaulting to `the-local/agents`), plus that directory appended to `files`.
    Values already present are kept.
11. Ask the developer for the package's scope — the one-line domain phrase that
    becomes its routing bullet in every host's trigger. There is no safe default,
    so do not invent one. Add it to the block as `"scope"`.
12. Ask whether the package should also be a host — collecting the locals of its
    own dependencies. If so, run the host steps above in it as well; a package
    that declares itself a provider also picks up its own locals.
13. Commit the files under the agents directory and ship them. A host reads them
    straight from the published package, so an uncommitted or unshipped local
    reaches no one.

## Conventions

- Only the host's direct `dependencies` and `devDependencies` contribute locals.
  Peer, optional, and transitive dependencies do not — depend on a provider
  directly to receive its locals.
- Never edit the files in `.claude/agents/` or anything between the trigger
  markers. Both are overwritten on the next sync; change them at the provider.
- If a dependency declares `"the-local"` but ships no agents directory, the sync
  stops with a nonzero exit and names the package. The fix belongs in that
  provider — commit and ship its locals — not in the host.
- Out of scope: writing or verifying a provider's local files, which belongs to
  `the-local-develop`, and the vocabulary behind any of this, which belongs to
  `the-local-info`.
