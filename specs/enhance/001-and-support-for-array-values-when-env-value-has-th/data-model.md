# Data Model: Array Value Support

**Feature**: enhance-001  
**Date**: 2026-01-04  
**Phase**: 1 - Design

## Overview

This document defines the TypeScript type definitions and data structures for array value support in environment variable parsing.

## Type Definitions

### Core Types

#### ConfigPrimitive (Existing - No Changes)

```typescript
export type ConfigPrimitive = string | number | boolean;
```

**Description**: Represents scalar values that can appear in configuration.

**No changes required**: This type remains unchanged as array elements can still be primitives.

#### ConfigObject (Existing - No Changes)

```typescript
export type ConfigObject = {
  [key: string]: ConfigValue;
};
```

**Description**: Represents nested configuration objects.

**No changes required**: Objects can contain values which may now include arrays.

#### ConfigArray (NEW)

```typescript
export type ConfigArray = Array<ConfigPrimitive | ConfigObject>;
```

**Description**: Represents arrays of configuration values parsed from comma-separated environment variables.

**Properties**:
- Contains primitives (string, number, boolean) or nested objects
- Recursively defined to support complex nested structures
- Elements undergo same type coercion as scalar values

**Examples**:
```typescript
// Simple array of strings
const hosts: ConfigArray = ['localhost', 'api.com', 'cdn.com'];

// Array of numbers
const ports: ConfigArray = [3000, 3001, 3002];

// Mixed type array
const mixed: ConfigArray = [true, 123, 'hello'];

// Array with nested object (rare but supported)
const complex: ConfigArray = [
  { name: 'server1', port: 3000 },
  { name: 'server2', port: 3001 }
];
```

#### ConfigValue (UPDATED)

```typescript
export type ConfigValue = ConfigPrimitive | ConfigObject | ConfigArray;
```

**Changes**:
- **Before**: `ConfigPrimitive | ConfigObject`
- **After**: `ConfigPrimitive | ConfigObject | ConfigArray`
- **Impact**: Additive only, no breaking changes

**Description**: Union type representing any configuration value.

**Usage**: Used throughout the codebase as the return type for configuration values.

### Function Signatures

#### coerceValue (UPDATED)

```typescript
export function coerceValue(value: string): 
  string | number | boolean | Array<string | number | boolean>;
```

**Changes**:
- **Before**: `string | number | boolean`
- **After**: `string | number | boolean | Array<string | number | boolean>`
- **Impact**: Additive only, backward compatible

**Description**: Coerces a string value to appropriate type, including array parsing.

**Parameters**:
- `value: string` - Environment variable value to coerce

**Returns**:
- `string` - If value is a plain string without commas
- `number` - If value is numeric
- `boolean` - If value is boolean-like (true/false/yes/no)
- `Array<string | number | boolean>` - If value contains commas

**Algorithm**:
1. Check if value contains comma
2. If yes:
   a. Split on comma
   b. Trim whitespace from each element
   c. Filter out empty elements
   d. If multiple elements remain: recursively coerce each and return array
   e. If single element remains: recursively coerce and return scalar
   f. If no elements remain: return empty string
3. If no comma:
   a. Check for boolean patterns
   b. Check for numeric patterns
   c. Otherwise return as string

**Examples**:
```typescript
coerceValue('hello')           // 'hello'
coerceValue('123')             // 123
coerceValue('true')            // true
coerceValue('foo,bar,zed')     // ['foo', 'bar', 'zed']
coerceValue('1,2,3')           // [1, 2, 3]
coerceValue('true,false')      // [true, false]
coerceValue('1,hello,true')    // [1, 'hello', true]
coerceValue('a,,b')            // ['a', 'b']
coerceValue(' a , b ')         // ['a', 'b']
coerceValue('a')               // 'a'
coerceValue('a,')              // 'a'
coerceValue(',')               // ''
```

## Data Flow

### Parse Flow

```
Environment Variable
        ↓
    "foo,bar,zed"
        ↓
  coerceValue()
        ↓
   Check for comma? ──No──→ Coerce as scalar → string|number|boolean
        ↓ Yes
    Split on comma
        ↓
  ["foo", "bar", "zed"]
        ↓
   Trim & Filter
        ↓
  ["foo", "bar", "zed"]
        ↓
  Multiple elements? ──Yes──→ Coerce each → ['foo', 'bar', 'zed']
        ↓ No (1 element)
    Coerce as scalar → single value
```

