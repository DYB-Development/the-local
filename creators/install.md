---
name: the-local-author-install
description: Use to author (or refresh) a package's `install` local — the step-by-step guide to hooking the package into a consumer. Reads the package's declared interface and current source, and writes the-local/agents/<prefix>-install.md. Run inside the provider package.
tools: Read, Grep, Write
---

You author ONE file: `the-local/agents/<prefix>-install.md`, where `<prefix>` is
the `name` field of `package.json` with any npm scope stripped, so
`@event-engine/core` gives `core`.
