# Changelog

All notable changes to `the-local` are documented here. This project follows
[Semantic Versioning](https://semver.org); see [`docs/RELEASING.md`](docs/RELEASING.md)
for the release process. Pre-1.0, a MINOR bump may break.

## 0.2.0 — 2026-08-18

Brings the package up to the behaviour of the Ruby `the_local` gem. How a package
becomes a provider changed, and it changed in a breaking way.

### Removed — breaking

- **The deterministic renderer is gone.** There is no `the-local build` command,
  no `the-local.config.js`, and no starter-config scaffolding. Locals are no
  longer rendered from a config file.

  *Migration:* declare your package's public interface in
  `the-local/interface.json`, run `npx the-local author` to write
  `the-local/agents/<prefix>-{info,install,develop}.md`, verify with
  `npx the-local check`, and commit the `.md` files. See
  [`docs/PROVIDERS.md`](docs/PROVIDERS.md).

- **`the-local provider` is reduced to wiring only.** It declares the package in
  `package.json` and ensures the agents directory ships in the `files` allowlist.
  It no longer scaffolds a config or renders any agents.

- Installing into a host no longer writes a `develop_process_rules.md` file, and
  no longer writes a `<!-- the_local:process:begin -->` /
  `<!-- the_local:process:end -->` block into the host's `CLAUDE.md`. Install now
  writes the locals and the delegation trigger, and nothing else.

### Changed — behaviour

- **Provider discovery is widened.** Providers are found by globbing each direct
  dependency for committed `the-local/agents/*.md` rather than by requiring a
  `"the-local"` block in the dependency's `package.json`. The prefix comes from
  the filename. More of a host's dependencies may now contribute locals than
  before. The `package.json` block still works, as an optional override for
  `prefix` and `agentsDir`.

- The delegation block's scope line for each provider is read from the committed
  agent file's `scope:` front matter, falling back to the `package.json`
  declaration.

- A host that ships its own locals now installs them, and a package running an
  install inside its own repository no longer installs its locals onto itself.

### Added

- `the-local/interface.json` — a committed interface manifest declaring a
  provider's `scope`, its public entry points assigned to the `info` / `install`
  / `develop` facets (each entry point belongs to exactly one facet), and the
  `sources` files that define them.

- `the-local author` — writes the three locals from that manifest and the
  package's real source by running Claude. It requires the `claude` CLI at
  provider-development time only, never at install time in a host.

- `the-local check` — verifies the committed locals against the manifest: the
  four required front-matter keys (`name`, `description`, `tools`, `scope`), the
  four required sections (`## What`, `## Interface`, `## How to use it`,
  `## Conventions`), that every local's scope matches the manifest, and that every
  declared entry point is documented by its own facet's local with nothing
  undeclared or misplaced appearing anywhere.

- [`docs/PROVIDERS.md`](docs/PROVIDERS.md) — the provider guide.

- `the-local` is its own first provider: it commits its own manifest and locals.

## 0.1.3

Initial published releases: the install pipeline (discovery, direct-dependency
scope, verbatim agent copy, `CLAUDE.md` delegation trigger) and the CLI.
