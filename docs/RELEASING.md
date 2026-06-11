# Releasing `the-local`

`the-local` is published to npm by the [`publish.yml`](../.github/workflows/publish.yml)
workflow, which runs on any pushed tag matching `v*`.

## Version policy

`the-local` follows [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`):

- **MAJOR** — a breaking change to the installed contract: the agent `.md`
  render, the `CLAUDE.md` delegation markers/merge rules, or the CLI surface
  (see [`contract.md`](./contract.md)). Coordinate these with the Ruby
  `the_local` gem so the two ports stay byte-compatible.
- **MINOR** — backwards-compatible features (new flags, new discovery modes).
- **PATCH** — backwards-compatible fixes.

Pre-1.0 (`0.x`) releases may break in a MINOR bump while the surface settles.

## Cutting a release

1. Land all changes on `main` (green CI).
2. Bump the version: `npm version <patch|minor|major>` — this updates
   `package.json` and creates the `vX.Y.Z` commit and tag.
3. Push the tag: `git push --follow-tags`.
4. The `Publish` workflow rebuilds, re-runs typecheck/lint/tests, and runs
   `npm publish --provenance --access public` using the `NPM_TOKEN` secret.

`prepublishOnly` rebuilds `dist/` so a publish always ships freshly built output.
