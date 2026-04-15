# Config Merging & Array Support Investigation

**Date**: January 10, 2026
**Scope**: Investigating config merging capabilities for arrays and nested arrays

## Summary

**YES, your config merging DOES support arrays**, but with an important caveat: **arrays are replaced, not merged recursively**. Additionally, **nested arrays are currently NOT directly supported** through environment variable parsing, but the infrastructure is in place to add this feature.

---

## 1. Current Array Support Status

### ✅ Flat Array Support
**Status**: FULLY IMPLEMENTED

Arrays are supported at the flat level through comma-separated environment variables:

```typescript
// Environment variable
ALLOWED_HOSTS="localhost,example.com,api.example.com"

// Parsed as:
{ allowedHosts: ['localhost', 'example.com', 'api.example.com'] }
```

**Features**:
- ✅ Comma-separated value parsing
- ✅ Type coercion for array elements (numbers, booleans, strings)
- ✅ Whitespace trimming
- ✅ Empty element filtering
- ✅ Mixed type arrays: `"1,hello,true,3.14"` → `[1, 'hello', true, 3.14]`

**Implementation Location**:
- [src/utils.ts](src/utils.ts) - `coerceValue()` function (lines 58-91)
- Uses simple comma-split logic for array detection

---

### ✅ Nested Structure with Arrays
**Status**: FULLY IMPLEMENTED

Arrays work correctly within nested config structures:

```typescript
// Environment variables
LOG_LEVELS="debug,info,warn"
LOG_PATH="/var/log"
SERVER_HOSTS="host1,host2"
SERVER_PORT="3000"

// Parsed as:
{
  log: {
    levels: ['debug', 'info', 'warn'],
    path: '/var/log'
  },
  server: {
    hosts: ['host1', 'host2'],
    port: 3000
  }
}
```

**Test Coverage**: [objectEnvy.test.ts](src/objectEnvy.test.ts) - "works with nested configs and arrays" (line 773)

---

### ❌ Nested Arrays (Multi-Dimensional Arrays)
**Status**: NOT IMPLEMENTED / NOT TESTED

There is **NO direct support for nested arrays** (arrays of arrays or objects in arrays). Attempting to represent:

```typescript
{
  services: [
    { name: 'api', port: 3000 },
    { name: 'web', port: 8080 }
  ]
}
```

...through environment variables is **not currently supported by the parsing logic**.

---

## 2. Config Merging Behavior

### Current Merge Implementation

The `merge()` function is located in [objectEnvy.ts](src/objectEnvy.ts) (lines 555-576):

```typescript
export function merge<T extends ConfigObject, U extends ConfigObject>(obj1: T, obj2: U): T & U {
  const result: any = { ...obj1 };
  for (const [key, value] of Object.entries(obj2)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&  // ← KEY: Arrays are explicitly excluded
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      // Recursively merge nested objects (but NOT arrays)
      result[key] = merge(result[key] as ConfigObject, value as ConfigObject);
    } else {
      // For all other cases (including arrays), use simple override
      result[key] = value;
    }
  }
  return result;
}
```

### ✅ Behavior with Flat Arrays

**Array Override (Not Merge)**:
```typescript
const obj1 = { tags: ['a', 'b'] };
const obj2 = { tags: ['c', 'd'] };
const result = merge(obj1, obj2);
// Result: { tags: ['c', 'd'] } ← Second array REPLACES first
```

**Test Coverage**: [objectEnvy.test.ts](src/objectEnvy.test.ts) - "does not merge arrays recursively" (line 712)

### ✅ Behavior with Nested Objects Containing Arrays

**Nested Objects ARE merged, but arrays within them are overridden**:
```typescript
const obj1 = {
  server: {
    port: 3000,
    hosts: ['localhost']
  }
};

const obj2 = {
  server: {
    hosts: ['example.com']
  }
};

const result = merge(obj1, obj2);
// Result: {
//   server: {
//     port: 3000,
//     hosts: ['example.com']  // ← Array overridden, not merged
//   }
// }
```

**Test Coverage**: [objectEnvy.test.ts](src/objectEnvy.test.ts) - "handles deeply nested merging" (lines 699-709)

