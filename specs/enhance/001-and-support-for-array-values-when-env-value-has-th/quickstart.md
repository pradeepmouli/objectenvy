# Quick Start: Array Value Support

**Feature**: enhance-001  
**Date**: 2026-01-04  
**Target Users**: Developers using envyconfig for environment configuration

## Overview

This guide shows how to use the new array value support feature in envyconfig. Environment variables with comma-separated values are automatically parsed into typed arrays.

## Installation

```bash
npm install envyconfig
# or
pnpm add envyconfig
# or
yarn add envyconfig
```

**Minimum Version**: 0.3.0 (includes array support)

## Basic Usage

### Simple String Arrays

Parse comma-separated strings into arrays:

```typescript
import { config } from 'envyconfig';

// Environment:
// ALLOWED_HOSTS=localhost,example.com,api.example.com

const cfg = config();

console.log(cfg.allowedHosts);
// Output: ['localhost', 'example.com', 'api.example.com']
```

### Number Arrays

Numeric values are automatically coerced:

```typescript
// Environment:
// PORT_NUMBERS=3000,3001,3002

const cfg = config();

console.log(cfg.portNumbers);
// Output: [3000, 3001, 3002]

// Use in your app
cfg.portNumbers.forEach(port => {
  server.listen(port);
});
```

### Boolean Arrays

Boolean values are recognized:

```typescript
// Environment:
// FEATURE_FLAGS=true,false,yes,no

const cfg = config();

console.log(cfg.featureFlags);
// Output: [true, false, true, false]
```

### Mixed Type Arrays

Arrays can contain mixed types:

```typescript
// Environment:
// SETTINGS=true,123,hello,3.14,false

const cfg = config();

console.log(cfg.settings);
// Output: [true, 123, 'hello', 3.14, false]
```

## Advanced Usage

### Arrays in Nested Configuration

Combine array values with nested object structures:

```typescript
// Environment:
// LOG_LEVELS=info,warn,error
// LOG_PATH=/var/log
// LOG_MAX_SIZE=10485760

const cfg = config();

console.log(cfg.log);
// Output:
// {
//   levels: ['info', 'warn', 'error'],
//   path: '/var/log',
//   maxSize: 10485760
// }

// Use in logging setup
cfg.log.levels.forEach(level => {
  logger.addLevel(level);
});
```

### With Prefix Filtering

Filter environment variables by prefix:

```typescript
// Environment:
// APP_HOSTS=localhost,api.com
// APP_PORTS=3000,3001
// OTHER_VAR=ignored

const cfg = config({ prefix: 'APP' });

console.log(cfg);
// Output:
// {
//   hosts: ['localhost', 'api.com'],
//   ports: [3000, 3001]
// }
```

### With Zod Schema Validation

Use Zod schemas for type safety and validation:

```typescript
import { config } from 'envyconfig';
import { z } from 'zod';

// Define schema with array types
const schema = z.object({
  allowedHosts: z.array(z.string()).min(1),
  portNumbers: z.array(z.number()).length(3),
  featureFlags: z.array(z.boolean())
});

// Environment:
// ALLOWED_HOSTS=localhost,example.com,api.example.com
// PORT_NUMBERS=3000,3001,3002
// FEATURE_FLAGS=true,false,true

const cfg = config({ schema });

// Full type inference
cfg.allowedHosts // string[]
cfg.portNumbers  // number[]
cfg.featureFlags // boolean[]

// Validation errors if format doesn't match
// PORT_NUMBERS=3000,3001 (only 2, schema expects 3)
// Throws: "Array must contain exactly 3 element(s)"
```

## Common Patterns

### Multi-Value Configuration

Configure multiple instances or environments:

```typescript
// Environment:
// DATABASE_HOSTS=db1.example.com,db2.example.com,db3.example.com
// DATABASE_PORTS=5432,5432,5432

const cfg = config();

// Connect to all database hosts
cfg.database.hosts.forEach((host, index) => {
  const port = cfg.database.ports[index];
  connectToDatabase(host, port);
});
```

