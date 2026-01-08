# Implementation Plan: Refactor 001 — Rename Project to ObjectEnvy

**Branch**: `refactor/001-rename-project-objectenvy` | **Date**: 2026-01-07 | **Spec**: specs/refactor/001-rename-project-objectenvy/spec.md
**Input**: Refactor specification from `/specs/refactor/001-rename-project-objectenvy/spec.md`

**Note**: Generated via the speckit.plan workflow. This plan captures context, gates, and Phase 0/1 outputs to enable safe refactoring without behavior changes.

## Summary

Rename the repository and packages from "configenvy" to the unified "objectenvy" naming scheme while preserving behavior. Consolidate the two CLIs (`env-y-config`, `config-y-env`) into a single `objectenvy-cli`, rename the VS Code extension to `objectenvy-vscode`, and move the core library into `packages/objectenvy`. Approach is a systematic, incremental rename with zero functional changes, backed by pre-baseline critical tests per testing-gaps.md.

## Technical Context

**Language/Version**: TypeScript ≥5.9 (strict), Node.js ≥20.0
**Primary Dependencies**: Vitest (tests), oxlint (lint), oxfmt (format), Zod (peer, optional), Commander (CLI), ts-morph (AST tooling), VS Code API (extension)
**Storage**: N/A (no persistent storage)
**Testing**: Vitest with coverage across packages; focus on public API, CLI command execution, and VS Code activation
**Target Platform**: Node.js (library + CLI), VS Code (extension)
**Project Type**: Monorepo (pnpm workspaces) with 3 packages after refactor: `objectenvy`, `objectenvy-cli`, `objectenvy-vscode`
**Performance Goals**: Maintain current performance; no functional changes expected
**Constraints**: Maintain zero runtime dependencies in core library; adhere to Constitution and AGENTS.md coding standards
**Scale/Scope**: Library + CLI + VS Code extension used by developers; multi-package workspace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with envyconfig Constitution v1.1.0 principles:

- [x] **Type Safety First**: No new public APIs; existing strict typing preserved
- [x] **Test-Driven Public APIs**: No new APIs; add critical pre-baseline tests per testing-gaps.md
- [x] **Code Quality Standards**: oxlint/oxfmt enforced; pre-commit hook retained
- [x] **Semantic Versioning**: Package rename implies MAJOR version bump on publish; documented
- [x] **Documentation Discipline**: Public APIs already documented; update docs to new names
- [x] **Modern TypeScript Patterns**: ES2022+ features already in use; unchanged
- [x] **Zero-Runtime Dependencies**: Core library remains zero-runtime deps; Zod stays peer

## Project Structure

### Documentation (this refactor)

```text
specs/refactor/001-rename-project-objectenvy/
├── plan.md              # This file (speckit.plan output)
├── research.md          # Phase 0 output (decisions + rationale)
├── data-model.md        # Phase 1 output (entities + relationships)
├── quickstart.md        # Phase 1 output (how to verify locally)
└── contracts/           # Phase 1 output (CLI + extension interfaces)
```

### Source Code (repository root after refactor)

```text
packages/
├── objectenvy/          # Core library (moved from src/)
│   └── src/
├── objectenvy-cli/      # Unified CLI (merged from env-y-config + config-y-env)
│   └── src/
└── objectenvy-vscode/   # VS Code extension (renamed from vscode-envyconfig)
    └── src/

tests/
├── unit/
├── integration/
└── extension/
```

**Structure Decision**: Adopt a clear 3-package monorepo using pnpm workspaces. All inter-package imports reference the `objectenvy` core library. CLI commands integrate former functionality under a unified command surface. VS Code extension updates activation and command IDs to match the new naming.

## Complexity Tracking

No Constitution violations expected. No additional projects beyond the 3-package structure. If unforeseen complexity arises (e.g., temporary duplication during CLI merge), changes will be incremental and validated with tests at each step.
