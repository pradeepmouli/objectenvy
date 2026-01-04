# Research: Array Value Support Implementation

**Feature**: enhance-001  
**Date**: 2026-01-04  
**Status**: Complete

## Overview

This document consolidates research findings and design decisions for implementing automatic array parsing of comma-separated environment variable values.

## Research Questions Resolved

### 1. Array Detection Strategy

**Question**: How should we detect when a value should be parsed as an array?

**Decision**: Use comma presence as the trigger
- If a value contains one or more commas, attempt array parsing
- Split on comma, trim whitespace from each element
- Filter out empty strings (e.g., `"a,,b"` → `['a', 'b']`)
- If only one element remains after filtering, treat as single value
- Apply type coercion recursively to each element

**Rationale**:
- Simple and intuitive for users
- Follows common convention for environment variables
- Maintains backward compatibility (values without commas unchanged)
- No configuration needed (YAGNI principle)

**Alternatives Considered**:
- JSON array parsing (`'["a","b"]'`): Rejected due to complexity, escaping issues, and user friction
- Custom delimiter option: Rejected for v1 (can add later if needed without breaking changes)
- Bracket syntax (`[a,b,c]`): Rejected as non-standard and requires special parsing

### 2. Type Coercion for Array Elements

**Question**: Should array elements undergo type coercion?

**Decision**: Yes, apply existing `coerceValue` logic recursively

**Rationale**:
- Consistency with existing boolean/number coercion behavior
- Users expect `"1,2,3"` → `[1, 2, 3]` not `['1', '2', '3']`
- Allows mixed-type arrays: `"true,123,hello"` → `[true, 123, 'hello']`
- No new coercion rules needed, just recursive application

**Implementation**:
```typescript
// Recursive coercion pattern
elements.map((element) => coerceValue(element) as string | number | boolean)
```

### 3. Edge Cases Handling

**Question**: How should we handle edge cases like empty elements, single commas, etc.?

**Decisions**:

| Edge Case | Behavior | Rationale |
|-----------|----------|-----------|
| `"a,,b"` | `['a', 'b']` | Filter empty strings for cleaner arrays |
| `","` | `''` | No valid elements → return empty string |
| `"a,"` or `",a"` | `['a']` → `'a'` | Single element after filter → treat as scalar |
| `"a"` | `'a'` | No comma → no array parsing |
| `" a , b "` | `['a', 'b']` | Trim whitespace for user convenience |

**Rationale**: Favor clean, predictable output over preserving every detail of malformed input

### 4. Escaped Commas Support

**Question**: Should we support escaped commas in values (e.g., `"a\,b,c"` → `['a,b', 'c']`)?

**Decision**: No, not in initial version

**Rationale**:
- YAGNI principle - no known use case requiring commas in array elements
- Adds parsing complexity and edge cases
- Users can use different env vars if they need values with commas
- Can add later if demand emerges (backward compatible addition)

**Future Consideration**: If users request this, we can add support for:
- Backslash escaping: `"a\,b,c"` → `['a,b', 'c']`
- JSON array syntax: `'["a,b","c"]'` → `['a,b', 'c']`

### 5. TypeScript Type Definitions

**Question**: How should we update TypeScript types to support arrays?

**Decision**: Add `ConfigArray` type and update `ConfigValue` union

**Implementation**:
```typescript
// New type
export type ConfigArray = Array<ConfigPrimitive | ConfigObject>;

// Updated union
export type ConfigValue = ConfigPrimitive | ConfigObject | ConfigArray;
```

**Rationale**:
- Explicit `ConfigArray` type for clarity and reusability
- Recursive definition allows nested objects in arrays (though rare in env vars)
- Maintains full type safety and inference
- No breaking changes to existing types

### 6. Performance Considerations

**Question**: Will array parsing impact performance?

**Decision**: Negligible impact, no optimization needed

**Analysis**:
- Array detection: Single `includes(',')` check - O(n) where n is string length
- Splitting: `split(',')` - O(n)
- Filtering/trimming: O(k) where k is number of elements (typically 2-10)
- Recursive coercion: O(k) with simple type checks per element
- Total: Still O(n) dominated by string operations, same as before

**Benchmark expectations**:
- Typical config with 50 env vars, 5 arrays: <1ms total parsing time
- No caching or memoization needed
- Performance remains "near-instant" as per constraints

### 7. Backward Compatibility

**Question**: Will this change break existing users?

**Decision**: No breaking changes, fully backward compatible

