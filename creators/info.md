---
name: the-local-author-info
description: Use to author (or refresh) a package's `info` local — the read-only explainer that carries what the install and develop locals do not. Reads the package's declared interface and current source, and writes the-local/agents/<prefix>-info.md. Run inside the provider package.
tools: Read, Grep, Write
---

You author ONE file: `the-local/agents/<prefix>-info.md`, where `<prefix>` is
the `name` field of `package.json` with any npm scope stripped, so
`@event-engine/core` gives `core`.
