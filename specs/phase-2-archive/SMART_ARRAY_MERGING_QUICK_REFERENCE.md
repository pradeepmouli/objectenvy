# Smart Array Merging - Quick Reference

## Three Merge Strategies

### 1. `'replace'` (Default)
**What it does**: Second array replaces the first
**Use case**: When you want to completely override array values

```typescript
merge({ tags: ['a', 'b'] }, { tags: ['c'] })
// → { tags: ['c'] }
```

### 2. `'concat'`
**What it does**: Concatenate arrays, keep all elements including duplicates
**Use case**: Building a complete list by combining configurations

```typescript
merge({ hosts: ['h1', 'h2'] }, { hosts: ['h3'] }, { arrayMergeStrategy: 'concat' })
// → { hosts: ['h1', 'h2', 'h3'] }
```

### 3. `'concat-unique'`
**What it does**: Concatenate and remove duplicate values
**Use case**: Merging configurations while avoiding duplicates

```typescript
merge(
  { origins: ['localhost', 'example.com'] },
  { origins: ['example.com', 'api.example.com'] },
  { arrayMergeStrategy: 'concat-unique' }
)
// → { origins: ['localhost', 'example.com', 'api.example.com'] }
```

---

## Usage Examples

### With `merge()` function
```typescript
import { merge } from 'objectenvy';

const config1 = { port: 3000, tags: ['prod'] };
const config2 = { debug: true, tags: ['v1'] };

// Default (replace)
merge(config1, config2);
// → { port: 3000, debug: true, tags: ['v1'] }

// Concatenate
merge(config1, config2, { arrayMergeStrategy: 'concat' });
// → { port: 3000, debug: true, tags: ['prod', 'v1'] }

// Deduplicate
merge(config1, config2, { arrayMergeStrategy: 'concat-unique' });
// → { port: 3000, debug: true, tags: ['prod', 'v1'] }
```

### With `apply()` function
```typescript
import { apply } from 'objectenvy';

const config = { tags: ['custom'] };
const defaults = { port: 3000, tags: ['default'] };

// Concatenate arrays when applying defaults
apply(config, defaults, { arrayMergeStrategy: 'concat' });
// → { port: 3000, tags: ['custom', 'default'] }
```

### With Nested Structures
```typescript
merge(
  { db: { hosts: ['host1'], pool: 5 }, cache: { hosts: ['cache1'] } },
  { db: { hosts: ['host2'], timeout: 30 } },
  { arrayMergeStrategy: 'concat' }
);
// → {
//     db: { hosts: ['host1', 'host2'], pool: 5, timeout: 30 },
//     cache: { hosts: ['cache1'] }
//   }
```

---

## Deduplication Rules

### Primitives
Uses JavaScript `Set` for fast comparison:
```typescript
// Strings, numbers, booleans compared by value
['a', 'b', 'a'] → ['a', 'b']  // 'a' is duplicate
[1, 2, 1] → [1, 2]            // 1 is duplicate
```

### Objects
Uses JSON serialization for comparison:
```typescript
[{ id: 1 }, { id: 2 }, { id: 1 }] → [{ id: 1 }, { id: 2 }]
// Objects with same JSON representation are deduplicated
```

### Mixed Types
Each type is deduplicated independently:
```typescript
[1, 'a', true, 'a', 1] → [1, 'a', true]
// Both '1' and 'a' duplicates removed, but type diversity maintained
```

---

## Backward Compatibility

✅ Default behavior unchanged
✅ No breaking changes
✅ Existing code works without modifications

```typescript
// Old code still works exactly the same
merge(config1, config2);  // Default 'replace' strategy
```

---

## When to Use Each Strategy

| Strategy | When to Use | Example |
|----------|-----------|---------|
| `'replace'` | Override with new values | Updating environment variables |
| `'concat'` | Combining feature lists | Merging enabled features from multiple configs |
| `'concat-unique'` | Merging without duplicates | Combining allowed hosts or CORS origins |

---

## See Also

- [Smart Array Merging Implementation](SMART_ARRAY_MERGING.md) - Detailed documentation
- [Array Support Investigation](ARRAY_SUPPORT_INVESTIGATION.md) - Background on array support
