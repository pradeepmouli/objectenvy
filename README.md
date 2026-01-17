# objectenvy

Automatically map `process.env` entries to strongly-typed config objects with camelCase fields and nested structures.

## Features

- **Schema-Guided Nesting**: When a Zod schema is provided, the structure follows the schema exactly
  - `PORT_NUMBER` → `{ portNumber }` or `{ port: { number } }` depending on your schema
- **Smart Nesting** (without schema): Automatically nests when multiple entries share a prefix
  - `PORT_NUMBER=1234` → `{ portNumber: 1234 }` (single entry stays flat)
  - `LOG_LEVEL` + `LOG_PATH` → `{ log: { level: ..., path: ... } }` (multiple entries get nested)
  - Non-nesting prefixes: Keys starting with `max`, `min`, `is`, `enable`, `disable` remain flat even when multiple entries share the prefix
    - `MAX_CONNECTIONS`, `MAX_TIMEOUT` → `{ maxConnections, maxTimeout }` (no `max: { ... }` nesting)
- **Type Coercion**: Automatically converts strings to numbers and booleans
- **Prefix Filtering**: Only load variables with a specific prefix (e.g., `APP_`)
- **Zod Validation**: Optional schema validation with full TypeScript type inference
- **Type Utilities**: `ToEnv<T>`, `FromEnv<T>`, `WithPrefix<T>` for type-level transformations
- **Zero Dependencies Runtime**: Uses Zod only when you opt-in to schema validation

## Installation

```bash
npm install objectenvy
# or
pnpm add objectenvy
# or
yarn add objectenvy
```

## Quick Start

```typescript
import { config } from 'envyconfig';

// Given these environment variables:
// PORT_NUMBER=3000          <- single PORT_* entry, stays flat
// LOG_LEVEL=debug           <- multiple LOG_* entries, gets nested
// LOG_PATH=/var/log
// DATABASE_HOST=localhost   <- multiple DATABASE_* entries, gets nested
// DATABASE_PORT=5432

const result = objectify({ env: process.env });

// Result:
// {
//   portNumber: 3000,        // flat (only one PORT_* entry)
//   log: {                   // nested (multiple LOG_* entries)
//     level: 'debug',
//     path: '/var/log'
//   },
//   database: {              // nested (multiple DATABASE_* entries)
//     host: 'localhost',
//     port: 5432
//   }
// }
```

## Usage

### Basic Usage

```typescript
import { objectify } from 'objectenvy';

// Load all environment variables
const result = objectify({ env: process.env });
```

### With Prefix Filtering

```typescript
// Given: APP_PORT=3000, APP_DEBUG=true, OTHER_VAR=ignored
const result = objectify({ env: process.env, prefix: 'APP' });

// Result: { port: 3000, debug: true }
```

### With Zod Schema (Schema-Guided Nesting)

When you provide a schema, objectenvy uses the schema structure to determine nesting. This gives you full control over the output shape:

```typescript
import { buildConfigWithSchema } from 'objectenvy';
import { z } from 'zod';

// The schema defines exactly how env vars map to your config
const schema = z.object({
  portNumber: z.number(),                  // PORT_NUMBER -> portNumber (flat)
  log: z.object({                          // LOG_LEVEL -> log.level (nested)
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()                       // LOG_PATH -> log.path
  }),
  database: z.object({
    host: z.string(),                      // DATABASE_HOST -> database.host
    port: z.number(),                      // DATABASE_PORT -> database.port
    ssl: z.boolean().default(false)
  })
});

// Given: PORT_NUMBER=3000, LOG_LEVEL=debug, LOG_PATH=/var/log, DATABASE_HOST=localhost, DATABASE_PORT=5432
const result = buildConfigWithSchema({ env: process.env, schema, prefix: 'APP' });

// Result matches schema structure exactly:
// {
//   portNumber: 3000,
//   log: { level: 'debug', path: '/var/log' },
//   database: { host: 'localhost', port: 5432, ssl: false }
// }

// TypeScript knows: result.portNumber is number, result.log.level is 'debug' | 'info' | 'warn' | 'error'
```

### Merging Configurations

```typescript
import { override } from 'objectenvy';

const defaults = {
  port: 3000,
  debug: false
};

const envConfig = objectify({ env: process.env, prefix: 'APP' });

// Override defaults with environment config
const result = override(defaults, envConfig);
```

### Custom Delimiter for Nesting

By default, each underscore creates a new nesting level. Use `delimiter: '__'` for double-underscore nesting:

```typescript
// Given: LOG__LEVEL=debug, LOG__FILE_PATH=/var/log
const result = objectify({ env: process.env, delimiter: '__' });

// Result: { log: { level: 'debug', filePath: '/var/log' } }
// Note: Single underscores become camelCase within the segment
```

