# Refactor Spec: Rename Project to ObjectEnvy

**Refactor ID**: refactor-001
**Branch**: `refactor/001-rename-project-objectenvy`
**Created**: January 6, 2026
**Type**: [x] Maintainability | [ ] Performance | [ ] Security | [ ] Architecture | [ ] Tech Debt
**Impact**: [x] Medium Risk
**Status**: [x] Planning | [ ] Baseline Captured | [ ] In Progress | [ ] Validation | [ ] Complete

## Input
User description: "rename project to objectenvy - library: objectenvy, cli: (single package) objectenvy-cli and plugin: objectenvy-vscode"

## Motivation

### Current State Problems
**Code Smell(s)**:
- [ ] Duplication (DRY violation)
- [ ] God Object/Class (too many responsibilities)
- [ ] Long Method (too complex)
- [ ] Feature Envy (accessing other object's data)
- [ ] Primitive Obsession
- [ ] Dead Code
- [ ] Magic Numbers/Strings
- [ ] Tight Coupling
- [x] Other: Inconsistent/unclear naming that doesn't reflect project scope

**Concrete Examples**:
- Current name "configenvy" focuses on configuration, but the project has evolved to handle more general object management
- Package structure has three separate packages (env-y-config, config-y-env, vscode-envyconfig) with inconsistent naming
- Repository name, package names, and CLI tool names don't align in a clear, intuitive way
- Documentation and imports reference "configenvy" which may not communicate the broader purpose

### Business/Technical Justification
[Why is this refactoring needed NOW?]
- [x] Developer velocity impact - clearer naming reduces cognitive load
- [x] Technical debt accumulation - inconsistent naming across packages
- [x] Other: Better branding and project identity before wider adoption
  - Establishes clearer project scope and purpose
  - Creates consistent naming convention across all components
  - Makes the project more discoverable and memorable
  - Simplifies onboarding for new contributors and users

## Proposed Improvement

### Refactoring Pattern/Technique
**Primary Technique**: Systematic Rename - updating all references to project and package names across codebase, documentation, and configuration files

**High-Level Approach**:
Rename the project from "configenvy" to "objectenvy" with a clear, consistent package structure:
- Core library: `objectenvy`
- CLI tool (merged from env-y-config and config-y-env): `objectenvy-cli`
- VS Code extension: `objectenvy-vscode`

This consolidates the two CLI packages into one unified tool while establishing a clear naming pattern.

**Files Affected**:
- **Modified**: 
  - `package.json` (root and all packages)
  - `pnpm-workspace.yaml`
  - `README.md` and all documentation files
  - `tsconfig.json` files
  - All source files with imports or references to old names
  - CLI bin files
  - VS Code extension manifest
  - GitHub configuration files
  - All spec and documentation files in `specs/` directory
  
- **Created**: 
  - `packages/objectenvy/` (renamed from `src/`)
  - `packages/objectenvy-cli/` (merged from env-y-config and config-y-env)
  - `packages/objectenvy-vscode/` (renamed from vscode-envyconfig)
  
- **Deleted**: 
  - `packages/env-y-config/`
  - `packages/config-y-env/`
  - `packages/vscode-envyconfig/`
  - Old `src/` directory if moved to package
  
- **Moved**: 
  - Core library source code to `packages/objectenvy/src/`
  - CLI functionality merged into `packages/objectenvy-cli/src/`

### Design Improvements
**Before**:
```
configenvy/
├── src/ (core library, not in packages/)
├── packages/
│   ├── env-y-config/ (CLI tool 1)
│   ├── config-y-env/ (CLI tool 2)
│   └── vscode-envyconfig/ (VS Code extension)
```

**After**:
```
objectenvy/
├── packages/
│   ├── objectenvy/ (core library)
│   ├── objectenvy-cli/ (unified CLI tool)
│   └── objectenvy-vscode/ (VS Code extension)
```

## Phase 0: Testing Gap Assessment
*CRITICAL: Complete BEFORE capturing baseline metrics - see testing-gaps.md*

### Pre-Baseline Testing Requirement
- [ ] **Testing gaps assessment completed** (see `testing-gaps.md`)
- [ ] **Critical gaps identified and addressed**
- [ ] **All affected functionality has adequate test coverage**
- [ ] **Ready to capture baseline metrics**

**Rationale**: This refactoring involves moving files, renaming packages, and merging CLI tools. We need adequate test coverage to ensure all functionality continues to work after the rename. Special attention needed for:
- Import resolution after package rename
- CLI command execution after merge
- VS Code extension activation after rename
- Core library exports and API

### Testing Coverage Status
**Affected Code Areas**:
- Core Library (`src/`): Coverage needs assessment - [ ] ❌ Needs Review
- CLI Tools (env-y-config, config-y-env): Coverage needs assessment - [ ] ❌ Needs Review
- VS Code Extension (vscode-envyconfig): Coverage needs assessment - [ ] ❌ Needs Review
- Integration between packages: Coverage needs assessment - [ ] ❌ Needs Review

**Action Needed**:
- [ ] Assess current test coverage for all packages
- [ ] Identify gaps in import/export testing
- [ ] Add tests for CLI command execution
- [ ] Add tests for VS Code extension activation
- [ ] Document current state in testing-gaps.md

---

## Baseline Metrics
*Captured AFTER testing gaps are addressed - see metrics-before.md*

### Code Complexity
- **Cyclomatic Complexity**: See metrics-before.md
- **Cognitive Complexity**: See metrics-before.md
- **Lines of Code**: See metrics-before.md
- **Function Length (avg/max)**: See metrics-before.md
- **Class Size (avg/max)**: See metrics-before.md
- **Duplication**: See metrics-before.md

### Test Coverage
- **Overall Coverage**: See metrics-before.md
- **Lines Covered**: See metrics-before.md
- **Branches Covered**: See metrics-before.md
- **Functions Covered**: See metrics-before.md

### Performance
- **Build Time**: See metrics-before.md
- **Bundle Size**: See metrics-before.md
- **Runtime Performance**: See metrics-before.md
- **Memory Usage**: See metrics-before.md

### Dependencies
- **Direct Dependencies**: See metrics-before.md
- **Total Dependencies**: See metrics-before.md
- **Outdated Dependencies**: See metrics-before.md

## Target Metrics
*Goals to achieve - measurable success criteria*

### Code Quality Goals
- **Lines of Code**: Acceptable if reduced due to CLI consolidation
- **Duplication**: Should reduce after merging CLI packages
- **Test Coverage**: Maintain current coverage levels or improve
- **Package Count**: Reduce from 3 to 3 packages but with clearer organization

### Performance Goals
- **Build Time**: Maintain or improve (consolidation may speed up builds)
- **Bundle Size**: Maintain or reduce (eliminating duplication in CLIs)
- **Runtime Performance**: Maintain (no functional changes)
- **Memory Usage**: Maintain

### Success Threshold
**Minimum acceptable improvement**: 
- All packages renamed successfully
- All imports resolve correctly
- All tests pass without modification (behavior unchanged)
- CLI tools work with new names
- VS Code extension activates with new name
- Documentation updated and consistent
- No performance regression

## Behavior Preservation Guarantee
*CRITICAL: Refactoring MUST NOT change external behavior*

### External Contracts Unchanged
- [x] API endpoints return same responses (core library API unchanged)
- [x] Function signatures unchanged
- [x] Component props unchanged (VS Code extension)
- [x] CLI arguments unchanged (CLI functionality identical)
- [ ] Database schema unchanged (N/A)
- [x] File formats unchanged (.env, config files)

### Test Suite Validation
- [x] **All existing tests MUST pass WITHOUT modification**
- [x] If test needs changing, verify it was testing implementation detail (e.g., package names in paths), not behavior
- [x] Do NOT weaken assertions to make tests pass

### Behavioral Snapshot
**Key behaviors to preserve**:
1. Core library: All configuration parsing and type coercion functions produce identical outputs
2. CLI tools: All commands execute with same results (env generation, config parsing)
3. VS Code extension: All features work identically (syntax highlighting, validation, conversion)
4. Integration: Cross-package imports and usage patterns remain functional

**Test**: Run test suite before and after refactoring, all tests MUST pass

## Risk Assessment

### Risk Level Justification
**Why Medium Risk**:
- Extensive file and package renaming across entire codebase
- Merging two CLI packages introduces integration risk
- Import paths will change throughout the codebase
- Risk of missing references in documentation or configuration
- VS Code extension marketplace publication requires careful handling
- However: No functional code changes, only naming/structure
- Mitigation: Comprehensive testing and incremental approach reduces risk

### Potential Issues
- **Risk 1**: Missed references to old package names in documentation or comments
  - **Mitigation**: Thorough grep search for all variations of old names before completion
  - **Rollback**: Revert commits, republish old package names if needed

- **Risk 2**: Import resolution breaks after package rename
  - **Mitigation**: Update tsconfig paths, verify all imports before committing
  - **Rollback**: Git revert the branch

- **Risk 3**: VS Code extension fails to activate after rename
  - **Mitigation**: Test extension locally before publishing, check all activation events
  - **Rollback**: Revert extension publication, publish under old name

- **Risk 4**: CLI merge introduces conflicts or missing functionality
  - **Mitigation**: Merge gradually, test each command individually, maintain feature parity
  - **Rollback**: Keep separate packages in fallback branch

- **Risk 5**: npm/VS Code marketplace namespace conflicts
  - **Mitigation**: Check availability of package names before starting, reserve names
  - **Rollback**: Use alternative names if conflicts discovered

### Safety Measures
- [x] Feature flag available for gradual rollout (N/A for rename)
- [x] Monitoring in place for key metrics (test suite)
- [x] Rollback plan tested (git revert)
- [x] Incremental commits (can revert partially)
- [x] Peer review required
- [ ] Staging environment test required (local testing)

## Rollback Plan

### How to Undo
1. `git revert` the refactor commits (each atomic change can be reverted)
2. If packages were published: republish old package names with updated versions
3. If VS Code extension was published: republish old extension name
4. Update any external references (documentation sites, links)
5. Verify all imports and tests pass

### Rollback Triggers
Revert if any of these occur:
- [x] Test suite failure after rename
- [x] Import resolution errors
- [x] CLI tools fail to execute
- [x] VS Code extension fails to activate or load
- [x] Package publication failures
- [ ] Performance regression > 10% (unlikely for rename)
- [ ] Production error rate increase (N/A - tooling project)

### Recovery Time Objective
**RTO**: < 1 hour (git revert, republish packages if needed)

## Implementation Plan

### Phase 0: Testing Gap Assessment (Pre-Baseline)
**CRITICAL FIRST STEP**: Assess and address testing gaps BEFORE baseline

1. Review `testing-gaps.md` template
2. Identify all code that will be modified during refactoring:
   - All package.json files
   - All import statements
   - CLI bin files and commands
   - VS Code extension manifest and activation
   - Documentation files
3. Assess test coverage for each package:
   - Core library test coverage
   - CLI test coverage for both tools
   - VS Code extension test coverage
   - Integration test coverage
4. Document gaps (critical, important, nice-to-have)
5. **Add tests for critical gaps** - DO NOT proceed without these:
   - Core library API tests
   - CLI command execution tests
   - VS Code extension activation tests
   - Package import/export tests
6. Verify all new tests pass
7. Mark testing gaps assessment as complete

**Checkpoint**: Only proceed to Phase 1 when adequate test coverage exists

### Phase 1: Baseline (Before Refactoring)
1. Capture all baseline metrics (metrics already captured in metrics-before.md)
2. Create behavioral snapshot (document current outputs)
3. Ensure 100% test pass rate (including newly added tests)
4. Tag current state in git: `git tag pre-refactor-001 -m "Baseline before refactor-001"`

### Phase 2: Refactoring (Incremental)

#### Step 1: Prepare and Reserve Names
1. Check npm registry for `objectenvy`, `objectenvy-cli`, `objectenvy-vscode` availability
2. Check VS Code marketplace for `objectenvy-vscode` availability
3. Reserve names if possible

#### Step 2: Rename Core Library Package
1. Create `packages/objectenvy/` directory structure
2. Move `src/` contents to `packages/objectenvy/src/`
3. Update `packages/objectenvy/package.json` with new name
4. Update root `package.json` and workspace configuration
5. Update all imports across codebase
6. Run tests - MUST pass

#### Step 3: Merge CLI Packages
1. Create `packages/objectenvy-cli/` directory
2. Analyze and merge functionality from `env-y-config` and `config-y-env`
3. Create unified CLI entry point
4. Consolidate commands under single tool
5. Update bin files with new package name
6. Update package.json dependencies
7. Run CLI tests - MUST pass

#### Step 4: Rename VS Code Extension
1. Rename `packages/vscode-envyconfig/` to `packages/objectenvy-vscode/`
2. Update extension manifest (package.json):
   - Name, displayName, description
   - Publisher settings if needed
3. Update extension activation code
4. Update all internal references
5. Test extension locally - MUST activate and function

#### Step 5: Update Documentation and Configuration
1. Update root README.md
2. Update all documentation in `specs/`
3. Update GitHub repository settings (if access available)
4. Update all configuration files (tsconfig, eslint, etc.)
5. Update changelog with rename information

#### Step 6: Update Import References
1. Search for all references to old package names
2. Update import statements throughout codebase
3. Update require/import paths in tests
4. Verify no old references remain

**Principle**: Each step should compile and pass tests

### Phase 3: Validation
1. Run full test suite across all packages (MUST pass 100%)
2. Re-measure all metrics
3. Compare behavioral snapshot (MUST be identical)
4. Manual testing:
   - Build all packages
   - Test CLI commands manually
   - Test VS Code extension in development mode
   - Verify all imports resolve
5. Performance regression test (build times, test execution)

### Phase 4: Publication and Deployment
1. Code review focused on:
   - Complete rename coverage
   - No broken imports
   - Behavior preservation
2. Publish packages to npm:
   - `objectenvy` (core library)
   - `objectenvy-cli` (CLI tool)
3. Publish VS Code extension:
   - `objectenvy-vscode` to marketplace
4. Update GitHub repository:
   - Repository name (if possible)
   - Description
   - Topics/tags
5. Monitor for 24-48 hours:
   - Package download success
   - Installation issues
   - User reports

## Verification Checklist

### Phase 0: Testing Gap Assessment
- [ ] Testing gaps assessment completed (testing-gaps.md)
- [ ] All affected code areas identified
- [ ] Test coverage assessed for each package
- [ ] Critical gaps identified and documented
- [ ] Tests added for all critical gaps
- [ ] All new tests passing
- [ ] Ready to proceed to baseline capture

### Pre-Refactoring (Phase 1)
- [ ] Baseline metrics captured and documented
- [ ] All tests passing (100% pass rate)
- [ ] Behavioral snapshot created
- [ ] Git tag created
- [ ] Rollback plan prepared
- [ ] Package names checked for availability

### During Refactoring
- [ ] Incremental commits (each one compiles and tests pass)
- [ ] External behavior unchanged
- [ ] No new dependencies added (unless justified)
- [ ] Comments updated to match new names
- [ ] Dead code removed (duplicate CLI code after merge)
- [ ] All imports updated
- [ ] All documentation updated

### Post-Refactoring
- [ ] All tests still passing (100% pass rate)
- [ ] Target metrics achieved (package count, duplication reduced)
- [ ] Behavioral snapshot matches (behavior unchanged)
- [ ] No performance regression
- [ ] All packages build successfully
- [ ] CLI tools execute correctly with new names
- [ ] VS Code extension activates and functions
- [ ] No references to old package names remain
- [ ] Code review approved
- [ ] Documentation updated and consistent

### Post-Publication
- [ ] All packages published successfully to npm
- [ ] VS Code extension published to marketplace
- [ ] Packages can be installed via npm/pnpm
- [ ] Extension can be installed from marketplace
- [ ] README installation instructions work
- [ ] No user reports of broken functionality

## Related Work

### Blocks
- Clear branding strategy for project
- Consistent documentation across all components
- Future marketing and adoption efforts

### Enables
- Simplified package structure (3 packages with clear naming)
- Better discoverability in npm and VS Code marketplace
- Foundation for future expansion beyond just configuration management
- Easier onboarding for new contributors
- More intuitive import paths and package references

### Dependencies
- None - this refactoring is independent and can be done at any time
- Recommended: Complete before major new features to avoid rename conflicts