---

## 3. Config Merging with Arrays - Detailed Behavior

### Scenario 1: Simple Array Override
```typescript
merge(
  { roles: ['admin', 'user'] },
  { roles: ['guest'] }
);
// → { roles: ['guest'] }  ✅ WORKS
```

### Scenario 2: Mix Flat and Nested with Arrays
```typescript
merge(
  { port: 3000, db: { hosts: ['localhost'] } },
  { debug: true, db: { pool: 10 } }
);
// → { port: 3000, debug: true, db: { hosts: ['localhost'], pool: 10 } }  ✅ WORKS
// Note: 'db' object is merged, 'hosts' array is kept from obj1
```

### Scenario 3: Array in Nested Object Gets Overridden
```typescript
merge(
  { config: { tags: ['prod', 'v1'] } },
  { config: { tags: ['dev'] } }
);
// → { config: { tags: ['dev'] } }  ✅ WORKS (arrays replaced)
```

### Scenario 4: Nested Arrays (Not Directly Supported)
```typescript
// This is NOT supported by env parsing, but merge would handle it:
merge(
  { items: [{ id: 1 }, { id: 2 }] },
  { items: [{ id: 3 }] }
);
// → { items: [{ id: 3 }] }  ✅ WORKS (overrides)
// However: You cannot easily create this structure from environment variables
```

---

## 4. Environment Variable Parsing Limitations

### What CAN Be Represented

✅ **Flat arrays from comma-separated values**:
```
HOSTS=host1,host2,host3
→ { hosts: ['host1', 'host2', 'host3'] }
```

✅ **Nested structures with flat arrays**:
```
SERVER_HOSTS=host1,host2
SERVER_PORT=3000
→ { server: { hosts: ['host1', 'host2'], port: 3000 } }
```

### What CANNOT Be Represented

❌ **Nested arrays (array of objects)**:
```
Cannot represent: [{ name: 'api', port: 3000 }, { name: 'web', port: 8080 }]
```

❌ **Array of arrays**:
```
Cannot represent: [['a', 'b'], ['c', 'd']]
```

❌ **Object arrays with typed values**:
```
Cannot represent: [{ id: 1, active: true }, { id: 2, active: false }]
```

### Why Nested Arrays Aren't Supported

The current parsing strategy in [objectEnvy.ts](src/objectEnvy.ts):
1. Parses environment keys into segments: `KEY_PART_1_PART_2` → `['key', 'part', '1', 'part', '2']`
2. Creates nested object structure based on segments
3. Treats array values as **leaf nodes** (endpoints), not containers

Example: `ITEMS_0_NAME=api` would create:
```typescript
{
  items: {
    '0': {
      name: 'api'
    }
  }
}
// NOT: [{ name: 'api' }]
```

---

## 5. Test Coverage Analysis

### ✅ Tests That PASS (Array Support)