### Non-Nesting Prefixes (Smart Nesting)

Some leading key segments are commonly used as qualifiers rather than grouping prefixes. To keep these flat, objectenvy avoids nesting when the first segment is one of:

`max`, `min`, `is`, `enable`, `disable`

This applies to smart nesting (when no schema is provided). Schema-guided nesting always follows the schema and is unaffected.

```typescript
// Given:
// MAX_CONNECTIONS=100
// MAX_TIMEOUT=30
// IS_DEBUG=true
// ENABLE_FEATURE_X=true
// DISABLE_CACHE=false

const result = objectify({ env: process.env });

// Result (flat keys):
// {
//   maxConnections: 100,
//   maxTimeout: 30,
//   isDebug: true,
//   enableFeatureX: true,
//   disableCache: false
// }

// You can customize the list:
const custom = objectify({ env: process.env, nonNestingPrefixes: ['flag', 'has'] });
```

### Disable Type Coercion

```typescript
const result = objectify({ env: process.env, coerce: false });
// All values remain strings
```

## API Reference

### `objectify(options)`

Parse environment variables into a nested config object.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | `NodeJS.ProcessEnv` | `process.env` | Custom environment object |
| `prefix` | `string` | - | Only include vars starting with this prefix |
| `schema` | `z.ZodType` | - | Zod schema for validation, type inference, and structure guidance |
| `coerce` | `boolean` | `true` | Auto-convert strings to numbers/booleans |
| `delimiter` | `string` | `'_'` | Delimiter for nesting (e.g., `'__'` for double underscore) |
| `nonNestingPrefixes` | `string[]` | `['max','min','is','enable','disable']` | First segments that should never trigger nesting in smart mode. Does not apply when `schema` is provided. |

### `override(defaults, config)`

Merge config objects, with the second argument overriding the first.

```typescript
const defaults = { port: 3000, debug: false };
const config = { debug: true };
const result = override(defaults, config);
// { port: 3000, debug: true }
```

## Type Utilities

objectenvy exports type utilities to help with type-safe environment variable handling:

### `ToEnv<T>`

Convert a nested config type to a flat SCREAMING_SNAKE_CASE env record. **Preserves string literal and template literal types** for compile-time validation:

```typescript
import type { ToEnv } from 'objectenvy';

type Config = {
  portNumber: number;
  log: {
    level: 'debug' | 'info' | 'warn' | 'error'; // Union types preserved!
    path: string;
  };
  apiUrl: `https://${string}`; // Template literals preserved!
};

type Env = ToEnv<Config>;
// {
//   PORT_NUMBER: `${number}`;
//   LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'; // ✓ Type-safe!
//   LOG_PATH: string;
//   API_URL: `https://${string}`; // ✓ Enforces https:// pattern!
// }
```

This feature enables:
- **Compile-time validation** of environment values
- **IDE autocomplete** for valid configuration options
- **Pattern enforcement** via template literal types
- **Self-documenting** configuration with explicit allowed values
```

### `FromEnv<T>`

Convert flat env keys to camelCase (uses type-fest's `CamelCasedPropertiesDeep`):

```typescript
import type { FromEnv } from 'objectenvy';

type Env = { PORT_NUMBER: string; LOG_LEVEL: string };
type Config = FromEnv<Env>;
// { portNumber: string; logLevel: string }
```

### `WithPrefix<T, P>` / `WithoutPrefix<T, P>`

Add or remove prefixes from env keys:

```typescript
import type { WithPrefix, WithoutPrefix } from 'objectenvy';

type Env = { PORT: string; DEBUG: string };
type PrefixedEnv = WithPrefix<Env, 'APP'>;
// { APP_PORT: string; APP_DEBUG: string }

type Unprefixed = WithoutPrefix<PrefixedEnv, 'APP'>;
// { PORT: string; DEBUG: string }
```

### `SchemaToEnv<T>`

Extract env type from a Zod schema's inferred type:

```typescript
import type { SchemaToEnv } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({
  port: z.number(),
  log: z.object({ level: z.string() })
});

type Env = SchemaToEnv<z.infer<typeof schema>>;
// { PORT: string; LOG_LEVEL: string }
```

## Type Coercion Rules

| Input | Output |
|-------|--------|
| `'true'`, `'TRUE'`, `'True'` | `true` |
| `'false'`, `'FALSE'`, `'False'` | `false` |
| `'123'`, `'-42'` | `123`, `-42` (integers) |
| `'3.14'`, `'-2.5'` | `3.14`, `-2.5` (floats) |
| Other strings | Unchanged |

## License

MIT
