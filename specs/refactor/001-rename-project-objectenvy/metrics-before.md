# Baseline Metrics — Refactor 001: Rename Project to ObjectEnvy

**Captured**: January 7, 2026, 18:15 EST
**Branch**: `refactor/001-rename-project-objectenvy`
**Git Commit**: [Current commit at capture time]

## Test Suite Status

**Total Tests**: 160
**Passing**: 160 (100%)
**Failing**: 0
**Flaky**: 0

### Test Breakdown by Package

- **Core Library** (`src/`): 88 tests
  - `configEnvy.test.ts`: 51 tests
  - `index.test.ts`: 4 tests
  - `typeUtils.test.ts`: 7 tests
  - `utils.test.ts`: 26 tests

- **env-y-config CLI** (`packages/env-y-config/`): 58 tests
  - Integration tests: 3 tests (CLI execution)
  - Parser tests: 29 tests (JSON: 14, TypeScript: 15)
  - Generator tests: 26 tests (sample values)

- **config-y-env CLI** (`packages/config-y-env/`): 3 tests
  - Integration tests: 3 tests (CLI execution)

- **VS Code Extension** (`packages/vscode-envyconfig/`): 6 tests
  - Activation tests: 6 tests

- **Cross-Package** (`tests/integration/`): 5 tests
  - Import resolution tests: 5 tests

## Code Coverage

### Overall Coverage: 87.06%

| Package | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
| **Core Library (src/)** | 89.57% | 80.7% | 94.59% | 91.48% |
| **env-y-config generators** | 89.02% | 89.15% | 100% | 98.27% |
| **env-y-config parsers** | 90.76% | 80.53% | 88.88% | 91.4% |
| **config-y-env utils** | 54.83% | 20% | 37.5% | 53.33% |
| **vscode-envyconfig** | 70% | 100% | 40% | 70% |

### Uncovered Areas (Known Gaps)

- `src/index.ts`: 0% (re-export file, covered via imports)
- `packages/env-y-config/src/utils/errors.ts`: 54.83% (lines 63-88, 118-144)
- `packages/vscode-envyconfig/src/extension.ts`: 70% (lines 21, 28, 35 - command handlers)

## Build Status

**Root Package**: ✅ Builds successfully
**env-y-config**: ✅ Builds successfully
**config-y-env**: ✅ Builds successfully
**vscode-envyconfig**: ✅ Builds successfully

## Package Configuration

### Root Package

- **Name**: `envyconfig`
- **Version**: 0.2.0
- **Type**: module
- **Node**: >=20.0.0 (running v24.12.0)
- **pnpm**: >=9.0.0 (running v9.15.0)

### Workspace Packages

1. **env-y-config** v1.0.0
2. **config-y-env** v1.0.0
3. **envyconfig-vscode** v1.0.0

## Performance Baseline (Test Execution)

- **Total Test Duration**: 3.16s
- **Transform Time**: 370ms
- **Setup Time**: 0ms
- **Import Time**: 685ms
- **Test Execution Time**: 3.61s
- **Environment Setup**: 1ms

## Critical Paths Verified

✅ Core library public API exports
✅ CLI execution (env-y-config)
✅ CLI execution (config-y-env)
✅ VS Code extension activation
✅ Cross-package imports
✅ Type definitions and utilities
✅ Config parsing and generation

## Linting & Formatting

**Linter**: oxlint v1.36.0
**Formatter**: oxfmt v0.21.0

**Lint Status**: ✅ All files pass
**Format Status**: ✅ All files formatted

## Known Issues Before Refactor

None - all tests passing, all packages building successfully.

## Behavioral Expectations

After refactoring:
1. All 160 tests must continue to pass
2. Coverage should remain >= 87% overall
3. Build times should remain similar
4. No new lint or type errors
5. CLI commands produce identical outputs
6. VS Code extension activates and registers commands

---

**Baseline Status**: ✅ CAPTURED
**Ready for Refactoring**: ✅ YES
**Next Step**: Create behavioral snapshot and git tag `pre-refactor-001`, then begin Phase 3
