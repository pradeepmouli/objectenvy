# Enhancement: Array Value Support for Comma-Separated Environment Variables

**Enhancement ID**: enhance-001
**Branch**: `enhance/001-and-support-for-array-values-when-env-value-has-th`
**Created**: 2026-01-02
**Priority**: [ ] High | [x] Medium | [ ] Low
**Component**: `src/utils.ts` (coerceValue function)
**Status**: [x] Planned | [ ] In Progress | [ ] Complete

## Input
User description: "and support for array values when env value has the form foo,bar,zed"

## Overview
Add automatic detection and parsing of comma-separated values in environment variables, converting them to typed arrays. When an environment variable contains comma-separated values (e.g., `ALLOWED_HOSTS=foo,bar,zed`), the `coerceValue` function will automatically parse it into an array `['foo', 'bar', 'zed']` while preserving type coercion for each element.

## Motivation
Environment variables often need to represent lists of values (allowed hosts, feature flags, service URLs, etc.). Currently, users must manually split comma-separated strings in their application code. Built-in array support would:
- Provide automatic parsing of comma-separated values
- Apply type coercion to array elements (e.g., `"1,2,3"` → `[1, 2, 3]`)
- Simplify configuration handling for multi-value settings
- Maintain consistency with existing boolean/number coercion

## Proposed Changes

**Core Logic**:
- Detect comma-separated values in environment variable strings
- Split values on comma delimiter and trim whitespace
- Apply existing type coercion to each array element
- Preserve backward compatibility for values that shouldn't be split

**Array Detection Strategy**:
1. Check if value contains commas
2. Split on comma and trim each element
3. Apply coerceValue recursively to each element
4. Return array if valid, otherwise return original string

**Edge Cases to Handle**:
- Empty strings between commas (e.g., `"a,,b"` → skip empty values or `['a', '', 'b']`)
- Escaped commas in values (consider if needed)
- Mixed type arrays (e.g., `"true,123,hello"` → `[true, 123, 'hello']`)
- Single values without commas (remain as-is)

**Files to Modify**:
- `src/utils.ts` - Update `coerceValue` function to detect and parse arrays
- `src/utils.test.ts` - Add comprehensive tests for array coercion
- `src/configEnvy.test.ts` - Add integration tests with full config objects
- `src/types.ts` - Update ConfigValue type to include arrays

**Breaking Changes**: [ ] Yes | [x] No

This is a backward-compatible enhancement. Existing single-value environment variables will continue to work as before. Only values containing commas will be parsed as arrays.

## Implementation Plan

**Phase 1: Implementation**

**Tasks**:
1. [ ] Update `ConfigValue` type in `src/types.ts` to include array type
2. [ ] Modify `coerceValue` function in `src/utils.ts` to detect and parse comma-separated values
3. [ ] Add unit tests for array coercion in `src/utils.test.ts`
4. [ ] Add integration tests in `src/configEnvy.test.ts` for full config with arrays
5. [ ] Run full test suite and ensure no regressions
6. [ ] Update build and verify type checking passes

**Acceptance Criteria**:
- [ ] `coerceValue("foo,bar,zed")` returns `['foo', 'bar', 'zed']`
- [ ] `coerceValue("1,2,3")` returns `[1, 2, 3]` (with type coercion)
- [ ] `coerceValue("true,false")` returns `[true, false]`
- [ ] Mixed type arrays work correctly (e.g., `"1,hello,true"` → `[1, 'hello', true]`)
- [ ] Single values without commas remain unchanged
- [ ] All existing tests continue to pass
- [ ] Type checking passes with updated ConfigValue type

## Testing
- [ ] Unit tests added/updated
  - Array parsing with various value types
  - Edge cases (empty elements, single values, etc.)
  - Mixed type arrays
- [ ] Integration tests pass
  - Full config objects with array values
  - Nested configs with arrays
  - Schema validation with arrays (if applicable)
- [ ] Manual testing complete
- [ ] Edge cases verified
  - Empty strings between commas
  - Whitespace handling
  - Single comma (edge case)

## Verification Checklist
- [ ] Changes implemented as described
- [ ] Tests written and passing
- [ ] No regressions in existing functionality
- [ ] Documentation updated (if needed) - README examples for array usage
- [ ] Code reviewed (if appropriate)

## Notes

**Design Decisions**:
- Use simple comma delimiter without support for escaped commas (YAGNI principle)
- Apply type coercion to each array element for consistency
- Trim whitespace around elements for user convenience
- Filter out empty values between commas for cleaner arrays

**Future Considerations**:
- Custom array delimiter configuration (if users request it)
- Support for escaped commas in values (if use cases emerge)
- JSON array parsing support (e.g., `'["a","b","c"]'`)

**Example Usage After Enhancement**:
```typescript
// Environment: ALLOWED_HOSTS=localhost,example.com,api.example.com
const config = configEnvy();
// config.allowedHosts = ['localhost', 'example.com', 'api.example.com']

// Environment: PORT_NUMBERS=3000,3001,3002
// config.portNumbers = [3000, 3001, 3002]

// Environment: FEATURE_FLAGS=feature1,feature2,feature3
// config.featureFlags = ['feature1', 'feature2', 'feature3']
```

---
*Enhancement created using `/enhance` workflow - See .specify/extensions/workflows/enhance/*
