# the-local

Ship Claude Code **locals** (resident expert subagents) from npm packages into a
host TS/JS app — the TypeScript port of the [`the_local`](https://github.com/tylercschneider/the_local)
Ruby gem. A provider package commits its agent `.md` files; a host runs
`the-local install` to copy the aggregated set from its direct dependencies into
`.claude/agents/`, plus a delegation rule in `CLAUDE.md`.

> Status: early. Core install pipeline + CLI are in place and tested. See the
> open issues for remaining work (contract doc, npm publish, workspace support).

## The model

- **Providers commit locals.** A package ships pre-rendered agent files at
  `the-local/agents/<prefix>-<name>.md` and declares them in its `package.json`.
- **Hosts install verbatim.** `the-local install` reads the host's direct
  `dependencies`, copies each provider's committed `.md` byte-for-byte into
  `.claude/agents/`, and writes the delegation trigger into `CLAUDE.md`.
- **Direct-dependency scope.** Only the host's direct dependencies contribute
  locals; transitive providers are filtered out.
- **Cross-language contract.** The agent `.md` format and the `CLAUDE.md`
  `<!-- the_local:begin -->` / `<!-- the_local:end -->` markers are identical to
  the Ruby gem's, so a Ruby gem and a TS package install into the same host
  without clobbering each other. See [`docs/contract.md`](docs/contract.md).

## Use (host app)

```sh
npx the-local install   # or: refresh
```

## Declare locals (provider package)

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

Then commit `the-local/agents/keystone-*.md` alongside your code.

## Develop

```sh
pnpm install
pnpm test        # vitest
pnpm typecheck
pnpm lint
pnpm build       # emits dist/, including the the-local CLI
```
