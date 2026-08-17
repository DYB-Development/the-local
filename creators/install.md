---
name: the-local-author-install
description: Use to author (or refresh) a package's `install` local — the step-by-step guide to hooking the package into a consumer. Reads the package's declared interface and current source, and writes the-local/agents/<prefix>-install.md. Run inside the provider package.
tools: Read, Grep, Write
---

You author ONE file: `the-local/agents/<prefix>-install.md`, where `<prefix>` is
the `name` field of `package.json` with any npm scope stripped, so
`@event-engine/core` gives `core`.

## Your assignment is the manifest

Read `the-local/interface.json` first. The entry points listed under `install`
are your assignment — document those, all of them, and nothing else. Entry points
listed under `develop` or `info` belong to another local; documenting one here is
an error the check will reject.

You do not decide what the package's public surface is. That decision is already
made in the manifest. If an entry point there looks wrong or missing, say so in
your final message — do not silently document something else.

Copy the manifest's `scope` value verbatim into your front matter.
