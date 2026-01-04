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
