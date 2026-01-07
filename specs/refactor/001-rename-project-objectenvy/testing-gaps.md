# Testing Gaps Assessment: Rename Project to ObjectEnvy

**Refactor ID**: refactor-001
**Assessment Date**: January 6, 2026
**Status**: [ ] Initial Review | [ ] Gaps Identified | [ ] Critical Tests Added | [ ] Ready for Baseline

## Critical Requirement

⚠️ **This assessment MUST be completed BEFORE capturing baseline metrics**

**Why**: Refactoring requires behavior preservation validation. Without adequate test coverage, we cannot confidently verify that behavior remains unchanged after renaming packages, moving files, and merging CLI tools.

## Code Areas to Be Modified

### 1. Core Library (`src/` → `packages/objectenvy/`)

**Files Affected**:
- `src/configEnvy.ts` - Main library entry point
- `src/index.ts` - Public API exports
- `src/types.ts` - Type definitions
- `src/typeUtils.ts` - Type utilities
- `src/utils.ts` - Helper functions

**Refactoring Changes**:
- Move from `src/` to `packages/objectenvy/src/`
- Update package name from `configenvy` to `objectenvy`
- Update all internal imports
- Update exports in package.json

**Current Test Status**: ❌ Needs Assessment
- [ ] Unit tests for configEnvy functions
- [ ] Unit tests for type utilities
- [ ] Unit tests for utils functions
- [ ] Integration tests for public API
- [ ] Test coverage measurement needed

**Critical Tests Required**:
1. **API Behavior Tests**: All exported functions must have tests verifying their inputs/outputs
2. **Type Coercion Tests**: Ensure type conversion functions produce expected results
3. **Import/Export Tests**: Verify all public exports are accessible

**Gaps to Address**:
- [ ] Measure current test coverage for core library
- [ ] Identify untested functions/branches
- [ ] Add tests for any critical paths without coverage
- [ ] Document existing test suite completeness

---

### 2. CLI Tool 1: env-y-config (`packages/env-y-config/`)

**Files Affected**:
- `bin/env-y-config.js` - CLI entry point
- `src/cli.ts` - Command parsing
- `src/commands/generate.ts` - Generate command
- `src/generators/` - Code generators
- `src/parsers/` - Config parsers

**Refactoring Changes**:
- Merge into `packages/objectenvy-cli/`
- Rename bin script to `objectenvy-cli`
- Integrate commands into unified CLI structure
- Update package name and references

**Current Test Status**: ❌ Needs Assessment
- [ ] CLI command execution tests
- [ ] Parser tests (JSON, TypeScript)
- [ ] Generator tests (env formatter, sample values)
- [ ] Integration tests for full command workflows
- [ ] Error handling tests

**Critical Tests Required**:
1. **Command Execution**: Each CLI command must have test verifying it runs and produces expected output
2. **Parser Accuracy**: All parsers must have tests for various input formats
3. **Generator Output**: Generated files must match expected format/content

**Gaps to Address**:
- [ ] Test CLI entry point and argument parsing
- [ ] Test each command independently
- [ ] Test error conditions and edge cases
- [ ] Verify file I/O operations in tests

---

### 3. CLI Tool 2: config-y-env (`packages/config-y-env/`)

**Files Affected**:
- `bin/config-y-env.js` - CLI entry point
- `src/cli.ts` - Command parsing
- `src/types.ts` - Type definitions
- `src/utils/` - Utility functions

**Refactoring Changes**:
- Merge into `packages/objectenvy-cli/`
- Combine with env-y-config functionality
- Consolidate overlapping utilities
- Update package name and references

**Current Test Status**: ❌ Needs Assessment
- [ ] CLI command execution tests
- [ ] Utility function tests
- [ ] Integration tests
- [ ] Error handling tests

**Critical Tests Required**:
1. **Command Execution**: Verify all commands work with various inputs
2. **Utility Functions**: Test all helper functions
3. **Merge Compatibility**: Ensure no conflicts with env-y-config functionality

**Gaps to Address**:
- [ ] Identify duplicate functionality with env-y-config
- [ ] Test consolidated CLI structure
- [ ] Verify feature parity after merge
- [ ] Test combined command set

---

### 4. VS Code Extension (`packages/vscode-envyconfig/` → `packages/objectenvy-vscode/`)

**Files Affected**:
- `package.json` - Extension manifest
- `src/extension.ts` - Extension activation and commands

**Refactoring Changes**:
- Rename directory to `objectenvy-vscode`
- Update extension name, displayName, ID
- Update activation events
- Update command IDs and references

**Current Test Status**: ❌ Needs Assessment
- [ ] Extension activation tests
- [ ] Command execution tests
- [ ] VS Code API integration tests

**Critical Tests Required**:
1. **Activation**: Extension must activate properly
2. **Commands**: All registered commands must execute
3. **Integration**: VS Code API calls must work correctly

**Gaps to Address**:
- [ ] Add extension activation test
- [ ] Test each registered command
- [ ] Verify extension behaves identically after rename
- [ ] Test in development extension host

