# Implementation Plan: Array Value Support for Comma-Separated Environment Variables

**Branch**: `enhance/001-and-support-for-array-values-when-env-value-has-th` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/enhance/001-and-support-for-array-values-when-env-value-has-th/spec.md`

**Note**: This plan documents the design and implementation approach for automatic array parsing of comma-separated environment variable values.

## Summary

Add automatic detection and parsing of comma-separated values in environment variables, converting them to typed arrays. When an environment variable contains comma-separated values (e.g., `ALLOWED_HOSTS=foo,bar,zed`), the `coerceValue` function will automatically parse it into an array `['foo', 'bar', 'zed']` while preserving type coercion for each element. This enhancement maintains backward compatibility and follows the existing type coercion patterns for boolean and number values.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode enabled
**Primary Dependencies**: None for core functionality; Zod 4.3.4+ as optional peer dependency
**Storage**: N/A (in-memory configuration library)
**Testing**: Vitest 4.0+ for unit and integration tests
**Target Platform**: Node.js 20.0+ (ESNext module system)
**Project Type**: Single library package (npm module)
**Performance Goals**: Near-instant parsing (<1ms for typical configs with 20-50 env vars)
**Constraints**: 
  - Zero runtime dependencies (Zod peer dependency only)
  - Backward compatible (no breaking changes to existing API)
  - Type-safe array coercion with proper TypeScript inference
**Scale/Scope**: Small enhancement to existing `coerceValue` function (~30 lines of new logic)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with envyconfig Constitution v1.1.0 principles:

- [x] **Type Safety First**: All new APIs designed with explicit types, no `any`
  - `ConfigArray` type added as `Array<ConfigPrimitive | ConfigObject>`
  - `coerceValue` return type updated to include array: `string | number | boolean | Array<...>`
  - No use of `any` type in implementation
- [x] **Test-Driven Public APIs**: Test plan documented before implementation
  - Comprehensive test cases defined in spec.md acceptance criteria
  - Unit tests for `coerceValue` array parsing in `utils.test.ts`
  - Integration tests in `configEnvy.test.ts` for full config objects
- [x] **Code Quality Standards**: Linting/formatting rules identified for new code
  - Existing oxlint and oxfmt configurations apply
  - No special linting rules needed
  - Code follows existing 2-space indent, single quotes, semicolons pattern
- [x] **Semantic Versioning**: Breaking changes documented, version bump planned
  - **MINOR version bump** (0.2.0 → 0.3.0) - new feature, backward compatible
  - No breaking changes: existing single-value env vars work unchanged
  - Only values with commas are parsed as arrays
- [x] **Documentation Discipline**: JSDoc requirements identified for new public APIs
  - `coerceValue` JSDoc updated to mention array support
  - `ConfigArray` type documented with JSDoc in types.ts
  - README examples added showing array usage patterns
- [x] **Modern TypeScript Patterns**: ES2022+ features used, no legacy patterns
  - Uses array methods (map, filter), template literals
  - Strict equality checks (===)
  - No var, Function.prototype.bind, or other legacy patterns
- [x] **Zero-Runtime Dependencies**: No new runtime dependencies introduced (peer deps only if justified)
  - **CONFIRMED**: No new dependencies added
  - Core array parsing uses only built-in JavaScript string and array methods
  - Zod remains optional peer dependency (unchanged)

## Project Structure

### Documentation (this feature)

```text
specs/enhance/001-and-support-for-array-values-when-env-value-has-th/
├── spec.md              # Feature specification (existing)
├── enhancement.md       # Enhancement summary (existing)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output - design decisions
├── data-model.md        # Phase 1 output - type definitions
├── quickstart.md        # Phase 1 output - usage examples
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── configEnvy.ts        # Main config function (no changes needed)
├── configEnvy.test.ts   # Integration tests (add array tests)
├── index.ts             # Public exports (no changes needed)
├── types.ts             # Type definitions (update ConfigValue, add ConfigArray)
├── utils.ts             # Utility functions (update coerceValue)
├── utils.test.ts        # Unit tests (add array coercion tests)
├── typeUtils.ts         # Type utilities (no changes needed)
└── typeUtils.test.ts    # Type utility tests (no changes needed)

specs/
└── enhance/
    └── 001-and-support-for-array-values-when-env-value-has-th/
        └── [documentation files listed above]
