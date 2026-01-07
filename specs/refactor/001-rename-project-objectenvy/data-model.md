# Data Model — Refactor 001: ObjectEnvy

## Entities

- Package: `objectenvy` (Core Library)
  - Fields: source (`src/**`), types (`types.ts`), utils (`utils.ts`), public API (`index.ts`)
  - Constraints: Zero runtime dependencies; strict typing; public APIs stable.

- Package: `objectenvy-cli` (Unified CLI)
  - Fields: entry (`bin/objectenvy-cli.js`), CLI `src/cli.ts`, commands (merged from both CLIs), parsers/generators where applicable.
  - Constraints: Command/flag compatibility preserved; uses core library APIs.

- Package: `objectenvy-vscode` (VS Code Extension)
  - Fields: `package.json` (manifest), `src/extension.ts` (activation & commands), `media/**`.
  - Constraints: Activation events unchanged; command behavior unchanged; identifiers updated to new naming.

## Relationships

- `objectenvy-cli` → depends on → `objectenvy`
- `objectenvy-vscode` → may depend on → `objectenvy` (direct) and/or share logic via internal utils

## Validation Rules

- Core library exports must remain available under the new package name with identical behavior and types.
- CLI commands must produce identical outputs for identical inputs as before the merge/rename.
- VS Code extension must activate under the same scenarios and execute commands identically.

## State Transitions

This refactor introduces no runtime state machines. Transition is structural:

1. Pre-refactor packages exist (`src/`, `env-y-config`, `config-y-env`, `vscode-envyconfig`).
2. Post-refactor packages exist (`objectenvy`, `objectenvy-cli`, `objectenvy-vscode`).
3. All imports, commands, and extension IDs updated to new names with behavior preserved.
