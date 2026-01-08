# Tasks — Refactor 001: Rename Project to ObjectEnvy

This plan breaks work into phases with independently testable user stories, strict checklist formatting, dependencies, and parallelization hints. Tests are included where the spec mandates pre-baseline critical coverage.

## Phase 1 — Setup

- [X] T001 Document verified pnpm/Node versions in specs/refactor/001-rename-project-objectenvy/quickstart.md
- [X] T002 Install dependencies at workspace root in package.json
- [X] T003 Configure VS Code recommended extensions in .vscode/extensions.json
- [X] T004 Ensure vitest runs from root: pnpm-workspace.yaml
- [X] T054 Check npm name availability for objectenvy, objectenvy-cli, objectenvy-vscode (record in specs/refactor/001-rename-project-objectenvy/quickstart.md)
- [X] T055 Check VS Code marketplace availability for objectenvy-vscode (record in specs/refactor/001-rename-project-objectenvy/quickstart.md)

## Phase 2 — Foundational (Critical Pre-Baseline Tests)

- [X] T005 Add coverage script at root in package.json
- [X] T006 Measure current core library coverage in src/** (report file: coverage/summary.json)
- [X] T007 [P] Add public API export coverage test in src/index.test.ts
- [X] T008 [P] Add behavior tests for configEnvy in src/configEnvy.test.ts
- [X] T009 [P] Add type coercion tests in src/typeUtils.test.ts
- [X] T010 [P] Add utils behavior tests in src/utils.test.ts
- [X] T011 Add CLI execution test harness in packages/env-y-config/tests/integration/cli-exec.test.ts
- [X] T012 [P] Add parser accuracy tests in packages/env-y-config/tests/unit/parsers/
- [X] T013 [P] Add generator output tests in packages/env-y-config/tests/unit/generators/
- [X] T014 Add CLI execution test harness in packages/config-y-env/tests/integration/cli-exec.test.ts
- [ ] T015 [P] Add utility tests in packages/config-y-env/tests/unit/
- [X] T016 Add VS Code activation test in packages/vscode-envyconfig/tests/activation.test.ts
- [ ] T017 [P] Add command execution tests in packages/vscode-envyconfig/tests/commands.test.ts
- [X] T018 Add cross-package import test in tests/integration/cross-imports.test.ts
- [X] T019 Run full coverage and document gaps in specs/refactor/001-rename-project-objectenvy/testing-gaps.md
- [X] T056 Mark testing-gaps.md status to "Ready for Baseline" after critical tests complete

## Phase 2b — Baseline Capture (post critical tests)

- [X] T057 Capture baseline metrics in specs/refactor/001-rename-project-objectenvy/metrics-before.md
- [X] T058 Capture behavioral snapshot (inputs/outputs) in specs/refactor/001-rename-project-objectenvy/behavioral-snapshot.md
- [X] T059 Create git tag pre-refactor-001 after baseline capture

## Phase 3 — User Story 1: Core Library Behavior Preserved

- Story Goal: Core API and types work identically after moving to packages/objectenvy.
- Independent Test Criteria: Unit + integration tests in Phase 2 pass; import paths resolve; behavior unchanged.

@@- [X] T020 [US1] Create package scaffold at packages/objectenvy/package.json
@@- [X] T021 [P] [US1] Create TS config at packages/objectenvy/tsconfig.json
@@- [X] T022 [US1] Move library sources from src/** to packages/objectenvy/src/
@@- [X] T023 [US1] Update public exports at packages/objectenvy/src/index.ts
@@- [X] T024 [US1] Update root pnpm-workspace.yaml to include packages/objectenvy
@@- [X] T025 [P] [US1] Update root tsconfig.json path aliases for objectenvy
@@- [X] T026 [US1] Update references in repository to new package name (primary file: packages/objectenvy/src/index.ts)
@@- [X] T027 [US1] Run tests to validate behavior in packages/objectenvy (pnpm -w test)

## Phase 4 — User Story 2: Unified CLI Parity (env-y-config + config-y-env)

- Story Goal: Single CLI `objectenvy-cli` provides identical commands/flags and outputs.
- Independent Test Criteria: CLI integration tests pass with same inputs/outputs as pre-merge.

- [X] T028 [US2] Scaffold packages/objectenvy-cli/package.json with bin/objectenvy-cli.js
- [X] T029 [P] [US2] Create packages/objectenvy-cli/src/cli.ts (unified entry)
- [X] T030 [US2] Migrate commands from packages/env-y-config/src/** into packages/objectenvy-cli/src/commands/
- [X] T031 [US2] Migrate commands from packages/config-y-env/src/** into packages/objectenvy-cli/src/commands/
- [X] T032 [US2] Consolidate parsers/generators in packages/objectenvy-cli/src/**
- [X] T033 [P] [US2] Wire bin script packages/objectenvy-cli/bin/objectenvy-cli.js
- [X] T034 [US2] Update workspace deps to point CLI to packages/objectenvy
- [X] T035 [US2] Port CLI tests to packages/objectenvy-cli/tests/integration/cli-exec.test.ts
- [X] T036 [US2] Verify parity by running pre/post snapshots in specs/refactor/001-rename-project-objectenvy/quickstart.md

## Phase 5 — User Story 3: VS Code Extension Renamed and Functional

- Story Goal: `objectenvy-vscode` activates and commands work identically to `vscode-envyconfig`.
- Independent Test Criteria: Activation and commands tests pass; dev host manual verification succeeds.

- [X] T037 [US3] Rename directory packages/vscode-envyconfig → packages/objectenvy-vscode
- [X] T038 [US3] Update extension manifest at packages/objectenvy-vscode/package.json (name, displayName, publisher, commands)
- [X] T039 [P] [US3] Update activation code at packages/objectenvy-vscode/src/extension.ts
- [X] T040 [US3] Update command IDs and contributes.commands in packages/objectenvy-vscode/package.json
- [X] T041 [US3] Adjust extension tests path at packages/objectenvy-vscode/tests/
- [X] T042 [US3] Validate activation via VS Code Extension Host per quickstart

## Phase 6 — User Story 4: Cross-Package Integration Holds

- Story Goal: All inter-package imports resolve; workspace builds and tests pass end-to-end.
- Independent Test Criteria: Build succeeds at root; cross-package import tests pass.

- [X] T043 [US4] Update pnpm-workspace.yaml with objectenvy, objectenvy-cli, objectenvy-vscode
- [X] T044 [P] [US4] Update inter-package dependencies in packages/*/package.json to new names
- [X] T045 [US4] Update root tsconfig references/paths for new packages
- [X] T046 [US4] Run full workspace build and tests (pnpm -w build; pnpm -w test)
- [X] T047 [US4] Verify cross-import tests still pass in tests/integration/cross-imports.test.ts