---

### 5. Cross-Package Integration

**Integration Points**:
- CLI tools depend on core library
- VS Code extension may depend on core library
- Import paths between packages
- Workspace configuration

**Refactoring Changes**:
- Update all inter-package imports
- Update workspace dependencies
- Update tsconfig paths

**Current Test Status**: ❌ Needs Assessment
- [ ] Integration tests between packages
- [ ] Import resolution tests
- [ ] Workspace build tests

**Critical Tests Required**:
1. **Import Resolution**: All cross-package imports must resolve correctly
2. **Dependency Chain**: CLI and extension must successfully use core library
3. **Build Integration**: Full workspace build must succeed

**Gaps to Address**:
- [ ] Test cross-package imports
- [ ] Verify dependency resolution after rename
- [ ] Test full workspace build
- [ ] Verify published packages can import each other

---

## Test Coverage Analysis

### Current Coverage (Needs Measurement)

**Core Library**:
- Overall Coverage: [NEEDS MEASUREMENT]%
- Lines Covered: [NEEDS MEASUREMENT]
- Branches Covered: [NEEDS MEASUREMENT]
- Functions Covered: [NEEDS MEASUREMENT]

**env-y-config CLI**:
- Overall Coverage: [NEEDS MEASUREMENT]%
- Critical Paths: [NEEDS ASSESSMENT]

**config-y-env CLI**:
- Overall Coverage: [NEEDS MEASUREMENT]%
- Critical Paths: [NEEDS ASSESSMENT]

**VS Code Extension**:
- Overall Coverage: [NEEDS MEASUREMENT]%
- Activation: [NEEDS ASSESSMENT]

### Coverage Gaps Priority

**🔴 Critical (MUST FIX before baseline)**:
1. [ ] Core library public API - all exports must be tested
2. [ ] CLI command execution - each command must have execution test
3. [ ] VS Code extension activation - must verify extension activates
4. [ ] Package import/export - verify all packages can import core library

**🟡 Important (SHOULD FIX before baseline)**:
1. [ ] Parser edge cases in CLI tools
2. [ ] Error handling in all packages
3. [ ] File I/O operations
4. [ ] Cross-package integration scenarios

**🟢 Nice to Have (Can defer)**:
1. [ ] Non-critical utility functions
2. [ ] Internal implementation details
3. [ ] Comprehensive edge case coverage
4. [ ] Performance regression tests

---

## Action Plan

### Step 1: Measure Current Coverage
- [ ] Run test coverage for core library: `cd src && pnpm test --coverage`
- [ ] Run test coverage for env-y-config: `cd packages/env-y-config && pnpm test --coverage`
- [ ] Run test coverage for config-y-env: `cd packages/config-y-env && pnpm test --coverage`
- [ ] Run test coverage for VS Code extension: `cd packages/vscode-envyconfig && pnpm test --coverage`
- [ ] Document current coverage numbers above

### Step 2: Identify Critical Gaps
- [ ] Review coverage reports for untested critical paths
- [ ] List all public APIs without tests
- [ ] Identify CLI commands without execution tests
- [ ] Check VS Code extension activation coverage

### Step 3: Write Missing Tests (Critical Only)
- [ ] Add tests for uncovered public APIs in core library
- [ ] Add execution tests for all CLI commands
- [ ] Add VS Code extension activation test
- [ ] Add cross-package import tests

### Step 4: Verify Tests Pass
- [ ] Run all tests: `pnpm test`
- [ ] Ensure 100% test pass rate
- [ ] No flaky tests
- [ ] All critical paths covered

### Step 5: Mark Ready for Baseline
- [ ] All critical tests added and passing
- [ ] Coverage documented
- [ ] Gaps documented (for those deferred)
- [ ] Update refactor-spec.md Phase 0 checklist

---

## Completion Criteria

**Ready to Proceed to Baseline When**:
- ✅ All critical tests identified and added
- ✅ All tests passing (100% pass rate)
- ✅ Core library public API fully tested
- ✅ CLI commands have execution tests
- ✅ VS Code extension activation tested
- ✅ Cross-package imports tested
- ✅ Coverage gaps documented
- ✅ Test suite provides confidence for behavior preservation

**DO NOT PROCEED** if critical gaps remain - refactoring without adequate test coverage cannot guarantee behavior preservation.

---

## Notes

**Behavioral Preservation Strategy**:
This refactoring is purely structural (rename, move, merge). The key to success is ensuring:
1. All imports resolve after package rename
2. All CLI commands execute identically
3. VS Code extension behaves identically
4. Core library API produces same outputs

**Test Philosophy**:
- Focus on **behavior** (inputs/outputs), not implementation
- Test **public APIs**, not private internals
- Ensure **reproducible** results
- Verify **integration points** between packages

**After Baseline**:
Once baseline is captured, these tests will serve as regression tests throughout the refactoring process. Every commit should maintain 100% test pass rate.