| Test | Location | Status |
|------|----------|--------|
| parses comma-separated values as arrays | [objectEnvy.test.ts:719](src/objectEnvy.test.ts#L719) | ✅ PASS |
| coerces array elements to appropriate types | [objectEnvy.test.ts:726](src/objectEnvy.test.ts#L726) | ✅ PASS |
| handles mixed type arrays | [objectEnvy.test.ts:737](src/objectEnvy.test.ts#L737) | ✅ PASS |
| works with nested configs and arrays | [objectEnvy.test.ts:773](src/objectEnvy.test.ts#L773) | ✅ PASS |
| works with prefix filtering and arrays | [objectEnvy.test.ts:793](src/objectEnvy.test.ts#L793) | ✅ PASS |
| validates arrays with Zod schema | [objectEnvy.test.ts:810](src/objectEnvy.test.ts#L810) | ✅ PASS |
| does not parse arrays when coerce is disabled | [objectEnvy.test.ts:826](src/objectEnvy.test.ts#L826) | ✅ PASS |
| trims whitespace from array elements | [objectEnvy.test.ts:835](src/objectEnvy.test.ts#L835) | ✅ PASS |
| filters empty array elements | [objectEnvy.test.ts:842](src/objectEnvy.test.ts#L842) | ✅ PASS |
| preserves single values without commas | [objectEnvy.test.ts:849](src/objectEnvy.test.ts#L849) | ✅ PASS |
| converts arrays to comma-separated strings (envy) | [objectEnvy.test.ts:905](src/objectEnvy.test.ts#L905) | ✅ PASS |
| handles mixed nested and array values (envy) | [objectEnvy.test.ts:914](src/objectEnvy.test.ts#L914) | ✅ PASS |
| does not merge arrays recursively (merge) | [objectEnvy.test.ts:712](src/objectEnvy.test.ts#L712) | ✅ PASS |

### ❌ Tests That DON'T EXIST (Gaps)

1. **Nested array merging**:
   ```typescript
   // MISSING: merge({ nested: { arr: [1, 2] } }, { nested: { arr: [3] } })
   ```

2. **Deep merge with array override tracking**:
   ```typescript
   // MISSING: Test showing array replacement in deeply nested structures
   ```

3. **Merge with `apply()` function and arrays**:
   ```typescript
   // MISSING: apply({ items: [1, 2] }, { items: [3] })
   ```

4. **Zod validation of merged arrays**:
   ```typescript
   // MISSING: merge() followed by schema.parse() validation
   ```

---

## 6. Code Review Summary

### Key Files for Array Handling

| File | Function | Array Support | Notes |
|------|----------|---|---|
| [utils.ts](src/utils.ts) | `coerceValue()` | ✅ Full | Handles comma-separated → arrays |
| [objectEnvy.ts](src/objectEnvy.ts) | `merge()` | ⚠️ Partial | Arrays replaced, not merged |
| [objectEnvy.ts](src/objectEnvy.ts) | `envy()` | ✅ Full | Converts arrays → comma-separated |
| [objectEnvy.ts](src/objectEnvy.ts) | `apply()` | ⚠️ Partial | Has array check but limited docs |
| [types.ts](src/types.ts) | `ConfigValue` | ✅ Full | Type includes `ConfigValue[]` |

### Implementation Quality: ✅ Good

- **Type Safety**: Arrays properly typed as `ConfigValue[]`
- **Backward Compatibility**: No breaking changes
- **Test Coverage**: ~11 direct array tests
- **Documentation**: JSDoc present but sparse on array behavior

---

## 7. Recommendations

### For Current Usage

✅ **Safe to use for**:
- Comma-separated flat arrays: `HOSTS=a,b,c`
- Nested configs with flat arrays
- Merging configs with array override semantics
- Zod schema validation with arrays

⚠️ **Be aware**:
- Arrays override rather than merge
- Nested arrays (objects in arrays) not supported via env parsing
- Reversibility with `envy()` works for flat arrays only

### For Future Enhancement

1. **Nested Array Support** (Medium Effort)
   - Add optional JSON parsing for complex values
   - Example: `SERVICES='[{"name":"api","port":3000}]'`
   - Requires: New coerceValue logic, tests, docs

2. **Smart Array Merging** (High Effort)
   - Add `mergeArrays` option: `'replace' | 'concat' | 'deep'`
   - Example: `merge(obj1, obj2, { mergeArrays: 'concat' })`
   - Requires: Breaking change or new function, comprehensive tests

3. **Enhanced Documentation** (Low Effort)
   - Document array merging behavior (currently implicit)
   - Add examples showing array override semantics
   - Document limitations with nested arrays

---

## 8. Conclusion

**Direct Answer**: Your config merging **partially supports arrays**:
- ✅ Simple arrays work (flat level)
- ✅ Arrays in nested objects work (at any depth)
- ❌ Nested arrays (array of objects) not supported via env parsing
- ⚠️ Arrays are **replaced, not merged** during merge operations

This is **intentional design** - arrays are treated as atomic values rather than being recursively merged, which is a common pattern in configuration systems.

---

## Test Execution

To verify current array support:

```bash
# Run array-specific tests
pnpm test -- --grep "array"

# Run merge tests
pnpm test -- --grep "merge"

# Full test suite
pnpm test
```

---

## Related Specification

See [enhancement.md](specs/enhance/001-and-support-for-array-values-when-env-value-has-th/enhancement.md) for implementation details of comma-separated array parsing.
