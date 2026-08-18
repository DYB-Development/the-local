# Providing locals

How an npm package becomes a `the-local` provider.

A provider commits its locals. The `.md` files under `the-local/agents/` are the
whole contract a host reads — nothing is rendered, resolved, or generated when a
host installs. Everything below happens in your package, before you publish.

## 1. Declare the interface

A provider commits an interface manifest at `the-local/interface.json`. It names
the package's scope, assigns each public entry point to one facet, and lists the
source files that define them:

```jsonc
{
  "scope": "UI — pages, forms, tables",
  "info": [],
  "install": ["keystone init", "keystone.config.ts"],
  "develop": ["renderPage", "useTable"],
  "sources": ["src/index.ts", "src/cli.ts", "src/table.ts"]
}
```

| Field                       | Meaning                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `scope`                     | The phrase the host's delegation rule shows for this provider  |
| `info` `install` `develop`  | Entry points, each belonging to **exactly one** facet          |
| `sources`                   | The files that define those entry points                       |

Every field is optional; an omitted facet declares no entry points.

## The three facets

Each entry point belongs to exactly one facet, and each facet becomes one local.
The split is what keeps the three from repeating one another.

### `info`

The read-only explainer: what the package is, how it is shaped, and which of the
other two locals owns the surface a reader is after. Most manifests declare no
`info` entry points at all — this local documents none and routes instead.

### `install`

Hooking the package into a consumer: the commands, config files, and wiring that
get it running there.

### `develop`

Using the package once it is wired: the functions, types, and CLI verbs a
consumer calls day to day.

## 2. Author the locals

```sh
npx the-local author   # or: npx the-local author ../path/to/package
```

`author` runs Claude once per facet against the manifest and your real source,
writing `the-local/agents/<prefix>-<facet>.md`. The prefix is the package name
with any npm scope dropped, so `@event-engine/core` gives `core`.

It requires the `claude` CLI. That requirement is a provider-development one
only — a host installing your package never authors anything.

## 3. Check them

```sh
npx the-local check
```

`check` verifies the committed locals against the manifest and fails the run with
a per-file list of problems. It enforces:

- the four front-matter keys — `name`, `description`, `tools`, `scope`
- the four sections — `## What`, `## Interface`, `## How to use it`,
  `## Conventions`
- every local's `scope:` matches the manifest's `scope`
- every declared entry point is documented by its own facet's local, with
  nothing undeclared and nothing belonging to another facet appearing anywhere

Run it in CI: it is what keeps the committed contract honest as the source moves.

## 4. Ship the files

```sh
npx the-local provider
```

`provider` is wiring only. It writes the `"the-local"` block into `package.json`
and adds the agents directory to the `files` allowlist.

**If `the-local/agents` is not in `files`, the published package contributes
nothing** — a host installs from the published tarball, and files npm did not
pack do not exist there. Commit the `.md` files and keep them in `files`.