### Feature Flags

Manage multiple feature flags:

```typescript
// Environment:
// ENABLED_FEATURES=auth,api,dashboard,analytics

const cfg = config();

// Check if feature is enabled
function isFeatureEnabled(feature: string): boolean {
  return cfg.enabledFeatures.includes(feature);
}

if (isFeatureEnabled('auth')) {
  initializeAuth();
}

if (isFeatureEnabled('analytics')) {
  initializeAnalytics();
}
```

### Service Discovery

Configure multiple service endpoints:

```typescript
// Environment:
// SERVICE_URLS=http://api1.com,http://api2.com,http://api3.com

const cfg = config();

// Load balance across services
const getServiceUrl = (): string => {
  const index = Math.floor(Math.random() * cfg.serviceUrls.length);
  return cfg.serviceUrls[index]!;
};

fetch(getServiceUrl());
```

### Allowed Origins (CORS)

Configure CORS allowed origins:

```typescript
// Environment:
// CORS_ALLOWED_ORIGINS=http://localhost:3000,https://example.com,https://app.example.com

const cfg = config();

// Express CORS setup
app.use(cors({
  origin: cfg.cors.allowedOrigins
}));
```

## Edge Cases

### Whitespace Handling

Whitespace is automatically trimmed:

```typescript
// Environment:
// ITEMS=apple, banana , cherry ,dragon fruit

const cfg = config();

console.log(cfg.items);
// Output: ['apple', 'banana', 'cherry', 'dragon fruit']
```

### Empty Elements

Empty elements are filtered out:

```typescript
// Environment:
// VALUES=a,,b,,,c

const cfg = config();

console.log(cfg.values);
// Output: ['a', 'b', 'c']
```

### Single Value After Filtering

If only one element remains, it's treated as a scalar:

```typescript
// Environment:
// SINGLE_VALUE=only-one,

const cfg = config();

console.log(cfg.singleValue);
// Output: 'only-one' (not ['only-one'])
```

### Values Without Commas

Values without commas remain unchanged:

```typescript
// Environment:
// NORMAL_STRING=just-a-string

const cfg = config();

console.log(cfg.normalString);
// Output: 'just-a-string' (not ['just-a-string'])
```

## TypeScript Usage

### Type Inference Without Schema

```typescript
import type { ConfigObject } from 'envyconfig';

const cfg: ConfigObject = config();

// Type is ConfigValue (union of possible types)
// Runtime type checking needed
if (Array.isArray(cfg.allowedHosts)) {
  cfg.allowedHosts.forEach(host => {
    console.log(host); // string | number | boolean
  });
}
```

### Type Safety With Schema

```typescript
import { config } from 'envyconfig';
import { z } from 'zod';

const schema = z.object({
  allowedHosts: z.array(z.string()),
  portNumbers: z.array(z.number())
});

const cfg = config({ schema });

// Full type inference, no runtime checks needed
cfg.allowedHosts.forEach(host => {
  console.log(host.toUpperCase()); // TypeScript knows host is string
});

cfg.portNumbers.forEach(port => {
  console.log(port * 2); // TypeScript knows port is number
});
```

### Custom Type Definitions

```typescript
import { config } from 'envyconfig';

interface MyConfig {
  allowedHosts: string[];
  portNumbers: number[];
  featureFlags: boolean[];
}

const cfg = config() as unknown as MyConfig;

// Now typed as MyConfig
cfg.allowedHosts // string[]
cfg.portNumbers // number[]
cfg.featureFlags // boolean[]
```

## Troubleshooting

### Arrays Not Parsing

**Problem**: Value contains comma but isn't parsed as array

**Causes**:
1. Only whitespace between commas
2. Coercion disabled with `coerce: false` option

**Solution**:
```typescript
// Ensure coerce is enabled (default)
const cfg = config({ coerce: true });

// Check actual env var value
console.log(process.env.MY_VAR);
```

### Unexpected Single Value

**Problem**: Expected array but got single value

**Cause**: Only one element after filtering empty strings