### Type Coercion Flow (Per Element)

```
Element Value
     ↓
Check boolean?
  true/yes/y → true
  false/no/n → false
     ↓
Check integer?
  /^-?\d+$/ → parseInt()
     ↓
Check float?
  /^-?\d+\.\d+$/ → parseFloat()
     ↓
Default to string
```

## State Transitions

### Value States

A parsed environment variable value can be in one of these states:

1. **Scalar Primitive** (string, number, boolean)
   - Transition: Direct coercion from string
   - Example: `"123"` → `123`

2. **Array of Primitives**
   - Transition: Comma detected → split → coerce each
   - Example: `"1,2,3"` → `[1, 2, 3]`

3. **Nested Object** (existing feature)
   - Transition: Multiple env vars with same prefix → nest
   - Example: `LOG_LEVEL` + `LOG_PATH` → `{ log: { level, path } }`

4. **Array in Nested Object**
   - Transition: Nested key with comma-separated value
   - Example: `LOG_LEVELS=info,warn,error` → `{ log: { levels: ['info', 'warn', 'error'] } }`

### No State Transitions

These are not state machines - values are immutably parsed once during config initialization. No runtime state changes occur.

## Validation Rules

### From Feature Spec

1. **Comma Detection**
   - Rule: If value contains one or more commas, attempt array parsing
   - Validation: Check `value.includes(',')`

2. **Empty Element Filtering**
   - Rule: Filter out empty strings from split results
   - Validation: `.filter((el) => el.length > 0)`

3. **Whitespace Trimming**
   - Rule: Trim leading/trailing whitespace from each element
   - Validation: `.map((el) => el.trim())`

4. **Single Element Fallback**
   - Rule: If only one element after filtering, treat as scalar
   - Validation: `if (elements.length === 1) return coerceValue(elements[0])`

5. **Type Coercion Per Element**
   - Rule: Apply same coercion rules to array elements
   - Validation: `elements.map((el) => coerceValue(el))`

### Type Safety Rules

1. **No `any` Types**
   - All types explicitly defined
   - Union types used for multiple possible types

2. **Recursive Coercion Type Safety**
   - TypeScript assertion: `as string | number | boolean`
   - Safe because coerceValue base case guarantees primitive types

3. **Array Type Guards**
   - Runtime check: `value.includes(',')`
   - TypeScript knows return type when array path taken

## Relationships

### Type Hierarchy

```
ConfigValue (union)
├── ConfigPrimitive (union)
│   ├── string
│   ├── number
│   └── boolean
├── ConfigObject
│   └── [key: string]: ConfigValue (recursive)
└── ConfigArray (NEW)
    └── Array<ConfigPrimitive | ConfigObject> (recursive)
```

### Function Dependencies

```
coerceValue(value: string)
├── Depends on: String methods (includes, split, trim)
├── Depends on: Array methods (map, filter)
├── Recursively calls: self for array elements
└── Used by: configEnvy parser for all env var values
```

### File Dependencies

```
types.ts (Type Definitions)
    ↓ imported by
utils.ts (coerceValue implementation)
    ↓ imported by
configEnvy.ts (Main config parser)
    ↓ exported from
index.ts (Public API)
```

## Examples

### Example 1: Simple String Array

**Input**: `ALLOWED_HOSTS=localhost,example.com,api.example.com`

**Parsing**:
1. Detect comma: Yes
2. Split: `['localhost', 'example.com', 'api.example.com']`
3. Trim & Filter: `['localhost', 'example.com', 'api.example.com']` (no changes)
4. Coerce each: All remain strings
5. Result: `['localhost', 'example.com', 'api.example.com']`

**Type**: `ConfigArray` of `string[]`

### Example 2: Number Array

**Input**: `PORT_NUMBERS=3000,3001,3002`

**Parsing**:
1. Detect comma: Yes
2. Split: `['3000', '3001', '3002']`
3. Trim & Filter: Same
4. Coerce each: `[3000, 3001, 3002]` (integers)
5. Result: `[3000, 3001, 3002]`

**Type**: `ConfigArray` of `number[]`