```

**Structure Decision**: This is a single-package TypeScript library with a flat src/ structure. All source files are in src/ with co-located test files (*.test.ts). The enhancement requires changes to only 3 files:
1. `src/types.ts` - Add `ConfigArray` type definition
2. `src/utils.ts` - Update `coerceValue` function to detect and parse arrays
3. Test files - Add comprehensive test coverage

## Complexity Tracking

> **No violations identified - Constitution Check passed completely**

This enhancement introduces no complexity violations. All constitution principles are satisfied:
- Type safety maintained with explicit types
- TDD approach followed with comprehensive tests
- No new runtime dependencies
- Backward compatible (MINOR version bump appropriate)
- Modern TypeScript patterns used throughout

## Phase 0: Research & Design Decisions

**Status**: ✅ Complete

**Duration**: 1 day

**Output**: [research.md](./research.md)

### Research Questions Resolved

1. **Array Detection Strategy**: Use comma presence as trigger, split and filter empty elements
2. **Type Coercion**: Apply existing coercion logic recursively to array elements
3. **Edge Cases**: Comprehensive handling of empty elements, whitespace, single values
4. **Escaped Commas**: Deferred to future version (YAGNI principle)
5. **Type Definitions**: Added `ConfigArray` type, updated `ConfigValue` union
6. **Performance**: Negligible impact (<1ms for typical configs)
7. **Backward Compatibility**: Fully compatible, no breaking changes

### Key Decisions

- **Simple comma delimiter** without escaping support (can add later if needed)
- **Filter empty elements** for cleaner arrays
- **Single element fallback** to scalar for user intent preservation
- **Zero new dependencies** using only built-in JavaScript methods
- **Recursive type coercion** for consistency with existing patterns

### Alternatives Considered

- JSON array parsing: Too complex, rejected
- Custom delimiter option: Deferred to future, not needed for v1
- Bracket syntax: Non-standard, rejected

## Phase 1: Design & Contracts

**Status**: ✅ Complete

**Duration**: 1 day

**Outputs**:
- [data-model.md](./data-model.md) - TypeScript type definitions and data structures
- [quickstart.md](./quickstart.md) - Usage examples and user guide
- [AGENTS.md](../../AGENTS.md) - Updated with array support context

### Deliverables

#### 1. Data Model (data-model.md)

Comprehensive type definitions including:
- `ConfigArray` type: `Array<ConfigPrimitive | ConfigObject>`
- Updated `ConfigValue` union to include arrays
- Updated `coerceValue` function signature
- Complete data flow diagrams
- 6 detailed examples covering all use cases
- Schema integration patterns (with/without Zod)

#### 2. Quick Start Guide (quickstart.md)

User-facing documentation covering:
- Basic usage patterns (string, number, boolean, mixed arrays)
- Advanced usage (nested configs, prefix filtering, Zod schemas)
- Common patterns (feature flags, service discovery, CORS)
- Edge cases and troubleshooting
- Migration guide from manual splitting
- Best practices with 4 key recommendations

#### 3. Agent Context Update

Updated `AGENTS.md` with:
- Active Technologies section listing TypeScript 5.9+, Zod, Vitest, oxlint, oxfmt
- Recent Changes section documenting array support enhancement

### Constitution Re-Check (Post-Design)

All constitution principles verified and confirmed:

- ✅ **Type Safety First**: All types explicit, no `any` usage
- ✅ **Test-Driven Public APIs**: Comprehensive test plan documented
- ✅ **Code Quality Standards**: Follows existing linting/formatting rules
- ✅ **Semantic Versioning**: MINOR bump (0.2.0 → 0.3.0), backward compatible
- ✅ **Documentation Discipline**: JSDoc and README updates planned
- ✅ **Modern TypeScript Patterns**: ES2022+ features, modern patterns
- ✅ **Zero-Runtime Dependencies**: No new dependencies added

**Gate Status**: ✅ PASSED - All principles satisfied, ready for implementation

## Phase 2: Task Breakdown

**Status**: 📋 Ready for `/speckit.tasks` command

**Note**: Phase 2 is not part of the `/speckit.plan` command. Run `/speckit.tasks` to generate detailed implementation tasks.

### Expected Task Categories

Based on the design, tasks will include:

1. **Type Definitions**
   - Add `ConfigArray` type to types.ts
   - Update `ConfigValue` union type
   - Update `coerceValue` function signature

2. **Implementation**
   - Modify `coerceValue` function with array detection logic
   - Add comma parsing and filtering
   - Implement recursive coercion

3. **Testing**
   - Unit tests for `coerceValue` array parsing
   - Integration tests for full config with arrays
   - Edge case tests (empty elements, whitespace, single values)
   - Regression tests to ensure no breaking changes

4. **Documentation**
   - Update function JSDoc comments
   - Add README section with array examples
   - Update API reference

5. **Validation**
   - Run full test suite
   - Verify type checking passes
   - Run linting and formatting
   - Manual testing with sample configs

## Summary

### What Was Accomplished

This implementation plan provides a complete blueprint for adding array value support to envyconfig:

1. **Technical Foundation**: Documented project context, technology stack, and constraints
2. **Constitution Compliance**: Verified alignment with all 7 core principles (Type Safety, TDD, Code Quality, Semantic Versioning, Documentation, Modern Patterns, Zero Dependencies)
3. **Research Phase**: Resolved 7 key research questions with documented decisions and rationale
4. **Design Phase**: Created comprehensive data model with types, flow diagrams, and 6 detailed examples
5. **User Documentation**: Developed complete quick start guide with usage patterns, troubleshooting, and best practices
6. **Agent Context**: Updated AGENTS.md with feature information for AI assistants

### Key Artifacts

| Artifact | Purpose | Status |
|----------|---------|--------|
| [plan.md](./plan.md) | Implementation plan (this file) | ✅ Complete |
| [research.md](./research.md) | Design decisions and rationale | ✅ Complete |
| [data-model.md](./data-model.md) | Type definitions and data structures | ✅ Complete |
| [quickstart.md](./quickstart.md) | User guide and examples | ✅ Complete |
| [AGENTS.md](../../AGENTS.md) | AI agent context | ✅ Updated |
| tasks.md | Implementation task breakdown | 📋 Pending `/speckit.tasks` |

### Design Highlights

1. **Backward Compatible**: No breaking changes, values without commas work exactly as before
2. **Type Safe**: Full TypeScript support with explicit types and no `any` usage
3. **Zero Dependencies**: Uses only built-in JavaScript methods (split, map, filter, trim)
4. **Automatic Type Coercion**: Arrays get same boolean/number coercion as scalars
5. **User-Friendly Edge Cases**: Filters empty elements, trims whitespace, handles single values gracefully
6. **Zod Integration**: Works seamlessly with optional Zod schemas for validation
7. **Performance**: Negligible overhead (<1ms for typical configs)

### Implementation Readiness

✅ **Ready for Implementation** - All prerequisites satisfied:
- Technical context documented
- Constitution compliance verified
- Research questions resolved
- Design complete with types and examples
- User documentation prepared
- No unknowns or blockers remaining

### Next Steps

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Begin implementation following task order
3. Write tests first (TDD approach) before implementing features
4. Verify each change with tests and linting
5. Update documentation as implementation progresses
6. Conduct final review before merging

### Estimated Implementation Effort

Based on the scope defined in this plan:

- **Type Definitions**: 15 minutes (simple additions to types.ts)
- **Core Implementation**: 1-2 hours (coerceValue function updates)
- **Unit Tests**: 1-2 hours (comprehensive test coverage)
- **Integration Tests**: 30 minutes (full config scenarios)
- **Documentation**: 30 minutes (JSDoc + README updates)
- **Validation**: 30 minutes (full suite, linting, manual testing)

**Total**: 4-6 hours of focused development time

### Success Criteria

The implementation will be considered successful when:

- [x] All research questions resolved with documented decisions
- [x] Complete data model with types and examples
- [x] User documentation (quick start guide) complete
- [x] Constitution principles verified (all 7 checked)
- [ ] All tasks from Phase 2 completed
- [ ] All tests passing (unit + integration)
- [ ] Type checking passing
- [ ] Linting/formatting passing
- [ ] README updated with array examples
- [ ] Version bumped to 0.3.0 (MINOR)
- [ ] Feature working as specified in acceptance criteria

---

**Plan Status**: ✅ Complete (Phases 0-1)  
**Branch**: `enhance/001-and-support-for-array-values-when-env-value-has-th`  
**Date**: 2026-01-04  
**Next Command**: `/speckit.tasks` to generate implementation tasks