**Analysis**:
- Existing single-value env vars: No commas → no change in behavior
- Type changes: Additive only (`ConfigValue` union expanded)
- API changes: None (coerceValue signature unchanged in public API)
- Version bump: MINOR (0.2.0 → 0.3.0) - new feature, no breaking changes

**Migration**: None needed - users automatically get array support on upgrade

## Design Patterns Applied

### 1. Recursive Type Coercion
- Pattern: Apply same coercion rules to array elements as to scalar values
- Benefit: Consistency, no special cases, reuses existing logic

### 2. Progressive Enhancement
- Pattern: Add feature without changing existing behavior
- Benefit: Zero migration burden, opt-in by using commas

### 3. Fail Gracefully
- Pattern: When array parsing results in single element, return scalar
- Benefit: User intent preservation (single value stays single)

## Testing Strategy

### Unit Tests (utils.test.ts)

Test `coerceValue` function directly:

1. **Array Parsing**
   - `"foo,bar,zed"` → `['foo', 'bar', 'zed']`
   - `"1,2,3"` → `[1, 2, 3]`
   - `"true,false,yes,no"` → `[true, false, true, false]`

2. **Mixed Types**
   - `"1,hello,true"` → `[1, 'hello', true]`
   - `"3.14,test,false"` → `[3.14, 'test', false]`

3. **Edge Cases**
   - `"a,,b"` → `['a', 'b']` (empty element filtered)
   - `" a , b "` → `['a', 'b']` (whitespace trimmed)
   - `"a"` → `'a'` (no comma, stays scalar)
   - `"a,"` → `'a'` (trailing comma, single element)
   - `","` → `''` (only commas, empty string)

4. **Backward Compatibility**
   - All existing tests pass unchanged
   - Single values without commas work exactly as before

### Integration Tests (configEnvy.test.ts)

Test full config parsing with arrays:

1. **Full Config with Arrays**
   ```typescript
   // Env: ALLOWED_HOSTS=localhost,api.com,cdn.com
   // Expected: { allowedHosts: ['localhost', 'api.com', 'cdn.com'] }
   ```

2. **Nested Config with Arrays**
   ```typescript
   // Env: LOG_LEVELS=info,warn,error, LOG_PATH=/var/log
   // Expected: { log: { levels: ['info', 'warn', 'error'], path: '/var/log' } }
   ```

3. **Schema Validation** (if Zod schema provided)
   ```typescript
   // Verify arrays work with Zod array schemas
   // schema: z.object({ ports: z.array(z.number()) })
   ```

## Dependencies Analysis

**Current Dependencies**:
- Runtime: None (zero dependencies)
- Peer: Zod 4.3.4+ (optional)
- Dev: TypeScript, Vitest, oxlint, oxfmt, type-fest

**New Dependencies Needed**: None

**Justification**: Array parsing uses only built-in JavaScript methods:
- `String.prototype.includes()`
- `String.prototype.split()`
- `String.prototype.trim()`
- `Array.prototype.map()`
- `Array.prototype.filter()`

All available in Node.js 20+ without polyfills.

## Documentation Updates

### README.md Additions

Add section after "With Zod Schema" showing array usage:

```typescript
### With Array Values

// Given: ALLOWED_HOSTS=localhost,example.com,api.example.com
const config = config();

// Result: { allowedHosts: ['localhost', 'example.com', 'api.example.com'] }

// Arrays support type coercion:
// PORT_NUMBERS=3000,3001,3002
// Result: { portNumbers: [3000, 3001, 3002] }

// Mixed types work:
// FLAGS=true,false,enabled
// Result: { flags: [true, false, 'enabled'] }
```

### JSDoc Updates

Update `coerceValue` function JSDoc:

```typescript
/**
 * Coerce a string value to the appropriate type
 * Supports comma-separated values which will be parsed as arrays
 * 
 * @example
 * coerceValue('true') // true
 * coerceValue('123') // 123
 * coerceValue('foo,bar') // ['foo', 'bar']
 * coerceValue('1,2,3') // [1, 2, 3]
 */
```

## Success Criteria

- [x] All constitution checks passed
- [x] Design decisions documented with rationale
- [x] Alternative approaches evaluated
- [x] Testing strategy defined
- [x] No new dependencies required
- [x] Backward compatibility confirmed
- [x] Performance impact negligible
- [x] Documentation plan outlined

## Next Steps (Phase 1)

1. Create data-model.md with TypeScript type definitions
2. Create quickstart.md with usage examples
3. Update agent context files with array support info
4. Re-verify constitution check post-design

---
*Research completed - Ready for Phase 1 Design*
