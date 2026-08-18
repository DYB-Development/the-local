# the-local

Ship Claude Code **locals** (resident expert subagents) from npm packages into a
host TS/JS app — the TypeScript port of the [`the_local`](https://github.com/DYB-Development/the_local)
Ruby gem. A provider package commits its agent `.md` files; a host runs
`the-local install` to copy the aggregated set from its direct dependencies into
`.claude/agents/`, plus a delegation rule in `CLAUDE.md`.

Published on npm as [`the-local`](https://www.npmjs.com/package/the-local).

## The model

- **Providers commit locals.** A package ships its agent files at
  `the-local/agents/<prefix>-<facet>.md` and lists that directory in its
  `package.json` `files` allowlist. The committed `.md` files are the whole
  contract — nothing is rendered at install time.
- **Hosts install verbatim.** `the-local install` reads the host's direct
  dependencies, copies each provider's committed `.md` byte-for-byte into
  `.claude/agents/`, and writes the delegation trigger into `CLAUDE.md`. Nothing
  else is written into the host.
- **Discovery is by committed files.** A dependency counts as a provider when it
  ships `the-local/agents/*.md`; no `package.json` declaration is required. The
  prefix comes from the filename and the delegation scope line from the agent
  file's `scope:` front matter.
- **Direct-dependency scope.** Only the host's direct dependencies contribute
  locals; transitive providers are filtered out. A host that ships its own
  locals installs them too.
- **Cross-language contract.** The agent `.md` format and the `CLAUDE.md`
  `<!-- the_local:begin -->` / `<!-- the_local:end -->` markers are identical to
  the Ruby gem's, so a Ruby gem and a TS package install into the same host
  without clobbering each other. See [`docs/contract.md`](https://github.com/DYB-Development/the-local/blob/main/docs/contract.md).

## Use (host app)

```sh
npx the-local install   # or: refresh
npx the-local install --dir ../some/other/app
```

This writes `.claude/agents/*.md` and one managed block in `CLAUDE.md`.

## Become a provider (package)

```sh
npx the-local provider   # declare the package and ship the agents dir
```

Then declare the package's public interface in `the-local/interface.json`, write
the locals from it, and verify them:

```sh
npx the-local author   # writes the-local/agents/<prefix>-{info,install,develop}.md
npx the-local check    # verifies the committed locals against the manifest
```

Commit the result. Authoring needs the `claude` CLI, at provider-development time
only — never when a host installs.

The full guide — the manifest shape, the three facets, and what `check` enforces
— is in [`docs/PROVIDERS.md`](https://github.com/DYB-Development/the-local/blob/main/docs/PROVIDERS.md).

The `package.json` `"the-local"` block stays available as an optional override:

```jsonc
// package.json
{
  "the-local": {
    "prefix": "keystone",
    "scope": "UI — pages, forms, tables",
    "agentsDir": "the-local/agents"
  }
}
```

## Develop

```sh
pnpm install
pnpm test        # vitest
pnpm typecheck
pnpm lint
pnpm build       # emits dist/, including the the-local CLI
```

## Contributing

Pull requests are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the dev
setup, commands, and workflow. Contributions are accepted under the project's
MIT terms (inbound = outbound).

## License

[MIT](LICENSE) © DYB, L.L.C.