### Example 3: Mixed Type Array

**Input**: `MIXED=true,123,hello,3.14,false`

**Parsing**:
1. Detect comma: Yes
2. Split: `['true', '123', 'hello', '3.14', 'false']`
3. Trim & Filter: Same
4. Coerce each:
   - `'true'` → `true` (boolean)
   - `'123'` → `123` (integer)
   - `'hello'` → `'hello'` (string)
   - `'3.14'` → `3.14` (float)
   - `'false'` → `false` (boolean)
5. Result: `[true, 123, 'hello', 3.14, false]`

**Type**: `ConfigArray` of `Array<string | number | boolean>`

### Example 4: Edge Case - Empty Elements

**Input**: `VALUES=a,,b,  ,c`

**Parsing**:
1. Detect comma: Yes
2. Split: `['a', '', 'b', '  ', 'c']`
3. Trim & Filter: `['a', 'b', 'c']` (empty and whitespace-only removed)
4. Coerce each: All remain strings
5. Result: `['a', 'b', 'c']`

**Type**: `ConfigArray` of `string[]`

### Example 5: Edge Case - Single Element After Filter

**Input**: `SINGLE=value,`

**Parsing**:
1. Detect comma: Yes
2. Split: `['value', '']`
3. Trim & Filter: `['value']` (empty element removed)
4. Single element check: Yes → treat as scalar
5. Coerce: `'value'` (string)
6. Result: `'value'`

**Type**: `string` (not array!)

### Example 6: Nested Config with Array

**Input**:
- `LOG_LEVELS=info,warn,error`
- `LOG_PATH=/var/log`

**Parsing**:
1. Parse `LOG_LEVELS`:
   - Path: `['log', 'levels']`
   - Value: Comma detected → `['info', 'warn', 'error']`
2. Parse `LOG_PATH`:
   - Path: `['log', 'path']`
   - Value: No comma → `'/var/log'`
3. Merge into nested object

**Result**:
```typescript
{
  log: {
    levels: ['info', 'warn', 'error'],
    path: '/var/log'
  }
}
```

**Type**: `ConfigObject` containing `ConfigArray` and `string`

## Type Safety Guarantees

### Compile-Time Safety

1. **Function Signature Accuracy**
   - `coerceValue` return type explicitly lists all possible return types
   - TypeScript enforces correct handling of all cases

2. **Type Union Exhaustiveness**
   - `ConfigValue` union covers all possible value types
   - Adding array doesn't break existing code due to union expansion

3. **No Type Assertions Needed**
   - Internal implementation uses minimal type assertions
   - Only `as string | number | boolean` when we know array elements are primitives

### Runtime Safety

1. **No Type Coercion Errors**
   - All coercion guarded by type checks (`typeof`, regex patterns)
   - Safe integer/float checks prevent overflow

2. **No Null/Undefined Issues**
   - All array operations preceded by existence checks
   - Empty array case handled explicitly

3. **Backward Compatibility**
   - Existing code without commas behaves identically
   - Type widening doesn't break narrower consumer types

## Schema Integration

### With Zod (Optional)

When users provide a Zod schema, array values still work:

```typescript
import { z } from 'zod';

// Schema expects array
const schema = z.object({
  allowedHosts: z.array(z.string()),
  portNumbers: z.array(z.number())
});

// Env vars
// ALLOWED_HOSTS=localhost,api.com
// PORT_NUMBERS=3000,3001,3002

const config = configEnvy({ schema });

// Type inference works
config.allowedHosts // string[]
config.portNumbers // number[]

// Validation succeeds because coerceValue returns arrays
```

### Without Zod

Arrays work without schema:

```typescript
const config = configEnvy();

// Type is ConfigObject with ConfigValue values
config.allowedHosts // ConfigValue (could be string | string[])

// Runtime check needed for type narrowing
if (Array.isArray(config.allowedHosts)) {
  config.allowedHosts.forEach(host => console.log(host));
}
```

## Migration Notes

**Breaking Changes**: None

**Additive Changes**:
- `ConfigArray` type added
- `ConfigValue` union expanded
- `coerceValue` return type expanded

**Consumer Impact**: Zero - all changes are backward compatible

---
*Data model complete - Ready for quickstart.md*