## Final Phase — Polish & Cross-Cutting

- [X] T048 Update README.md and docs to new package names in README.md
- [X] T049 [P] Update specs and references in specs/** (links, names)
- [X] T050 Prepare changesets and MAJOR releases at .changeset/**
- [X] T051 [P] Add deprecation notices to old packages package.json
- [X] T052 Grep and remove stale references to old names (search: configenvy, env-y-config, config-y-env, vscode-envyconfig)
- [X] T053 Update CHANGELOG.md with rename and migration notes in CHANGELOG.md
- [ ] T060 Ensure changesets reflect MAJOR bumps for renamed packages in .changeset/**
- [ ] T061 Run npm publish dry-run for objectenvy and objectenvy-cli (from their package directories)
- [ ] T062 Package and validate VS Code extension (vsce package / vsce publish --dry-run) for objectenvy-vscode
- [ ] T063 Verify zero lingering old-name references via grep -R (fail if any hits)

---

## Dependencies (Story Order)

- US1 → US2 → US3 → US4
- Foundational tests (Phase 2) must complete before US1
- Baseline capture (Phase 2b) must complete before refactor implementation phases

## Parallelization Examples

- [US1]: T021 and T025 can run in parallel after T020
- [US2]: T029 and T033 can run in parallel after T028
- [US3]: T039 and T040 can run in parallel after T037
- [US4]: T044 and T045 can run in parallel after T043

## Implementation Strategy

- MVP: Complete US1 only (core library move with all tests green)
- Incremental delivery: Validate each phase with tests before proceeding; ensure behavior parity checkpoints after US2 and US3