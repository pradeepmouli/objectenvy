# objectenvy Development Guidelines

## Project Overview

Maps `process.env` into a strongly-typed, nested, camelCased config object — with optional Zod validation, schema-guided structure, and type-level round-trip utilities to keep `.env` files in sync with code.

## Tech Stack

- TypeScript 5, Node.js ≥20
- Vitest (test runner), oxlint (linter), oxfmt (formatter)
- pnpm workspaces (monorepo), changesets (releases)

## Project Structure

```text
packages/objectenvy/       # Core library
packages/objectenvy-cli/   # CLI tool
packages/objectenvy-vscode/ # VS Code extension
apps/                      # Demo applications
specs/                     # Specification documents
docs/                      # VitePress documentation
```

## Commands

```bash
pnpm install        # Install dependencies
pnpm test           # Run tests
pnpm run type-check # TypeScript strict mode
pnpm run build      # Build
pnpm run lint       # oxlint
pnpm run format     # oxfmt
```

## Code Style

- TypeScript strict mode, no `any`
- oxlint for linting, oxfmt for formatting
- Conventional commits

## Key Patterns

- **Auto-nesting** — shared `SCREAMING_SNAKE_CASE` prefixes become nested camelCase objects
- **Schema-guided shape** — Zod schema passed to `objectify()` overrides auto-nesting
- **Type round-trip** — `ToEnv<T>` / `FromEnv<T>` derive env shapes from config types
- **Smart-nesting guardrails** — configurable prefix blocklist prevents `MAX_*` from nesting

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