**Example**:
```typescript
// Environment:
// MY_VAR=value,

// Only one element after filtering empty string
const cfg = config();
console.log(cfg.myVar); // 'value' not ['value']
```

**Solution**: Ensure multiple non-empty values
```bash
export MY_VAR=value1,value2
```

### Type Coercion Issues

**Problem**: Array elements have unexpected types

**Cause**: Automatic type coercion converting values

**Example**:
```typescript
// Environment:
// VALUES=true,123,hello

const cfg = config();
console.log(cfg.values);
// Output: [true, 123, 'hello'] (mixed types!)
```

**Solution**: 
- Use Zod schema for strict typing
- Or accept mixed types and handle at runtime

```typescript
// With schema
const schema = z.object({
  values: z.array(z.string())
});

// Coercion still happens first, then validation
// If you need strict strings, validate externally
```

### Commas in Values

**Problem**: Need to include comma in array element

**Current Limitation**: Commas cannot be escaped in this version

**Workaround**:
1. Use separate env vars for values with commas
2. Use JSON array syntax (not currently supported, future enhancement)
3. Use different delimiter (not configurable yet, future enhancement)

```typescript
// Workaround: separate variables
// ITEM_1=value,with,commas
// ITEM_2=another,value

const cfg = config();
const items = [cfg.item1, cfg.item2];
```

## Migration from Manual Parsing

### Before (Manual Splitting)

```typescript
const cfg = config();

// Manual parsing
const hosts = cfg.allowedHosts?.split(',') || [];
const ports = cfg.portNumbers?.split(',').map(Number) || [];
```

### After (Automatic)

```typescript
const cfg = config();

// Automatic parsing with type coercion
const hosts = cfg.allowedHosts; // Already ['host1', 'host2', 'host3']
const ports = cfg.portNumbers;  // Already [3000, 3001, 3002]
```

### Migration Checklist

- [ ] Identify all manual `.split(',')` operations on config values
- [ ] Remove manual splitting code
- [ ] Update type definitions to expect arrays
- [ ] Add Zod schema if strict validation needed
- [ ] Test edge cases (empty elements, whitespace)
- [ ] Update documentation for your project

## Performance Notes

Array parsing is fast and adds negligible overhead:
- Comma detection: O(n) where n is string length
- Splitting and filtering: O(k) where k is number of elements
- Type coercion: O(k) with simple checks per element

Typical performance:
- 50 env vars with 5 arrays: <1ms total parsing
- No memoization needed for static configs
- Arrays cached after first parse

## Best Practices

### 1. Use Zod Schemas for Production

```typescript
// ✅ Good: Type-safe with validation
const schema = z.object({
  hosts: z.array(z.string().url())
});
const cfg = config({ schema });

// ❌ Avoid: No validation
const cfg = config();
```

### 2. Validate Array Lengths

```typescript
// ✅ Good: Ensure expected count
const schema = z.object({
  servers: z.array(z.string()).min(1).max(10)
});

// ❌ Avoid: Assuming array length
const cfg = config();
const primaryServer = cfg.servers[0]; // Could be undefined!
```

### 3. Document Expected Format

```bash
# ✅ Good: Document in .env.example
# Comma-separated list of allowed hosts
ALLOWED_HOSTS=localhost,example.com,api.example.com

# ❌ Avoid: No documentation
ALLOWED_HOSTS=localhost,example.com,api.example.com
```

### 4. Handle Mixed Types Carefully

```typescript
// ✅ Good: Schema enforces consistent types
const schema = z.object({
  ports: z.array(z.number())
});

// ⚠️ Caution: Mixed types without schema
const cfg = config();
cfg.settings.forEach(value => {
  // Need to check type at runtime
  if (typeof value === 'number') {
    // ...
  }
});
```

## Next Steps

- Read the full [API Reference](../../api-reference.md)
- Explore [Type Utilities](../../api-reference.md#type-utilities)
- Check [Examples](../../examples.md) for more patterns
- Review [Implementation Guide](../../implementation-guide.md) for internals

---
*Quick start complete - Ready for implementation*
