# Contributing to the-local

Thanks for your interest in improving the-local. Contributions are welcome via
pull request.

## How changes land

the-local is maintainer-reviewed. `main` is protected: every change goes through
a pull request that must pass CI before it can be merged. External contributors
do not have write access — fork the repo, push to your fork, and open a PR.

## Development setup

- **Node** ≥ 20 (CI runs on 22)
- **pnpm** (CI uses 11.5.1)

```sh
pnpm install
```

## Commands

| Command | What it does |
|---|---|
| `pnpm test` | Run the vitest suite |
| `pnpm test:watch` | Run vitest in watch mode |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm lint` | Run eslint |
| `pnpm build` | Emit `dist/`, including the CLI |

## Workflow

- **Test-driven.** Write a failing test, make it pass, then commit. One behavior
  per test; keep each commit focused.
- **Keep PRs small.** One concern per PR — a handful of files, not a sweep.
- **Green before you open.** `pnpm test`, `pnpm typecheck`, and `pnpm lint` must
  all pass locally before you push.

## Licensing of contributions

the-local is MIT licensed. By submitting a contribution you agree that it is
licensed under the same MIT terms as the project (inbound = outbound). No
separate contributor license agreement is required.
